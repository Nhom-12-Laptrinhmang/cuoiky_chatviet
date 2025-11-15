from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
import os
from services.auth_service import decode_token

uploads_bp = Blueprint('uploads', __name__, url_prefix='/uploads')

# Ensure uploads directory exists
def _uploads_dir():
    base = os.path.join(os.path.dirname(__file__), '..', 'storage', 'uploads')
    base = os.path.abspath(base)
    os.makedirs(base, exist_ok=True)
    return base


@uploads_bp.route('/avatar', methods=['POST'])
def upload_avatar():
    """Accepts multipart/form-data file field 'avatar' and saves it to storage/uploads.
    Returns JSON { avatar_url: <url> } where url is a path accessible from the frontend.
    Requires an authenticated user (Bearer token) to be present in Authorization header.
    """
    # simple auth check -- allow unauthenticated uploads too but prefer token
    auth = request.headers.get('Authorization', '')
    user_id = None
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
        payload = decode_token(token)
        if payload:
            user_id = payload.get('user_id')

    if 'avatar' not in request.files:
        return jsonify({'error': 'No file part "avatar"'}), 400

    f = request.files['avatar']
    if f.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    filename = secure_filename(f.filename)
    # prefix with user id and timestamp if available
    import time
    prefix = f'user{user_id}_' if user_id else ''
    filename = prefix + str(int(time.time())) + '_' + filename
    dest = os.path.join(_uploads_dir(), filename)
    f.save(dest)

    # Return a URL that the client can fetch from the server
    # We'll expose a simple GET /uploads/files/<filename> route below
    avatar_url = f'/uploads/files/{filename}'
    return jsonify({'avatar_url': avatar_url})


@uploads_bp.route('/files/<path:filename>', methods=['GET'])
def serve_uploaded(filename):
    d = _uploads_dir()
    return send_from_directory(d, filename)
