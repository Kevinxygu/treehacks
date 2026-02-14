"""
Elder Care Agent - MongoDB Seed Script
---------------------------------------
Seeds the MongoDB database with demo data.

Usage:
    uv run python seed_db.py
"""

import os
import sys

from dotenv import load_dotenv

load_dotenv()

try:
    from pymongo import MongoClient
except ImportError:
    print("ERROR: pymongo is not installed. Run: uv sync")
    sys.exit(1)

uri = os.environ.get("MONGODB_CONNECTION_STRING", "")
if not uri:
    print("ERROR: MONGODB_CONNECTION_STRING is not set.")
    print("Set it in .env or pass it as an environment variable.")
    sys.exit(1)


def seed():
    client = MongoClient(uri)
    db = client["elder_care"]

    print("Connected to MongoDB.")

    # Drop existing collections for a clean seed
    for name in [
        "medications",
        "medication_log",
        "emergency_contacts",
        "bill_reminders",
        "user_profile",
    ]:
        if name in db.list_collection_names():
            db[name].drop()
            print(f"  Dropped existing collection: {name}")

    # --- User Profile ---
    db["user_profile"].insert_one(
        {
            "name": "Margaret Johnson",
            "date_of_birth": "1945-03-15",
            "allergies": "Penicillin, Shellfish",
            "primary_doctor": "Dr. Robert Smith",
            "pharmacy_name": "CVS Pharmacy",
            "pharmacy_phone": "555-0199",
            "notes": "Prefers morning appointments",
        }
    )
    print("  Seeded: user_profile (1 document)")

    # --- Medications ---
    db["medications"].insert_many(
        [
            {
                "name": "Metformin",
                "dosage": "500mg",
                "frequency": "Twice daily",
                "time_of_day": "8:00 AM, 8:00 PM",
                "start_date": "2024-01-15",
                "prescribing_doctor": "Dr. Smith",
                "notes": "Take with food",
            },
            {
                "name": "Lisinopril",
                "dosage": "10mg",
                "frequency": "Once daily",
                "time_of_day": "8:00 AM",
                "start_date": "2024-03-01",
                "prescribing_doctor": "Dr. Smith",
                "notes": "Blood pressure medication",
            },
            {
                "name": "Atorvastatin",
                "dosage": "20mg",
                "frequency": "Once daily",
                "time_of_day": "9:00 PM",
                "start_date": "2024-03-01",
                "prescribing_doctor": "Dr. Smith",
                "notes": "Cholesterol - take at bedtime",
            },
            {
                "name": "Vitamin D3",
                "dosage": "2000 IU",
                "frequency": "Once daily",
                "time_of_day": "8:00 AM",
                "start_date": "2024-06-01",
                "prescribing_doctor": "Dr. Smith",
                "notes": "Supplement",
            },
        ]
    )
    print("  Seeded: medications (4 documents)")

    # --- Emergency Contacts ---
    db["emergency_contacts"].insert_many(
        [
            {
                "name": "Sarah Johnson",
                "phone": "555-0101",
                "relation": "Daughter",
                "is_primary": True,
            },
            {
                "name": "Dr. Robert Smith",
                "phone": "555-0202",
                "relation": "Primary Care Physician",
                "is_primary": False,
            },
            {
                "name": "Mike Thompson",
                "phone": "555-0303",
                "relation": "Neighbor / Emergency Contact",
                "is_primary": False,
            },
            {
                "name": "David Johnson",
                "phone": "555-0404",
                "relation": "Son",
                "is_primary": False,
            },
        ]
    )
    print("  Seeded: emergency_contacts (4 documents)")

    # --- Bill Reminders ---
    db["bill_reminders"].insert_many(
        [
            {
                "name": "Electric Bill",
                "due_date": "2026-02-20",
                "amount": 85.00,
                "paid": False,
                "recurrence": "monthly",
            },
            {
                "name": "Medicare Part B",
                "due_date": "2026-02-25",
                "amount": 174.70,
                "paid": False,
                "recurrence": "monthly",
            },
            {
                "name": "Phone Bill",
                "due_date": "2026-03-01",
                "amount": 45.00,
                "paid": False,
                "recurrence": "monthly",
            },
            {
                "name": "Home Insurance",
                "due_date": "2026-03-15",
                "amount": 125.00,
                "paid": False,
                "recurrence": "quarterly",
            },
        ]
    )
    print("  Seeded: bill_reminders (4 documents)")

    client.close()
    print("\nDone! Database 'elder_care' is ready.")


if __name__ == "__main__":
    seed()
