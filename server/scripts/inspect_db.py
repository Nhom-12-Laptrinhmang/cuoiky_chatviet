"""Quick script to inspect the SQLite database and print sample rows.

Run from project root:
  python3 server/scripts/inspect_db.py

This uses the app context so it imports models from `server/models`.
"""
import os, sys
# Ensure project root is on sys.path so `app` and `config` import correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app
from config.database import db
import json

def sample(table, limit=5):
    try:
        # quote table name in case it's a reserved word (e.g. "group")
        q = db.session.execute(db.text(f'SELECT * FROM "{table}" LIMIT :l'), {'l': limit})
        # SQLAlchemy Row has a _mapping attribute we can convert to dict safely
        rows = [dict(r._mapping) for r in q]
        return rows
    except Exception as e:
        return {'error': str(e)}

def main():
    with app.app_context():
        print('Database file:', app.config.get('SQLALCHEMY_DATABASE_URI'))
        tables = [
            'user', 'friend', 'group', 'group_member', 'message', 'message_reaction', 'sticker', 'contact_sync', 'contact'
        ]
        for t in tables:
            print('\n== Table:', t, '==')
            rows = sample(t, limit=5)
            if isinstance(rows, dict) and rows.get('error'):
                print('  Could not query table:', rows.get('error'))
            else:
                for r in rows:
                    # pretty-print small dict
                    print('  ', json.dumps(r, default=str, ensure_ascii=False))

if __name__ == '__main__':
    main()
