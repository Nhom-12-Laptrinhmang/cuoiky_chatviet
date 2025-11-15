from flask import Blueprint, request, jsonify
from services.auth_service import login_user, decode_token
from models.user_model import User
from flask import current_app

auth_login_bp = Blueprint('auth_login', __name__, url_prefix='/login')

@auth_login_bp.route('', methods=['POST'])
def login():
    data = request.get_json()
    print(f"[LOGIN] username={data.get('username')}")
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        print("[LOGIN] Missing username or password")
        return jsonify({'error': 'Missing username or password'}), 400
    result = login_user(username, password)
    print(f"[LOGIN] success={result.get('success')}")
    # if success, add minimal user_info
    user = None
    if result.get('success'):
        # decode token to get user id
        token = result.get('token')
        payload = decode_token(token)
        if payload and payload.get('user_id'):
            user = User.query.get(payload.get('user_id'))
        result['user_info'] = {
            'id': user.id if user else None,
            'username': user.username if user else username,
            'display_name': user.display_name if user else username,
            'avatar_url': user.avatar_url if user else None,
        }
        print(f"[LOGIN] ✅ user_id={user.id if user else None}")
    else:
        print(f"[LOGIN] ❌ Failed - incorrect credentials")
    return jsonify(result), (200 if result.get('success') else 401)
