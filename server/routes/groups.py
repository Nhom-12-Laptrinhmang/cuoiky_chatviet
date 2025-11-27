from flask import Blueprint, request, jsonify
from services.auth_service import decode_token
from config.database import db
from models.group_model import Group, GroupMember
from models.user_model import User
socketio = None  # sẽ được import ở cuối file để tránh vòng lặp

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
    return jsonify([
        {
            'id': g.id,
            'name': g.name,
            'owner_id': g.owner_id,
            'avatar_url': g.avatar_url,
            'allow_edit_name_avatar': g.allow_edit_name_avatar
        } for g in groups
    ])
# Thêm API cập nhật tên/avatar nhóm
@groups_bp.route('/<int:group_id>', methods=['PATCH'])
def update_group_info(group_id):
    uid = current_user_from_request(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    # Chỉ owner hoặc admin mới được đổi config, còn đổi tên/avatar thì phải allow_edit_name_avatar
    member = GroupMember.query.filter_by(group_id=group_id, user_id=uid).first()
    if not member:
        return jsonify({'error': 'Not a member of this group'}), 403
    data = request.get_json() or {}
    updated = False
    # Đổi tên nhóm
    if 'name' in data:
        if group.allow_edit_name_avatar or member.role in ('owner', 'admin'):
            group.name = data['name']
            updated = True
        else:
            return jsonify({'error': 'Not allowed to edit group name'}), 403
    # Đổi avatar nhóm
    if 'avatar_url' in data:
        if group.allow_edit_name_avatar or member.role in ('owner', 'admin'):
            group.avatar_url = data['avatar_url']
            updated = True
        else:
            return jsonify({'error': 'Not allowed to edit group avatar'}), 403
    # Đổi quyền chỉnh sửa (chỉ owner/admin)
    if 'allow_edit_name_avatar' in data:
        if member.role in ('owner', 'admin'):
            group.allow_edit_name_avatar = bool(data['allow_edit_name_avatar'])
            updated = True
        else:
            return jsonify({'error': 'Not allowed to change edit permission'}), 403
    if updated:
        db.session.commit()
    return jsonify({
        'id': group.id,
        'name': group.name,
        'owner_id': group.owner_id,
        'avatar_url': group.avatar_url,
        'allow_edit_name_avatar': group.allow_edit_name_avatar
    })


@groups_bp.route('', methods=['POST'])
def create_group():
    try:
        uid = current_user_from_request(request)
        if not uid:
            return jsonify({'error': 'Unauthorized', 'detail': 'No valid token in request'}), 401
        data = request.get_json() or {}
        name = data.get('name')
        if not name:
            return jsonify({'error': 'Name required'}), 400
        # Create group record
        group = Group(name=name, owner_id=uid)
        db.session.add(group)
        db.session.commit()

        # Collect member ids from request (allow 'member_ids' or 'members')
        raw_members = data.get('member_ids') or data.get('members') or []
        # Normalize to int list and remove duplicates and owner
        member_ids = set()
        try:
            for m in raw_members:
                if m is None:
                    continue
                mid = int(m)
                if mid == int(uid):
                    continue
                member_ids.add(mid)
        except Exception as e:
            # ignore bad values but log
            print(f"[CREATE_GROUP] Error parsing member_ids: {e}")
            member_ids = set()

        # Always add the owner as member with role 'owner'
        owner_member = GroupMember(group_id=group.id, user_id=uid, role='owner')
        db.session.add(owner_member)

        # Validate users exist and add as members
        if member_ids:
            existing_users = User.query.filter(User.id.in_(list(member_ids))).all()
            existing_ids = {u.id for u in existing_users}
            for mid in existing_ids:
                gm = GroupMember(group_id=group.id, user_id=mid, role='member')
                db.session.add(gm)

        db.session.commit()
        
        # Return full group info including members list
        members_list = GroupMember.query.filter_by(group_id=group.id).all()
        member_ids_result = [m.user_id for m in members_list]
        return jsonify({
            'id': group.id,
            'name': group.name,
            'group_name': group.name,
            'owner_id': group.owner_id,
            'members': member_ids_result,
            'member_count': len(member_ids_result)
        }), 201
    except Exception as e:
        print(f"[CREATE_GROUP] Error: {e}")
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to create group', 'detail': str(e)}), 500


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
    # include role and owner_id in response so client can show/hide management options
    member_role_map = {m.user_id: m.role for m in members}
    return jsonify([{'id': u.id, 'username': u.username, 'avatar_url': u.avatar_url, 'role': member_role_map.get(u.id, 'member'), 'owner_id': group.owner_id} for u in users])


@groups_bp.route('/<int:group_id>/messages', methods=['GET'])
def get_group_messages(group_id):
    """Return messages for a group (ordered asc). Requires membership."""
    from models.message_model import Message
    uid = current_user_from_request(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    # verify requester is a member
    member = GroupMember.query.filter_by(group_id=group_id, user_id=uid).first()
    if not member:
        return jsonify({'error': 'Not a member of this group'}), 403

    msgs = Message.query.filter_by(group_id=group_id).order_by(Message.timestamp.asc()).all()
    result = []
    for m in msgs:
        try:
            sender = None
            try:
                sender = User.query.get(m.sender_id)
            except Exception:
                sender = None
            result.append({
                'id': m.id,
                'sender_id': m.sender_id,
                'sender_username': sender.username if sender else None,
                'sender_name': (sender.display_name or sender.username) if sender else None,
                'sender_avatar_url': sender.avatar_url if sender else None,
                'content': m.content,
                'file_url': m.file_url,
                'message_type': m.message_type,
                'sticker_id': m.sticker_id,
                'sticker_url': m.sticker_url,
                'timestamp': m.timestamp.isoformat(),
                'group_id': m.group_id,
            })
        except Exception:
            continue
    return jsonify(result)


@groups_bp.route('/<int:group_id>/members', methods=['POST'])
def add_members_to_group(group_id):
    """Add members to a group. Requires authorization. Only group owner can add members.
    Body: { "member_ids": [user_id1, user_id2, ...] } or { "user_id": user_id }
    """
    try:
        # Debug: log incoming payload and requester
        try:
            print(f"[ADD_MEMBERS] request.json={request.get_json()}")
        except Exception:
            print("[ADD_MEMBERS] could not read request JSON")
        uid = current_user_from_request(request)
        print(f"[ADD_MEMBERS] requester uid={uid} group_id={group_id}")
        if not uid:
            return jsonify({'error': 'Unauthorized'}), 401

        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        # Check if current user is owner or admin
        member_info = GroupMember.query.filter_by(group_id=group_id, user_id=uid).first()
        if not member_info or member_info.role not in ('owner', 'admin'):
            return jsonify({'error': 'Only group owner/admin can add members'}), 403

        data = request.get_json() or {}
        member_ids = data.get('member_ids') or []

        # Also support single user_id
        if 'user_id' in data and data['user_id']:
            member_ids = [data['user_id']]

        if not member_ids:
            return jsonify({'error': 'No members to add'}), 400

        # Normalize and validate -> add members one-by-one so a bad row won't fail entire batch
        added_count = 0
        added_ids = []
        for mid in member_ids:
            try:
                mid = int(mid)
            except (ValueError, TypeError):
                # skip invalid ids
                continue

            # Check if user exists
            user = User.query.get(mid)
            if not user:
                continue

            # Check if already a member
            exists = GroupMember.query.filter_by(group_id=group_id, user_id=mid).first()
            if exists:
                continue

            # Add member with per-row commit to isolate failures
            try:
                gm = GroupMember(group_id=group_id, user_id=mid, role='member')
                db.session.add(gm)
                db.session.commit()
                added_count += 1
                added_ids.append(mid)
            except Exception as ex:
                # rollback this failed insert and continue with others; log exception for debugging
                import traceback
                print(f"[ADD_MEMBERS] failed to add mid={mid} to group={group_id}: {ex}")
                traceback.print_exc()
                db.session.rollback()
                continue

        # Notify newly added users (if any) so their clients can refresh group lists
        try:
            group_info = {'group_id': group.id, 'group_name': group.name}
            from server.app import socketio
            for mid in added_ids:
                try:
                    socketio.emit('group_created_notify', {**group_info, 'members': [mid]}, room=f'user-{mid}')
                except Exception:
                    # ignore emit errors but keep processing
                    pass
        except Exception:
            pass

        return jsonify({'success': True, 'added': added_ids, 'added_count': added_count}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({'error': 'Failed to add members', 'detail': str(e)}), 500


@groups_bp.route('/<int:group_id>/members/<int:user_id>', methods=['DELETE'])
def remove_member_from_group(group_id, user_id):
    """Remove a member from a group. Requires authorization.
    Owner/admin can remove any member (except owner).
    Members can remove themselves.
    """
    uid = current_user_from_request(request)
    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401
    
    group = Group.query.get(group_id)
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    # Check permissions
    current_member = GroupMember.query.filter_by(group_id=group_id, user_id=uid).first()
    if not current_member:
        return jsonify({'error': 'You are not a member of this group'}), 403
    
    target_member = GroupMember.query.filter_by(group_id=group_id, user_id=user_id).first()
    if not target_member:
        return jsonify({'error': 'Member not found'}), 404
    
    # Cannot remove group owner
    if target_member.role == 'owner':
        return jsonify({'error': 'Cannot remove group owner'}), 403
    
    # Check if user has permission (owner/admin can remove anyone, member can only remove self)
    if current_member.role not in ('owner', 'admin') and uid != user_id:
        return jsonify({'error': 'Only group owner/admin can remove members'}), 403
    
    db.session.delete(target_member)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Member removed'})
