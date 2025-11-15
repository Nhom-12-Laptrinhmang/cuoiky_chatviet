from flask import Blueprint, request, jsonify
from services.auth_service import decode_token
from models.user_model import User

auth_me_bp = Blueprint('auth_me', __name__, url_prefix='/auth/me')

@auth_me_bp.route('', methods=['GET'])
def auth_me():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    token = auth.split(' ', 1)[1]
    payload = decode_token(token)
    if not payload or not payload.get('user_id'):
        return jsonify({'error': 'Unauthorized'}), 401
    user = User.query.get(payload['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'id': user.id,
        'username': user.username,
        'display_name': user.display_name if getattr(user, 'display_name', None) else user.username,
        'avatar_url': user.avatar_url,
        'status': user.status,
        'gender': getattr(user, 'gender', None),
        'birthdate': user.birthdate.isoformat() if getattr(user, 'birthdate', None) and hasattr(user.birthdate, 'isoformat') else (user.birthdate if user.birthdate else None),
        'phone_number': getattr(user, 'phone_number', None),
    })
