import asyncio
from sqlalchemy import text
from app.database.session import engine

async def check():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT hospital_id, name, hospital_code FROM hospitals"))
        rows = result.fetchall()
        print("HOSPITALS IN DATABASE:")
        for r in rows:
            print(f"ID: {r[0]} | Name: {r[1]} | Code: {r[2]}")

if __name__ == "__main__":
    asyncio.run(check())
