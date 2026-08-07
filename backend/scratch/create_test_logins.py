import asyncio
import uuid
from supabase import create_client, Client
from sqlalchemy import text
from app.core.config import settings
from app.database.session import engine

# Initialize Supabase client with Service Role Key (Admin privileges)
supabase_client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)

test_users = [
    {
        "email": "admin@mednova.io",
        "password": "password123",
        "name": "Admin Test",
        "role": "admin"
    },
    {
        "email": "doctor@mednova.io",
        "password": "password123",
        "name": "Dr. Test",
        "role": "doctor"
    },
    {
        "email": "nurse@mednova.io",
        "password": "password123",
        "name": "Nurse Test",
        "role": "nurse"
    },
    {
        "email": "attendant@mednova.io",
        "password": "password123",
        "name": "Attendant Test",
        "role": "attendant"
    }
]

async def create_logins():
    hospital_id = uuid.UUID("fbec644c-9b8c-4876-b31e-1af307129ce7")
    
    for u in test_users:
        email = u["email"]
        password = u["password"]
        name = u["name"]
        role = u["role"]
        
        print(f"Processing user: {email} ({role})...")
        
        async with engine.begin() as conn:
            # Check if user already exists in public.users
            result = await conn.execute(
                text("SELECT user_id FROM users WHERE email = :email"),
                {"email": email}
            )
            row = result.fetchone()
            
            if row:
                print(f"User {email} already exists locally with ID {row[0]}.")
                continue
                
        # Register user in Supabase Auth (with email pre-confirmed)
        try:
            auth_response = supabase_client.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "role": role,
                    "hospital_id": str(hospital_id),
                    "name": name
                }
            })
            
            auth_user_id = uuid.UUID(auth_response.user.id)
            print(f"Supabase auth user created with ID {auth_user_id}.")
            
            # Insert profile into public.users
            async with engine.begin() as conn:
                await conn.execute(
                    text("""
                        INSERT INTO users (user_id, hospital_id, name, email, role, is_active, created_at, updated_at)
                        VALUES (:user_id, :hospital_id, :name, :email, :role, TRUE, NOW(), NOW())
                    """),
                    {
                        "user_id": auth_user_id,
                        "hospital_id": hospital_id,
                        "name": name,
                        "email": email,
                        "role": role
                    }
                )
                print(f"User {email} profile successfully synced to public database.")
                
        except Exception as e:
            # If the user already exists in Supabase auth but not locally, handle it
            if "already exists" in str(e) or "already registered" in str(e):
                print(f"User {email} already exists in Supabase Auth. Attempting to retrieve or sync.")
                # We can list users to find their ID
                try:
                    users_list = supabase_client.auth.admin.list_users()
                    target_user = None
                    for su in users_list:
                        if su.email == email:
                            target_user = su
                            break
                    if target_user:
                        auth_user_id = uuid.UUID(target_user.id)
                        async with engine.begin() as conn:
                            await conn.execute(
                                text("""
                                    INSERT INTO users (user_id, hospital_id, name, email, role, is_active, created_at, updated_at)
                                    VALUES (:user_id, :hospital_id, :name, :email, :role, TRUE, NOW(), NOW())
                                """),
                                {
                                    "user_id": auth_user_id,
                                    "hospital_id": hospital_id,
                                    "name": name,
                                    "email": email,
                                    "role": role
                                }
                            )
                            print(f"Synced pre-existing auth user {email} locally.")
                    else:
                        print("Failed to find pre-existing auth user in list.")
                except Exception as ex:
                    print(f"Failed to resolve pre-existing user: {ex}")
            else:
                print(f"Failed to create user {email}: {e}")

if __name__ == "__main__":
    asyncio.run(create_logins())
