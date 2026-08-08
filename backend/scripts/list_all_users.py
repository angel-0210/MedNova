import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.database.models import User
from app.database.session import async_session_factory

async def main():
    async with async_session_factory() as session:
        users = (await session.execute(select(User))).scalars().all()
        print("DATABASE USERS:")
        for u in users:
            print(f"Name: {u.name} | Email: {u.email} | Role: {u.role} | Active: {u.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
