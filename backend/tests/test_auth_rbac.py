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
