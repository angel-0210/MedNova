"""Auth/RBAC regression checks. No network, no DB -- pure contract + role logic."""
import uuid
import pytest
from pydantic import ValidationError

from app.core.exceptions import PermissionDeniedException
from app.core.security import RequireRole
from app.database.models import User
from app.schemas.auth import RegisterRequest, RefreshRequest, PasswordResetRequest
from app.schemas.entities import StaffCreate


def make_user(role):
    return User(user_id=uuid.uuid4(), hospital_id=uuid.uuid4(), name="T",
                email="t@x.io", role=role, is_active=True)


def test_require_role_allows_and_denies():
    assert RequireRole(["admin"])(make_user("admin")).role == "admin"
    with pytest.raises(PermissionDeniedException):
        RequireRole(["admin"])(make_user("nurse"))


def test_require_role_is_case_insensitive():
    assert RequireRole(["admin"])(make_user("Admin ")) is not None


def test_register_cannot_self_assign_admin():
    base = dict(email="a@b.io", password="pw123456", name="A", hospital_code="MEDNOVA01")
    assert RegisterRequest(role="nurse", **base).role == "nurse"
    with pytest.raises(ValidationError):
        RegisterRequest(role="admin", **base)


def test_refresh_and_reset_take_a_json_body():
    # These were bare `str` params, which FastAPI reads from the query string --
    # the mobile client posts JSON, so every refresh 422'd and logged the user out.
    assert RefreshRequest(refresh_token="abc").refresh_token == "abc"
    assert PasswordResetRequest(email="a@b.io").email == "a@b.io"


def test_staff_create_validates_role_and_password():
    base = dict(name="A", email="a@b.io", password="pw123456")
    # Unlike self-registration, an admin may mint another admin.
    assert StaffCreate(role="admin", **base).role == "admin"
    with pytest.raises(ValidationError):
        StaffCreate(role="janitor", **base)
    with pytest.raises(ValidationError):
        StaffCreate(role="nurse", name="A", email="a@b.io", password="short")


def test_staff_create_cannot_smuggle_a_hospital_id():
    # hospital_id comes from the caller's token. If the schema ever started accepting
    # it from the body, an admin could seed users into someone else's tenant.
    staff = StaffCreate(name="A", email="a@b.io", password="pw123456",
                        role="nurse", hospital_id=str(uuid.uuid4()))
    assert "hospital_id" not in staff.model_dump()


def test_db_outage_is_503_not_401():
    """
    A login that fails because the database is unreachable must not be reported as bad
    credentials. Render was down for days behind a 401 that said "Invalid email or
    password", so this pins the distinction.
    """
    import inspect
    from app.api.v1.endpoints import auth as auth_module

    src = inspect.getsource(auth_module.login)
    assert "SQLAlchemyError" in src, "login must handle database errors separately"

    # The SQLAlchemyError handler has to come before the catch-all, or it never runs.
    assert src.index("except SQLAlchemyError") < src.index("except Exception"), \
        "SQLAlchemyError must be caught before the generic Exception handler"
    assert "HTTP_503_SERVICE_UNAVAILABLE" in src


# =========================================================================
# PATIENT SUMMARY REPORT
# =========================================================================

class _Stub:
    def __init__(self, **kw):
        self.__dict__.update(kw)


def test_next_steps_escalate_above_a_stale_risk_score():
    """
    The risk score reflects only the newest reading, so a record can read 'low' while a
    critical alert is still open. The report must not answer that with "continue routine
    monitoring" -- next steps key off the worse of the two.
    """
    from app.services.report_service import effective_risk_level, NEXT_STEPS

    ctx = {
        "prediction": _Stub(risk_level="low"),
        "open_alerts": [_Stub(alert_type="critical"), _Stub(alert_type="medium")],
    }
    assert effective_risk_level(ctx) == "critical"
    assert "bedside now" in NEXT_STEPS["critical"][0]

    # No open alerts -> the model's own level stands.
    assert effective_risk_level({"prediction": _Stub(risk_level="medium"), "open_alerts": []}) == "medium"
    # A milder alert must never drag a high score downwards.
    assert effective_risk_level({
        "prediction": _Stub(risk_level="high"),
        "open_alerts": [_Stub(alert_type="low")],
    }) == "high"
    # Nothing on record at all.
    assert effective_risk_level({"prediction": None, "open_alerts": []}) == "normal"


def test_report_never_hard_fails_without_a_gemini_key():
    """A missing API key must degrade to the deterministic narrative, not raise."""
    import asyncio
    from app.services import report_service

    original = report_service.settings.GEMINI_API_KEY
    try:
        report_service.settings.GEMINI_API_KEY = ""
        assert asyncio.run(report_service._narrative_via_gemini("Age: 40")) is None
    finally:
        report_service.settings.GEMINI_API_KEY = original


def test_report_carries_a_medical_disclaimer():
    from app.services.report_service import DISCLAIMER
    assert "not a diagnosis" in DISCLAIMER
    assert "qualified clinician" in DISCLAIMER
