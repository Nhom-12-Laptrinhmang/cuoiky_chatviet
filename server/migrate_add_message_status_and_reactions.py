"""
Migration: Add `status` column to `message` table and create `message_reaction` table.
Run: python3 migrate_add_message_status_and_reactions.py
"""

import sys
import os
import logging
sys.path.insert(0, '.')

from config.database import db
from flask import Flask
from sqlalchemy import text

# Initialize logging for this migration script
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app for migration
app = Flask(__name__)
base_dir = os.path.dirname(os.path.abspath(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(base_dir, "storage", "chatapp.db")}'
db.init_app(app)


def migrate():
    with app.app_context():
        inspector = db.inspect(db.engine)
        cols = [c['name'] for c in inspector.get_columns('message')]

        if 'status' not in cols:
            logger.info('Adding status column to message...')
            db.session.execute(text("ALTER TABLE message ADD COLUMN status VARCHAR(20) DEFAULT 'sent'"))
            logger.info('status column added')
        else:
            logger.info('status column already exists')

        # Create message_reaction table if not exists (SQLite simple DDL)
        tables = inspector.get_table_names()
        if 'message_reaction' not in tables:
            logger.info('Creating message_reaction table...')
            db.session.execute(text('''
                CREATE TABLE message_reaction (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    message_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    reaction_type VARCHAR(50) NOT NULL,
                    created_at DATETIME DEFAULT (datetime('now')),
                    FOREIGN KEY(message_id) REFERENCES message(id),
                    FOREIGN KEY(user_id) REFERENCES user(id)
                )
            '''))
            logger.info('message_reaction table created')
        else:
            logger.info('message_reaction table already exists')

        db.session.commit()
        logger.info('Migration completed')


if __name__ == '__main__':
    migrate()
