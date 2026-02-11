#!/usr/bin/env python3
"""Seed script to populate demo data for Schützenzug Manager"""

import os
import sys
from datetime import datetime, timezone
from pymongo import MongoClient
import uuid

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

client = MongoClient(mongo_url)
db = client[db_name]

def clear_collections():
    """Clear existing data"""
    print("Clearing existing data...")
    db.members.delete_many({})
    db.fine_types.delete_many({})
    db.fines.delete_many({})
    print("✓ Collections cleared")

def seed_members():
    """Create demo members"""
    print("\nCreating members...")
    members = [
        {"id": str(uuid.uuid4()), "name": "Max Müller", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Timo Schmidt", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Jens Weber", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Oliver Fischer", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Lisa Bauer", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    db.members.insert_many(members)
    print(f"✓ Created {len(members)} members")
    return members

def seed_fine_types():
    """Create demo fine types"""
    print("\nCreating fine types...")
    fine_types = [
        {"id": str(uuid.uuid4()), "label": "Zu spät", "amount": 2.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "label": "Fehltermin", "amount": 5.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "label": "Quatsch gemacht", "amount": 1.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "label": "Vergessen", "amount": 3.0, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "label": "Sonstiges", "amount": None, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    db.fine_types.insert_many(fine_types)
    print(f"✓ Created {len(fine_types)} fine types")
    return fine_types

def seed_fines(members, fine_types):
    """Create demo fines"""
    print("\nCreating fines...")
    
    import random
    from datetime import timedelta
    
    fines = []
    current_year = datetime.now(timezone.utc).year
    
    # Create fines for current year
    for i in range(15):
        member = random.choice(members)
        fine_type = random.choice(fine_types)
        
        # Random date in current year
        days_ago = random.randint(1, 90)
        date = datetime.now(timezone.utc) - timedelta(days=days_ago)
        
        amount = fine_type['amount'] if fine_type['amount'] is not None else random.uniform(1, 10)
        
        fine = {
            "id": str(uuid.uuid4()),
            "member_id": member['id'],
            "fine_type_id": fine_type['id'],
            "fine_type_label": fine_type['label'],
            "amount": round(amount, 2),
            "year": current_year,
            "date": date.isoformat(),
            "notes": None
        }
        fines.append(fine)
    
    # Create some fines for last year
    for i in range(8):
        member = random.choice(members)
        fine_type = random.choice(fine_types)
        
        days_ago = random.randint(365, 450)
        date = datetime.now(timezone.utc) - timedelta(days=days_ago)
        
        amount = fine_type['amount'] if fine_type['amount'] is not None else random.uniform(1, 10)
        
        fine = {
            "id": str(uuid.uuid4()),
            "member_id": member['id'],
            "fine_type_id": fine_type['id'],
            "fine_type_label": fine_type['label'],
            "amount": round(amount, 2),
            "year": current_year - 1,
            "date": date.isoformat(),
            "notes": None
        }
        fines.append(fine)
    
    db.fines.insert_many(fines)
    print(f"✓ Created {len(fines)} fines")

def main():
    print("=" * 50)
    print("Schützenzug Manager - Demo Data Seeder")
    print("=" * 50)
    
    clear_collections()
    members = seed_members()
    fine_types = seed_fine_types()
    seed_fines(members, fine_types)
    
    print("\n" + "=" * 50)
    print("✓ Demo data seeded successfully!")
    print("=" * 50)
    print("\nYou can now login with:")
    print("Password: admin123")

if __name__ == "__main__":
    main()
