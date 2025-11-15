from flask import Blueprint, request, jsonify
from services.auth_service import logout_user

auth_logout_bp = Blueprint('auth_logout', __name__, url_prefix='/logout')

@auth_logout_bp.route('', methods=['POST'])
def logout():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing token'}), 400
    result = logout_user(token)
    return jsonify(result), (200 if result.get('success') else 400)
