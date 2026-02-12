#!/usr/bin/env python3
"""Create initial users for the system"""

import os
import sys
from pymongo import MongoClient
import uuid
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

client = MongoClient(mongo_url)
db = client[db_name]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_users():
    print("=" * 50)
    print("Creating Users...")
    print("=" * 50)
    
    # Clear existing users
    db.users.delete_many({})
    print("✓ Existing users cleared")
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password_hash": pwd_context.hash("admin123"),
        "role": "admin",
        "created_at": "2024-01-01T00:00:00"
    }
    db.users.insert_one(admin_user)
    print(f"✓ Admin user created: username=admin, password=admin123")
    
    # Create vorstand user
    vorstand_user = {
        "id": str(uuid.uuid4()),
        "username": "vorstand",
        "password_hash": pwd_context.hash("vorstand123"),
        "role": "vorstand",
        "created_at": "2024-01-01T00:00:00"
    }
    db.users.insert_one(vorstand_user)
    print(f"✓ Vorstand user created: username=vorstand, password=vorstand123")
    
    print("\n" + "=" * 50)
    print("✓ Users created successfully!")
    print("=" * 50)
    print("\nLogin credentials:")
    print("  Admin:    username=admin, password=admin123")
    print("  Vorstand: username=vorstand, password=vorstand123")

if __name__ == "__main__":
    create_users()
