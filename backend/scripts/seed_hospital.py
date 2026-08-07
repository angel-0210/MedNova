"""Seed one hospital so /api/v1/auth/register has a valid hospital_code to link against.

Run from backend/:  .venv/Scripts/python.exe scripts/seed_hospital.py
Idempotent - re-running leaves the existing row alone.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.database.models import Hospital
from app.database.session import async_session_factory

CODE = "MEDNOVA01"
NAME = "MedNova General Hospital"


async def main() -> None:
    async with async_session_factory() as session:
        existing = await session.scalar(
            select(Hospital).where(Hospital.hospital_code == CODE)
        )
        if existing:
            print(f"Hospital already present: {existing.hospital_code} ({existing.name})")
            return

        session.add(Hospital(name=NAME, hospital_code=CODE, address="1 Clinical Way"))
        await session.commit()
        print(f"Seeded hospital: {CODE} ({NAME})")


if __name__ == "__main__":
    asyncio.run(main())
