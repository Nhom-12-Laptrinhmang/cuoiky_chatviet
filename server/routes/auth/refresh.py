from flask import Blueprint, request, jsonify
from services.auth_service import decode_token, login_user

auth_refresh_bp = Blueprint('auth_refresh', __name__, url_prefix='/refresh')

@auth_refresh_bp.route('', methods=['POST'])
def refresh_token():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Missing Bearer token'}), 400
    token = auth.split(' ', 1)[1]
    payload = decode_token(token)
    if not payload or not payload.get('user_id'):
        return jsonify({'error': 'Invalid token'}), 401
    # Issue a new token (simple approach: reuse login_user with user id)
    # We will lookup the user and create a new token via auth_service
    from models.user_model import User
    user = User.query.get(payload.get('user_id'))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    # create new token via login_user pattern (without password)
    from services.auth_service import create_token_for_user
    new_token = create_token_for_user(user)
    return jsonify({'success': True, 'token': new_token}), 200
