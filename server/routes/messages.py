from flask import Blueprint, request, jsonify
from models.message_model import Message
from config.database import db
from sqlalchemy import or_

messages_bp = Blueprint('messages', __name__, url_prefix='/messages')


@messages_bp.route('', methods=['GET'])
def get_messages():
    """Return messages between two users (both directions).

    Query params:
      - sender_id: required
      - receiver_id: required
      - limit: optional int to cap number of messages (most recent)
    """
    sender_id = request.args.get('sender_id')
    receiver_id = request.args.get('receiver_id')
    print(f"[MESSAGES] sender={sender_id} receiver={receiver_id}")
    if not sender_id or not receiver_id:
        print("[MESSAGES] Missing sender_id or receiver_id")
        return jsonify({'error': 'Missing sender_id or receiver_id'}), 400

    try:
        a = int(sender_id)
        b = int(receiver_id)
    except ValueError:
        print("[MESSAGES] sender_id and receiver_id must be integers")
        return jsonify({'error': 'sender_id and receiver_id must be integers'}), 400

    limit = request.args.get('limit', type=int)

    # messages where (sender=a and receiver=b) OR (sender=b and receiver=a)
    query = Message.query.filter(
        or_(
            (Message.sender_id == a) & (Message.receiver_id == b),
            (Message.sender_id == b) & (Message.receiver_id == a),
        )
    ).order_by(Message.timestamp.asc())

    if limit:
        msgs = query.limit(limit).all()
    else:
        msgs = query.all()

    response_data = [
        {
            'id': m.id,
            'sender_id': m.sender_id,
            'receiver_id': m.receiver_id,
            'content': m.content,
            'timestamp': m.timestamp.isoformat()
        } for m in msgs
    ]
    print(f"[MESSAGES] count={len(response_data)}")
    return jsonify(response_data)


@messages_bp.route('/conversations', methods=['GET'])
def get_conversations():
    """Return conversation summaries for current user: last message per conversation (user or group).

    Requires Authorization: Bearer <token>
    """
    from services.auth_service import decode_token
    from models.user_model import User
    from models.group_model import Group

    auth = request.headers.get('Authorization', '')
    uid = None
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
        payload = decode_token(token)
        if payload:
            uid = payload.get('user_id')

    if not uid:
        return jsonify({'error': 'Unauthorized'}), 401

    # Gather messages involving user
    msgs = Message.query.filter(
        or_(Message.sender_id == uid, Message.receiver_id == uid)
    ).order_by(Message.timestamp.desc()).all()

    conv_map = {}
    for m in msgs:
        if m.group_id:
            key = ('group', m.group_id)
        else:
            # determine the other participant
            other = m.receiver_id if m.sender_id == uid else m.sender_id
            key = ('user', other)

        if key not in conv_map:
            conv_map[key] = {
                'type': key[0],
                'id': key[1],
                'last_message': m.content,
                'last_ts': m.timestamp.isoformat(),
            }

    # Enrich with display names
    result = []
    for k, v in conv_map.items():
        if v['type'] == 'user':
            u = User.query.get(v['id'])
            v['display_name'] = (u.display_name or u.username) if u else None
            v['username'] = u.username if u else None
        else:
            g = Group.query.get(v['id'])
            v['group_name'] = g.name if g else f'Group {v["id"]}'
        result.append(v)

    # sort by last_ts desc
    result.sort(key=lambda x: x.get('last_ts') or '', reverse=True)
    return jsonify(result)
