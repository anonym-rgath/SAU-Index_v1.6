#!/usr/bin/env python3
"""
Script zum Aktualisieren der Benutzer in der Datenbank.
Entfernt alte Benutzer (spiess, vorstand) und erstellt neue.
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def update_users():
    # Connect to MongoDB
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Alte Benutzer entfernen (spiess und vorstand)
    result = await db.users.delete_many({"username": {"$in": ["spiess", "vorstand"]}})
    print(f"Entfernte Benutzer: {result.deleted_count}")
    
    # Neue Benutzer anlegen
    new_users = [
        {
            "id": str(uuid.uuid4()),
            "username": "Henrik Dinslage",
            "password_hash": pwd_context.hash("rheinzel2025"),
            "role": "spiess",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "Marius Geduldig",
            "password_hash": pwd_context.hash("rheinzel2025"),
            "role": "vorstand",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for user in new_users:
        # Prüfen ob Benutzer bereits existiert
        existing = await db.users.find_one({"username": user["username"]})
        if existing:
            print(f"Benutzer '{user['username']}' existiert bereits, überspringe...")
            continue
        
        await db.users.insert_one(user)
        print(f"Benutzer erstellt: {user['username']} (Rolle: {user['role']})")
    
    # Alle Benutzer anzeigen
    print("\n--- Aktuelle Benutzer ---")
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    for u in users:
        print(f"  - {u['username']} ({u['role']})")
    
    client.close()
    print("\nFertig!")

if __name__ == "__main__":
    asyncio.run(update_users())
