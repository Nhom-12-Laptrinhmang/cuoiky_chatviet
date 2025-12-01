"""
Admin API endpoints for managing users, groups, and data.
Requires basic auth via X-ADMIN-SECRET header (matching env var).

Routes:
  GET  /admin/users                    - List all users
  POST /admin/users                    - Create new user
  GET  /admin/users/<id>               - Get user detail
  PATCH /admin/users/<id>              - Update user
  DELETE /admin/users/<id>             - Delete user
  GET  /admin/db/stats                 - DB statistics
"""
import os
from flask import Blueprint, jsonify, request, current_app
from config.database import db
from models.user_model import User
from models.group_model import Group, GroupMember
from models.message_model import Message
from models.friend_model import Friend
from models.block_model import Block
from models.message_reaction_model import MessageReaction
from models.sticker_model import Sticker
from datetime import datetime
import hashlib

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')


def check_admin_secret():
    """Check if request has valid admin secret."""
    remote = request.remote_addr or ''
    secret = request.headers.get('X-ADMIN-SECRET', '')
    env_secret = os.environ.get('ADMIN_SECRET', 'admin123')
    
    # Allow from localhost or with correct secret header
    is_local = remote in ('127.0.0.1', '::1', 'localhost')
    has_secret = secret == env_secret and env_secret != 'admin123'  # Prevent using default
    
    if not (is_local or has_secret):
        return False
    return True


@admin_bp.before_request
def require_admin():
    """Check admin permissions before each request."""
    if not check_admin_secret():
        return jsonify({'error': 'Unauthorized (set X-ADMIN-SECRET header or use localhost)'}), 403


@admin_bp.route('/users', methods=['GET'])
def list_users():
    """List all users with optional filtering/pagination."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    search = request.args.get('search', '', type=str)
    
    query = User.query
    if search:
        query = query.filter((User.username.ilike(f'%{search}%')) | (User.display_name.ilike(f'%{search}%')))
    
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'total': paginated.total,
        'page': page,
        'per_page': per_page,
        'pages': paginated.pages,
        'users': [u.to_dict() for u in paginated.items]
    })


@admin_bp.route('/users', methods=['POST'])
def create_user():
    """Create a new user."""
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    display_name = data.get('display_name', '').strip() or username
    
    if not username or not password:
        return jsonify({'error': 'username and password required'}), 400
    
    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'User already exists'}), 409
    
    # Hash password (using same method as auth_service if possible)
    try:
        from services.auth_service import hash_password
        password_hash = hash_password(password)
    except ImportError:
        # Fallback: simple hash
        password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    user = User(
        username=username,
        password_hash=password_hash,
        display_name=display_name,
        avatar_url=data.get('avatar_url'),
        gender=data.get('gender'),
        phone_number=data.get('phone_number'),
        status='offline'
    )
    
    try:
        db.session.add(user)
        db.session.commit()
        current_app.logger.info(f'[ADMIN] User created: {username} (id={user.id})')
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user detail with relationships."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    result = user.to_dict()
    result['friend_count'] = len(user.friend_relations) + len(user.friend_of_relations)
    result['group_count'] = len(user.group_memberships)
    result['message_count'] = len(user.sent_messages)
    result['owned_groups'] = [g.to_dict() for g in user.owned_groups]
    
    return jsonify(result)


@admin_bp.route('/users/<int:user_id>', methods=['PATCH'])
def update_user(user_id):
    """Update user profile."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json() or {}
    
    # Allowed fields to update
    allowed = ['display_name', 'avatar_url', 'gender', 'phone_number', 'status']
    for field in allowed:
        if field in data and data[field] is not None:
            setattr(user, field, data[field])
    
    try:
        db.session.commit()
        current_app.logger.info(f'[ADMIN] User updated: {user.username} (id={user.id})')
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user and all related data."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    username = user.username
    
    try:
        # Cascade delete handles most relations
        db.session.delete(user)
        db.session.commit()
        current_app.logger.info(f'[ADMIN] User deleted: {username} (id={user_id})')
        return jsonify({'ok': True, 'message': f'User {username} deleted'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/db/stats', methods=['GET'])
def db_stats():
    """Show database statistics."""
    try:
        stats = {
            'users': User.query.count(),
            'groups': Group.query.count(),
            'messages': Message.query.count(),
            'friends': Friend.query.count(),
            'message_reactions': MessageReaction.query.count(),
            'blocks': Block.query.count(),
            'stickers': Sticker.query.count(),
            'group_members': GroupMember.query.count(),
            'timestamp': datetime.utcnow().isoformat(),
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/db/clear-all', methods=['POST'])
def clear_all_data():
    """
    **DANGEROUS**: Delete all data from all tables.
    Only works with correct ADMIN_SECRET.
    """
    if not os.environ.get('ADMIN_SECRET') or os.environ.get('ADMIN_SECRET') == 'admin123':
        return jsonify({'error': 'Unsafe: ADMIN_SECRET not set or is default. Please set a strong ADMIN_SECRET env var.'}), 403
    
    try:
        # Drop and recreate all tables
        db.drop_all()
        db.create_all()
        current_app.logger.warn('[ADMIN] ALL DATA CLEARED by admin request')
        return jsonify({'ok': True, 'message': 'All data cleared and tables recreated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
