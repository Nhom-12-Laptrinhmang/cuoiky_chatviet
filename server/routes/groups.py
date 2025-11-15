from flask import Blueprint, request, jsonify
from services.auth_service import decode_token
from config.database import db
from models.group_model import Group, GroupMember
from models.user_model import User

groups_bp = Blueprint('groups', __name__, url_prefix='/groups')


def current_user_from_request(req):
    auth = req.headers.get('Authorization', '')
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
        payload = decode_token(token)
        if payload:
            return payload.get('user_id')
    return None


@groups_bp.route('', methods=['GET'])
def list_my_groups():
    uid = current_user_from_request(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401
    memberships = GroupMember.query.filter_by(user_id=uid).all()
    group_ids = [m.group_id for m in memberships]
    groups = Group.query.filter(Group.id.in_(group_ids)).all() if group_ids else []
    return jsonify([{'id': g.id, 'name': g.name, 'owner_id': g.owner_id} for g in groups])


@groups_bp.route('', methods=['POST'])
def create_group():
    uid = current_user_from_request(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json() or {}
    name = data.get('name')
    if not name:
        return jsonify({'error': 'Name required'}), 400
    group = Group(name=name, owner_id=uid)
    db.session.add(group)
    db.session.commit()
    # add owner as member
    member = GroupMember(group_id=group.id, user_id=uid, role='owner')
    db.session.add(member)
    db.session.commit()
    return jsonify({'id': group.id, 'name': group.name, 'owner_id': group.owner_id}), 201


@groups_bp.route('/<int:group_id>/join', methods=['POST'])
def join_group(group_id):
    uid = current_user_from_request(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    exists = GroupMember.query.filter_by(group_id=group_id, user_id=uid).first()
    if exists:
        return jsonify({'success': False, 'message': 'Already a member'}), 400
    member = GroupMember(group_id=group_id, user_id=uid)
    db.session.add(member)
    db.session.commit()
    return jsonify({'success': True})


@groups_bp.route('/<int:group_id>/members', methods=['GET'])
def get_group_members(group_id):
    uid = current_user_from_request(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    members = GroupMember.query.filter_by(group_id=group_id).all()
    user_ids = [m.user_id for m in members]
    users = User.query.filter(User.id.in_(user_ids)).all() if user_ids else []
    return jsonify([{'id': u.id, 'username': u.username, 'avatar_url': u.avatar_url} for u in users])
