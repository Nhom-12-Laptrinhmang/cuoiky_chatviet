from flask import Blueprint, request, jsonify, current_app
from services.auth_service import register_user, create_token_for_user
from models.user_model import User

auth_register_bp = Blueprint('auth_register', __name__, url_prefix='/register')


@auth_register_bp.route('', methods=['POST'])
def register():
    data = request.get_json() or {}
    print(f"[REGISTER] username={data.get('username')}")
    username = data.get('username')
    password = data.get('password')
    display_name = data.get('display_name')
    if not username or not password:
        print("[REGISTER] Missing username or password")
        return jsonify({'error': 'Missing username or password'}), 400

    result = register_user(username, password, display_name)
    print(f"[REGISTER] success={result.get('success')}")
    if not result.get('success'):
        return jsonify(result), 400

    # After creating the user, create a token and return minimal user info
    user = User.query.filter_by(username=username).first()
    if not user:
        print("[REGISTER] user lookup failed")
        return jsonify({'error': 'Registration succeeded but user lookup failed'}), 500

    token = create_token_for_user(user)
    response_data = {'success': True, 'message': 'User registered', 'user_id': user.id, 'token': token, 'user_info': {'id': user.id, 'username': user.username, 'display_name': user.display_name, 'avatar_url': user.avatar_url}}
    print(f"[REGISTER] user_id={user.id} token=... (truncated)")
    return jsonify(response_data), 200
