import os
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from config.database import db
from models.sticker_model import Sticker

stickers_bp = Blueprint('stickers', __name__, url_prefix='/stickers')

# ensure upload folder exists
def _ensure_folder(path):
    os.makedirs(path, exist_ok=True)


@stickers_bp.route('/', methods=['GET'])
def list_stickers():
    stickers = Sticker.query.order_by(Sticker.id.desc()).all()
    return jsonify([s.to_dict() for s in stickers])


@stickers_bp.route('/upload', methods=['POST'])
def upload_sticker():
    # multipart form: file, optional name, optional created_by
    if 'file' not in request.files:
        return jsonify({'error': 'no file provided'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'empty filename'}), 400

    filename = secure_filename(f.filename)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    uploads_dir = os.path.join(base_dir, 'storage', 'uploads', 'stickers')
    _ensure_folder(uploads_dir)

    dest_path = os.path.join(uploads_dir, filename)
    f.save(dest_path)

    # construct a relative URL that the client can request via uploads files route
    # Use /uploads/files/stickers/<filename> so it maps under the existing uploads blueprint
    file_url = f'/uploads/files/stickers/{filename}'

    name = request.form.get('name') or filename
    created_by = request.form.get('created_by')

    sticker = Sticker(name=name, file_url=file_url, created_by=created_by)
    db.session.add(sticker)
    db.session.commit()

    return jsonify({'sticker': sticker.to_dict()})


@stickers_bp.route('/<int:sticker_id>', methods=['GET'])
def get_sticker(sticker_id):
    s = Sticker.query.get_or_404(sticker_id)
    return jsonify(s.to_dict())
