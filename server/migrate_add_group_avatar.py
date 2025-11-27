#!/usr/bin/env python3
"""
Migration: add `avatar_url` and `allow_edit_name_avatar` columns to `group` table
Run: python3 migrate_add_group_avatar.py
"""

import sys
import os
sys.path.insert(0, '.')

from config.database import db
from flask import Flask
from sqlalchemy import text

app = Flask(__name__)
base_dir = os.path.dirname(os.path.abspath(__file__))
# use same DB as app
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(base_dir, 'storage', 'chatapp.db')}"
db.init_app(app)

def migrate():
    with app.app_context():
        inspector = db.inspect(db.engine)
        try:
            cols = [c['name'] for c in inspector.get_columns('group')]
        except Exception:
            # if table name 'group' doesn't exist, try fallback 'groups'
            try:
                cols = [c['name'] for c in inspector.get_columns('groups')]
            except Exception as e:
                print('Could not inspect group table:', e)
                return

        # Add avatar_url if missing
        if 'avatar_url' not in cols:
            print('Adding avatar_url column to group table...')
            try:
                db.session.execute(text("ALTER TABLE `group` ADD COLUMN avatar_url VARCHAR(500)"))
                db.session.commit()
                print('✅ avatar_url added')
            except Exception as e:
                print('Failed to add avatar_url with `group` name, trying `groups`...')
                try:
                    db.session.execute(text("ALTER TABLE groups ADD COLUMN avatar_url VARCHAR(500)"))
                    db.session.commit()
                    print('✅ avatar_url added to groups')
                except Exception as e2:
                    print('Failed to add avatar_url:', e2)
        else:
            print('avatar_url already exists')

        # Add allow_edit_name_avatar if missing
        if 'allow_edit_name_avatar' not in cols:
            print('Adding allow_edit_name_avatar column to group table...')
            try:
                db.session.execute(text("ALTER TABLE `group` ADD COLUMN allow_edit_name_avatar BOOLEAN DEFAULT 1"))
                db.session.commit()
                print('✅ allow_edit_name_avatar added')
            except Exception as e:
                print('Failed to add allow_edit_name_avatar with `group` name, trying `groups`...')
                try:
                    db.session.execute(text("ALTER TABLE groups ADD COLUMN allow_edit_name_avatar BOOLEAN DEFAULT 1"))
                    db.session.commit()
                    print('✅ allow_edit_name_avatar added to groups')
                except Exception as e2:
                    print('Failed to add allow_edit_name_avatar:', e2)
        else:
            print('allow_edit_name_avatar already exists')

        # Add status column if missing
        if 'status' not in cols:
            print('Adding status column to group table...')
            try:
                db.session.execute(text("ALTER TABLE `group` ADD COLUMN status VARCHAR(32) DEFAULT 'offline'"))
                db.session.commit()
                print('✅ status added')
            except Exception as e:
                print('Failed to add status with `group` name, trying `groups`...')
                try:
                    db.session.execute(text("ALTER TABLE groups ADD COLUMN status VARCHAR(32) DEFAULT 'offline'"))
                    db.session.commit()
                    print('✅ status added to groups')
                except Exception as e2:
                    print('Failed to add status:', e2)
        else:
            print('status already exists')

if __name__ == '__main__':
    migrate()
