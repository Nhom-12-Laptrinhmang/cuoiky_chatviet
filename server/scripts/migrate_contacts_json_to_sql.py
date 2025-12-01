#!/usr/bin/env python3
"""
Migrate contact_sync.contacts_json to a proper Contact table for easier querying.

Run from project root:
  python3 server/scripts/migrate_contacts_json_to_sql.py

This creates a Contact table and moves each contact from JSON into relational rows.
"""
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from config.database import db
from models.contact_sync_model import ContactSync
from models.contact_model import Contact
import json


def migrate():
    with app.app_context():
        print("=" * 60)
        print("Migrating contacts_json to Contact table...")
        print("=" * 60)

        # Create Contact table if not exists
        try:
            Contact.__table__.create(db.engine, checkfirst=True)
            print("✓ Contact table created (or already exists)")
        except Exception as e:
            print(f"Warning creating Contact table: {e}")

        # Fetch all ContactSync records
        contact_syncs = ContactSync.query.all()
        print(f"\nFound {len(contact_syncs)} ContactSync records")

        total_contacts = 0
        for cs in contact_syncs:
            contacts_list = cs.get_contacts()
            print(f"\nUser {cs.user_id}: {len(contacts_list)} contacts")
            for phone in contacts_list:
                # Check if contact already exists (avoid duplicates)
                existing = Contact.query.filter_by(user_id=cs.user_id, phone_number=phone).first()
                if existing:
                    print(f"  - {phone} (already exists)")
                else:
                    c = Contact(user_id=cs.user_id, phone_number=phone)
                    db.session.add(c)
                    print(f"  + {phone} (added)")
                    total_contacts += 1

        # Commit all new contacts
        try:
            db.session.commit()
            print(f"\n✓ Successfully migrated {total_contacts} new contacts to Contact table")
        except Exception as e:
            db.session.rollback()
            print(f"✗ Error committing: {e}")
            return False

        # Optionally show sample rows
        print("\n== Sample contacts (first 10) ==")
        samples = Contact.query.limit(10).all()
        for s in samples:
            print(f"  User {s.user_id}: {s.phone_number}")

        print("\n" + "=" * 60)
        print("Migration complete!")
        print("=" * 60)
        return True


if __name__ == '__main__':
    success = migrate()
    sys.exit(0 if success else 1)
