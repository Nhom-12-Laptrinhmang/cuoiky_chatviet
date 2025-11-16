"""
Migration: Add message_type, sticker_id, sticker_url columns to Message table
Run: python3 migrate_add_sticker_type.py
"""

import sys
import os
sys.path.insert(0, '.')

from config.database import db
from models.message_model import Message
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

# Initialize Flask app for migration
app = Flask(__name__)
base_dir = os.path.dirname(os.path.abspath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(base_dir, "storage", "chatapp.db")}'
db.init_app(app)

def migrate():
    with app.app_context():
        # Check if columns already exist
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('message')]
        
        if 'message_type' not in columns:
            db.session.execute(text('ALTER TABLE message ADD COLUMN message_type VARCHAR(50) DEFAULT "text"'))
            print("✅ Added message_type column")
        else:
            print("⏭️  message_type column already exists")
        
        if 'sticker_id' not in columns:
            db.session.execute(text('ALTER TABLE message ADD COLUMN sticker_id VARCHAR(255)'))
            print("✅ Added sticker_id column")
        else:
            print("⏭️  sticker_id column already exists")
        
        if 'sticker_url' not in columns:
            db.session.execute(text('ALTER TABLE message ADD COLUMN sticker_url VARCHAR(500)'))
            print("✅ Added sticker_url column")
        else:
            print("⏭️  sticker_url column already exists")
        
        db.session.commit()
        print("✅ Migration completed successfully!")

if __name__ == '__main__':
    migrate()
