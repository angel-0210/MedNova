import asyncio
import sys
from pathlib import Path

# Add backend directory to system path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.session import engine
from app.database.models import Base

async def main() -> None:
    print("Connecting to database and creating tables...")
    async with engine.begin() as conn:
        # This will safely run CREATE TABLE IF NOT EXISTS on all models
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(main())
