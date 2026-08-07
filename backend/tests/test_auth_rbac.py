"""Auth/RBAC regression checks. No network, no DB -- pure contract + role logic."""
import uuid
import pytest
from pydantic import ValidationError

from app.core.exceptions import PermissionDeniedException
from app.core.security import RequireRole
from app.database.models import User
from app.schemas.auth import RegisterRequest, RefreshRequest, PasswordResetRequest


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
