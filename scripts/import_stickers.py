"""
Simple import script to copy a local folder of sticker images into server storage
and create Sticker DB records. Usage:

python3 scripts/import_stickers.py /path/to/folder --created-by 1

The script will copy files into server/storage/uploads/stickers and create rows in
`sticker` table. It requires the project's virtualenv / dependencies available.
"""

import os
import sys
import shutil
from pathlib import Path

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 scripts/import_stickers.py /path/to/folder [--created-by ID]')
        sys.exit(1)

    src = Path(sys.argv[1])
    if not src.exists() or not src.is_dir():
        print('Source folder does not exist or is not a directory')
        sys.exit(1)

    created_by = None
    if '--created-by' in sys.argv:
        i = sys.argv.index('--created-by')
        if i + 1 < len(sys.argv):
            created_by = sys.argv[i+1]

    # Ensure we run with project root on sys.path
    project_root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(project_root))

    from config.database import db
    from models.sticker_model import Sticker
    from flask import Flask

    app = Flask(__name__)
    base_dir = str(project_root / 'server')
    db_path = os.path.join(base_dir, 'storage', 'chatapp.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    db.init_app(app)

    uploads_dir = Path(base_dir) / 'storage' / 'uploads' / 'stickers'
    uploads_dir.mkdir(parents=True, exist_ok=True)

    copied = 0
    with app.app_context():
        for f in src.iterdir():
            if not f.is_file():
                continue
            if f.suffix.lower() not in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']:
                continue
            dest = uploads_dir / f.name
            # avoid clobbering existing
            if dest.exists():
                print(f'Skipping existing: {dest.name}')
                continue
            shutil.copy2(str(f), str(dest))
            file_url = f'/uploads/files/stickers/{dest.name}'
            s = Sticker(name=dest.name, file_url=file_url, created_by=created_by)
            db.session.add(s)
            copied += 1
        db.session.commit()
    print(f'Done. Copied and inserted {copied} stickers.')
