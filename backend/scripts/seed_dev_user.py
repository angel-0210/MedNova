"""Create a pre-confirmed dev login: Supabase auth user + matching public.users profile.

Uses the service-role admin API so the account skips email confirmation - a normal
/register sign-up leaves the user unconfirmed, and sign_in_with_password then fails.

Run from backend/:
    .venv/Scripts/python.exe scripts/seed_dev_user.py [email] [password]

Idempotent. Dev convenience only - do not point this at production.
"""
import asyncio
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from supabase import create_client

from app.core.config import settings
from app.database.models import Hospital, User
from app.database.session import async_session_factory

EMAIL = sys.argv[1] if len(sys.argv) > 1 else "doctor@mednova.io"
PASSWORD = sys.argv[2] if len(sys.argv) > 2 else "MedNova!Dev2026"
HOSPITAL_CODE = "MEDNOVA01"
ROLE = "doctor"
NAME = "Dr Test"


async def main() -> None:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)

    async with async_session_factory() as session:
        hospital = await session.scalar(
            select(Hospital).where(Hospital.hospital_code == HOSPITAL_CODE)
        )
        if not hospital:
            raise SystemExit(f"No hospital {HOSPITAL_CODE!r}; run seed_hospital.py first.")

        # Reuse the Supabase account if this email already exists.
        existing_auth = next(
            (u for u in supabase.auth.admin.list_users() if u.email == EMAIL), None
        )
        if existing_auth:
            auth_id = uuid.UUID(existing_auth.id)
            supabase.auth.admin.update_user_by_id(
                str(auth_id), {"password": PASSWORD, "email_confirm": True}
            )
            print(f"Reused existing auth user {EMAIL}, password reset.")
        else:
            created = supabase.auth.admin.create_user(
                {
                    "email": EMAIL,
                    "password": PASSWORD,
                    "email_confirm": True,
                    "user_metadata": {
                        "role": ROLE,
                        "hospital_id": str(hospital.hospital_id),
                        "name": NAME,
                    },
                }
            )
            if not created.user:
                raise SystemExit("Supabase admin create_user returned no user.")
            auth_id = uuid.UUID(created.user.id)
            print(f"Created auth user {EMAIL}.")

        # login() looks the profile up by the Supabase user id, so the ids must match.
        profile = await session.get(User, auth_id)
        if profile:
            profile.is_active = True
            print("Profile row already present.")
        else:
            session.add(
                User(
                    user_id=auth_id,
                    hospital_id=hospital.hospital_id,
                    name=NAME,
                    email=EMAIL,
                    password_hash=None,
                    role=ROLE,
                    is_active=True,
                )
            )
            print("Created profile row.")

        await session.commit()

    print(f"\nLogin with:\n  email:    {EMAIL}\n  password: {PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())
