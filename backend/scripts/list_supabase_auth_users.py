import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from supabase import create_client
from app.core.config import settings

async def main():
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    users = supabase.auth.admin.list_users()
    print("SUPABASE AUTH USERS:")
    for u in users:
        role = u.user_metadata.get("role", "none") if u.user_metadata else "none"
        print(f"Email: {u.email} | ID: {u.id} | Metadata Role: {role}")

if __name__ == "__main__":
    asyncio.run(main())
