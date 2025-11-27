from flask_socketio import emit, join_room, leave_room
from flask import request
from models.user_model import User
from models.message_model import Message
from models.message_reaction_model import MessageReaction
from models.friend_model import Friend
from models.block_model import Block
from models.contact_sync_model import ContactSync
from models.group_model import Group, GroupMember
from config.database import db
import logging
from services.auth_service import decode_token
import traceback
import os

# module logger
logger = logging.getLogger(__name__)

# Store mapping of user_id -> socket.sid for direct targeting
user_sockets = {}

def register_chat_events(socketio):
    def GetContactsList(user_id):
        """Return a list of contact dicts for given user_id: {id, name, online}.
        Looks up Friend relations with status 'accepted' and queries User for profile.
        Online detection uses the in-memory `user_sockets` mapping.
        """
        try:
            # Find both directions where relationship exists
            outgoing = Friend.query.filter_by(user_id=user_id, status='accepted').all() or []
            incoming = Friend.query.filter_by(friend_id=user_id, status='accepted').all() or []
            rows = []
            for f in outgoing:
                fid = f.friend_id
                u = User.query.get(fid)
                if not u:
                    continue
                rows.append({
                    'id': str(u.id),
                    'name': u.display_name or u.username,
                    'online': fid in user_sockets
                })
            for f in incoming:
                fid = f.user_id
                u = User.query.get(fid)
                if not u:
                    continue
                rows.append({
                    'id': str(u.id),
                    'name': u.display_name or u.username,
                    'online': fid in user_sockets
                })
            return rows
        except Exception as e:
            print(f"[CONTACTS] Error building contacts list: {e}")
            return []

    def AddBlock(user_id, target_id):
        try:
            # don't duplicate
            exists = Block.query.filter_by(user_id=user_id, target_id=target_id).first()
            if exists:
                return False, 'exists'
            b = Block(user_id=user_id, target_id=target_id)
            db.session.add(b)
            db.session.commit()
            return True, b
        except Exception as e:
            print(f"[BLOCK] Error adding block: {e}")
            db.session.rollback()
            return False, 'error'

    def RemoveBlock(user_id, target_id):
        try:
            b = Block.query.filter_by(user_id=user_id, target_id=target_id).first()
            if not b:
                return False, 'not_found'
            db.session.delete(b)
            db.session.commit()
            return True, None
        except Exception as e:
            print(f"[BLOCK] Error removing block: {e}")
            db.session.rollback()
            return False, 'error'

    def SyncContacts(user_id, contacts):
        """Compare given contacts (list of phone numbers) with users, persist and return matches."""
        try:
            # Find users where phone_number in provided contacts
            if not contacts:
                contacts = []
            users = User.query.filter(User.phone_number.in_(contacts)).all() if contacts else []
            matches = [{'id': str(u.id), 'name': u.display_name or u.username, 'phone': u.phone_number} for u in users]

            # Load or create ContactSync row
            cs = ContactSync.query.filter_by(user_id=user_id).first()
            old = []
            if cs:
                old = cs.get_contacts()
            else:
                cs = ContactSync(user_id=user_id)
                db.session.add(cs)

            # Save contacts list (as provided)
            cs.set_contacts(contacts)
            from datetime import datetime
            cs.updated_at = datetime.utcnow()
            db.session.commit()

            # If matches changed compared to old, return flag to emit update
            old_set = set(old or [])
            new_set = set(contacts or [])
            changed = old_set != new_set
            return matches, changed
        except Exception as e:
            print(f"[CONTACTS] Error syncing: {e}")
            db.session.rollback()
            return [], False

    def AddFriendRequest(sender_id, target_user_id=None, target_phone=None):
        """Create a Friend request record from sender_id to target (by id or phone).
        Returns tuple (success:bool, message:str, friend_obj or None, target_user_id)
        """
        try:
            # Resolve target by id or phone
            target = None
            if target_user_id:
                target = User.query.get(int(target_user_id))
            elif target_phone:
                target = User.query.filter_by(phone_number=target_phone).first()

            if not target:
                return False, 'target_not_found', None, None

            # Check existing relationship (any direction)
            exists = Friend.query.filter(((Friend.user_id==sender_id) & (Friend.friend_id==target.id)) | ((Friend.user_id==target.id) & (Friend.friend_id==sender_id))).first()
            if exists:
                # If already accepted or pending, return appropriate message
                return False, 'already_exists', exists, target.id

            fr = Friend(user_id=sender_id, friend_id=target.id, status='pending')
            db.session.add(fr)
            db.session.commit()
            return True, 'created', fr, target.id
        except Exception as e:
            print(f"[FRIENDS] Error creating friend request: {e}")
            db.session.rollback()
            return False, 'error', None, None

    def AcceptFriendRequest(request_id, accepter_user_id):
        """Accept a friend request. Only the recipient (friend_id) may accept.
        Returns tuple (success, msg, friend_obj, requester_id)
        """
        try:
            fr = Friend.query.get(int(request_id))
            if not fr:
                return False, 'not_found', None, None

            # The accepter must match the friend_id (target)
            if int(fr.friend_id) != int(accepter_user_id):
                return False, 'not_authorized', None, None

            fr.status = 'accepted'
            db.session.commit()
            requester_id = fr.user_id
            return True, 'accepted', fr, requester_id
        except Exception as e:
            print(f"[FRIENDS] Error accepting friend request: {e}")
            db.session.rollback()
            return False, 'error', None, None

    def RejectFriendRequest(request_id, rejector_user_id):
        """Reject (or delete) a friend request. Only the recipient may reject.
        Returns (success, msg, requester_id)
        """
        try:
            fr = Friend.query.get(int(request_id))
            if not fr:
                return False, 'not_found', None
            if int(fr.friend_id) != int(rejector_user_id):
                return False, 'not_authorized', None

            requester_id = fr.user_id
            # delete the pending request
            db.session.delete(fr)
            db.session.commit()
            return True, 'rejected', requester_id
        except Exception as e:
            print(f"[FRIENDS] Error rejecting friend request: {e}")
            db.session.rollback()
            return False, 'error', None

    @socketio.on('connect')
    def handle_connect():
        ip = request.remote_addr
        logger.info("[CHAT][CONNECT] Connected from %s sid=%s", ip, request.sid)
        emit('connected', {'msg': 'Connected to chat server'})

    @socketio.on('join')
    def handle_join(data):
        """
        Expect data to include either:
          - user_id: join user's personal room named `user-<id>`
          - room: arbitrary room name (e.g., `group-<id>` or conversation room)
        """
        logger.info("[CHAT][JOIN] sid=%s data=%s", request.sid, data)
        
        user_id = data.get('user_id')
        room = data.get('room')
        
        if user_id:
            room_name = f'user-{user_id}'
            # Store user_id -> sid mapping
            user_sockets[user_id] = request.sid
            logger.debug("Stored mapping: user_id=%s -> sid=%s", user_id, request.sid)
        elif room:
            room_name = room
            logger.debug("Using explicit room: %s", room_name)
        else:
            # nothing sensible to join
            logger.warning("No user_id or room provided in join request from sid=%s", request.sid)
            logger.debug("[JOIN] END - FAILED")
            return

        join_room(room_name)
        logger.info("User joined room: %s", room_name)
        logger.debug("Current user_sockets mapping: %s", user_sockets)
        
        # Notify the user's own room (useful for multi-tab clients)
        socketio.emit('user_joined', {'user_id': user_id, 'room': room_name}, room=room_name)

        # Additionally notify the user's friends that this user is online.
        # Find all accepted friends and emit `user_joined` to their rooms so they can update presence.
        try:
            if user_id:
                # collect friend ids in both directions
                outgoing = Friend.query.filter_by(user_id=user_id, status='accepted').all() or []
                incoming = Friend.query.filter_by(friend_id=user_id, status='accepted').all() or []
                friend_ids = set()
                for f in outgoing:
                    friend_ids.add(f.friend_id)
                for f in incoming:
                    friend_ids.add(f.user_id)
                for fid in friend_ids:
                    try:
                        socketio.emit('user_joined', {'user_id': user_id}, room=f'user-{fid}')
                        logger.debug('Emitted user_joined for user %s to friend room user-%s', user_id, fid)
                    except Exception:
                        logger.exception('Error emitting user_joined to friend %s', fid)
        except Exception:
            logger.exception('Error while notifying friends about user_joined')
        # Update persistent user status immediately so REST endpoints reflect online state
        try:
            if user_id:
                u = User.query.get(int(user_id))
                if u:
                    u.status = 'online'
                    db.session.commit()
                    logger.debug('Set User.%s status=online in DB', user_id)
        except Exception:
            db.session.rollback()
            logger.exception('Failed to persist user online status for %s', user_id)

        # Recompute group online status: if at least 2 members online -> group is online
        try:
            if user_id:
                # find groups where this user is a member
                gms = GroupMember.query.filter_by(user_id=int(user_id)).all()
                group_ids = set([gm.group_id for gm in gms])
                for gid in group_ids:
                    try:
                        members = GroupMember.query.filter_by(group_id=gid).all()
                        online_count = 0
                        for m in members:
                            try:
                                # prefer in-memory mapping for immediacy
                                if str(m.user_id) in user_sockets or m.user_id in user_sockets:
                                    online_count += 1
                                else:
                                    # fallback to DB status
                                    mu = User.query.get(m.user_id)
                                    if mu and mu.status == 'online':
                                        online_count += 1
                            except Exception:
                                continue
                        grp = Group.query.get(gid)
                        if grp:
                            new_status = 'online' if online_count >= 2 else 'offline'
                            if getattr(grp, 'status', None) != new_status:
                                try:
                                    grp.status = new_status
                                    db.session.commit()
                                except Exception:
                                    db.session.rollback()
                                # notify group members about updated status (emit to each member's personal room)
                                try:
                                    for m in members:
                                        try:
                                            socketio.emit('group_updated', { 'group_id': gid, 'status': new_status }, room=f'user-{m.user_id}')
                                        except Exception:
                                            logger.exception('Failed to emit group_updated to user %s for group %s', m.user_id, gid)
                                except Exception:
                                    logger.exception('Failed to emit group_updated for %s', gid)
                    except Exception:
                        logger.exception('Error computing online count for group %s', gid)
        except Exception:
            logger.exception('Error while recomputing groups after join for user %s', user_id)
        except Exception:
            logger.exception('Error while notifying friends about user_joined')
        logger.info("[JOIN] END - SUCCESS user=%s room=%s", user_id, room_name)

    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle 1:1 messages with support for reply_to, forward_from, reactions."""
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        group_id = data.get('group_id')
        content = data.get('content')
        client_message_id = data.get('client_message_id')  # For ACK tracking
        reply_to_id = data.get('reply_to_id')  # Message ID being replied to
        forward_from_id = data.get('forward_from_id')  # Message ID being forwarded

        logger.debug("[CHAT][RECV] send_message sid=%s sender=%s receiver=%s client_msg_id=%s preview=%s", request.sid, sender_id, receiver_id, client_message_id, content[:30] if content else 'N/A')

        # Extra diagnostic logging to help trace issues with emoji-only messages.
        # Log the Python repr, character length and UTF-8 byte length so we can
        # confirm whether the payload arrives empty or gets mangled by transport.
        try:
            logger.info("[CHAT][DEBUG] incoming content repr=%r char_len=%s utf8_bytes=%s", content, len(content) if content is not None else 0, len(content.encode('utf-8')) if content is not None else 0)
        except Exception:
            logger.exception("[CHAT][DEBUG] Error while logging incoming content")

        # Validate required fields. Treat None/absent content as invalid, but allow
        # non-empty strings (including emoji-only strings). This avoids rejecting
        # emoji-only messages due to falsy checks.
        content_is_none = content is None
        content_is_empty_str = isinstance(content, str) and content.strip() == ''

        # Require either a receiver_id (1:1) or a group_id (group message)
        if not sender_id or (not receiver_id and not group_id) or content_is_none or content_is_empty_str:
            logger.warning("Missing required fields for send_message: sender=%s receiver=%s content_repr=%r empty=%s none=%s",
                           sender_id, receiver_id, content, content_is_empty_str, content_is_none)
            return

        try:
            # Debug prints to stdout to make failures visible in dev terminal
            print(f"[DEBUG SEND_MESSAGE] received sender={sender_id} receiver={receiver_id} client_msg_id={client_message_id} content_repr={repr(content)}")
            # Check block list for 1:1 messages only. For group messages we'll still allow save
            if not group_id:
                try:
                    blocked_by_receiver = Block.query.filter_by(user_id=receiver_id, target_id=sender_id).first()
                    blocked_by_sender = Block.query.filter_by(user_id=sender_id, target_id=receiver_id).first()
                except Exception as e:
                    logger.warning("Block check skipped due to error (schema may be missing): %s", e)
                    blocked_by_receiver = None
                    blocked_by_sender = None
                
                if blocked_by_receiver or blocked_by_sender:
                    logger.info("Block detected - rejecting send (blocked_by_receiver=%s, blocked_by_sender=%s)", bool(blocked_by_receiver), bool(blocked_by_sender))
                    # Inform sender that message was blocked and include a human-friendly reason
                    if client_message_id:
                        if blocked_by_receiver and not blocked_by_sender:
                            blocked_message = 'Hiện tại bạn không thể gửi tin nhắn cho người này vì họ đã chặn bạn.'
                        elif blocked_by_sender and not blocked_by_receiver:
                            blocked_message = 'Bạn đã chặn người này, nên không thể gửi tin nhắn cho họ.'
                        else:
                            blocked_message = 'Tin nhắn bị chặn.'
                        ack_data = {
                            'client_message_id': client_message_id,
                            'status': 'blocked',
                            'blocked_message': blocked_message,
                            'blocked_by_receiver': bool(blocked_by_receiver),
                            'blocked_by_sender': bool(blocked_by_sender),
                        }
                        socketio.emit('message_sent_ack', ack_data, room=request.sid)
                    return
            # Save message to DB
            print('[DEBUG SEND_MESSAGE] attempting to save to DB...')
            # If this is a group message, validate group and membership
            if group_id:
                try:
                    gid = int(group_id)
                except Exception:
                    logger.warning('Invalid group_id provided: %s', group_id)
                    return
                grp = Group.query.get(gid)
                if not grp:
                    logger.warning('Group not found: %s', gid)
                    return
                # verify sender is a member
                is_member = GroupMember.query.filter_by(group_id=gid, user_id=int(sender_id)).first()
                if not is_member:
                    logger.warning('Sender %s is not a member of group %s', sender_id, gid)
                    return
                # use group's owner as receiver_id placeholder (DB requires receiver_id non-null)
                receiver_for_db = grp.owner_id or int(sender_id)
                msg = Message(sender_id=sender_id, receiver_id=receiver_for_db, content=content, group_id=gid)
            else:
                msg = Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
            db.session.add(msg)
            db.session.commit()
            print('[DEBUG SEND_MESSAGE] DB commit succeeded, msg.id=', getattr(msg, 'id', None))
            logger.info("Message saved to DB: message_id=%s timestamp=%s", msg.id, msg.timestamp)
        except Exception as e:
            # Log exception to logger and also persist a traceback to a file for easier debugging
            logger.exception("Error saving message to DB: %s", str(e))
            try:
                # write to /tmp for convenience
                with open('/tmp/chat_save_error.log', 'a', encoding='utf-8') as fh:
                    fh.write('\n--- Chat save error ---\n')
                    fh.write(f"time: {__import__('datetime').datetime.utcnow().isoformat()}\n")
                    fh.write(f"sender_id={sender_id} receiver_id={receiver_id} client_message_id={client_message_id}\n")
                    fh.write(f"content repr: {repr(content)}\n")
                    fh.write('traceback:\n')
                    fh.write(traceback.format_exc())
                    fh.write('\n-----------------------\n')
                # also write a copy into project server folder so the repo tools can read it
                proj_path = os.path.join(os.path.dirname(__file__), '..', 'chat_save_error.log')
                with open(proj_path, 'a', encoding='utf-8') as fh2:
                    fh2.write('\n--- Chat save error (project) ---\n')
                    fh2.write(f"time: {__import__('datetime').datetime.utcnow().isoformat()}\n")
                    fh2.write(f"sender_id={sender_id} receiver_id={receiver_id} client_message_id={client_message_id}\n")
                    fh2.write(f"content repr: {repr(content)}\n")
                    fh2.write('traceback:\n')
                    fh2.write(traceback.format_exc())
                    fh2.write('\n-----------------------\n')
            except Exception:
                logger.exception('Failed to write chat_save_error.log')

            db.session.rollback()
            # Notify sender of failure if client id provided
            if client_message_id:
                ack_data = {'client_message_id': client_message_id, 'status': 'error', 'error_detail': str(e)}
                socketio.emit('message_sent_ack', ack_data, room=request.sid)
            return

        # Prepare message data to broadcast
        message_data = {
            'id': msg.id,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': content,
            'timestamp': msg.timestamp.isoformat(),
            'status': 'sent',
            'reply_to_id': reply_to_id,
            'forward_from_id': forward_from_id,
        }
        # include sender profile info (avatar, display name) to help clients render immediately
        try:
            s_user = User.query.get(int(sender_id)) if sender_id else None
            if s_user:
                message_data['sender_avatar_url'] = s_user.avatar_url
                message_data['sender_username'] = s_user.username
                message_data['sender_name'] = s_user.display_name or s_user.username
        except Exception:
            pass
        if group_id:
            message_data['group_id'] = int(group_id)

        # Send ACK back to sender (to confirm message saved with real ID)
        if client_message_id:
            ack_data = {'client_message_id': client_message_id, 'message_id': msg.id, 'status': 'sent'}
            socketio.emit('message_sent_ack', ack_data, room=request.sid)
            logger.debug("Sent ACK to sender: %s", ack_data)

        # Broadcast: if group message, emit to all group members; otherwise emit to single receiver
        if group_id:
            try:
                members = GroupMember.query.filter_by(group_id=int(group_id)).all()
                for m in members:
                    try:
                        room = f'user-{m.user_id}'
                        socketio.emit('receive_message', message_data, room=room)
                    except Exception:
                        logger.exception('Error emitting group message to user %s in group %s', m.user_id, group_id)
                logger.info('Emitted group message_id=%s to group %s members count=%s', msg.id, group_id, len(members))
            except Exception:
                logger.exception('Error broadcasting group message for group %s', group_id)
        else:
            receiver_room = f'user-{receiver_id}'
            logger.debug("Emitting to receiver room '%s'", receiver_room)
            try:
                socketio.emit('receive_message', message_data, room=receiver_room)
                logger.info("Emitted message_id=%s to %s", msg.id, receiver_room)
            except Exception as e:
                logger.exception("Error emitting to %s: %s", receiver_room, str(e))

        logger.debug("[SEND_MESSAGE] END - SUCCESS sender=%s receiver=%s message_id=%s", sender_id, receiver_id, msg.id)

    @socketio.on('add_reaction')
    def handle_add_reaction(data):
        """Handle emoji reactions to messages."""
        message_id = data.get('message_id')
        user_id = data.get('user_id')
        reaction = data.get('reaction')  # emoji like '❤️', '😂', etc
        logger.debug("[CHAT][RECV] add_reaction message_id=%s user=%s reaction=%s", message_id, user_id, reaction)

        if not message_id or not user_id or not reaction:
            logger.warning("Missing fields in add_reaction: message_id=%s user_id=%s reaction=%s", message_id, user_id, reaction)
            return

        try:
            # avoid duplicate same-reaction by same user
            exists = MessageReaction.query.filter_by(message_id=message_id, user_id=user_id, reaction_type=reaction).first()
            if exists:
                logger.debug("Reaction already exists for message=%s user=%s reaction=%s - ignoring", message_id, user_id, reaction)
                return

            mr = MessageReaction(message_id=message_id, user_id=user_id, reaction_type=reaction)
            db.session.add(mr)
            db.session.commit()
            logger.info("Saved reaction for message=%s by user=%s reaction=%s", message_id, user_id, reaction)

            # Aggregate reactions for this message
            reactions = MessageReaction.query.filter_by(message_id=message_id).all()
            agg = {}
            for r in reactions:
                agg.setdefault(r.reaction_type, []).append(r.user_id)

            # Emit aggregated reactions to interested parties (sender & receiver rooms)
            msg = Message.query.get(message_id)
            target_rooms = set()
            if msg:
                if msg.group_id:
                    # emit to all group members
                    members = GroupMember.query.filter_by(group_id=msg.group_id).all()
                    for m in members:
                        target_rooms.add(f'user-{m.user_id}')
                else:
                    target_rooms.add(f'user-{msg.sender_id}')
                    target_rooms.add(f'user-{msg.receiver_id}')
            else:
                target_rooms = None

            payload = {
                'message_id': message_id,
                'reactions': agg
            }

            if target_rooms:
                for r in target_rooms:
                    try:
                        socketio.emit('message_reaction', payload, room=r)
                        logger.debug("Emitted message_reaction to room=%s", r)
                    except Exception:
                        logger.exception("Error emitting reaction to room %s", r)
            else:
                socketio.emit('message_reaction', payload, broadcast=True)
                logger.debug("Broadcasted message_reaction for message=%s", message_id)

        except Exception:
            logger.exception("Error saving/emitting reaction for message=%s", message_id)

    @socketio.on('send_sticker')
    def handle_send_sticker(data):
        """Handle sticker messages (Giphy, EmojiOne, Twemoji, custom pack)."""
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        group_id = data.get('group_id')
        sticker_id = data.get('sticker_id')  # Giphy ID or custom pack ID
        sticker_url = data.get('sticker_url')  # URL for sticker image
        client_message_id = data.get('client_message_id')
        
        print(f"[CHAT][NHẬN] [STICKER] sender={sender_id} receiver={receiver_id} sticker_id={sticker_id}")
        
        if not sender_id or (not receiver_id and not group_id) or not sticker_url:
            print(f"[ERROR] Missing required fields for sticker")
            print("[STICKER] END - FAILED\n")
            return
        
        try:
            # Save sticker message to DB (support group)
            if group_id:
                try:
                    gid = int(group_id)
                except Exception:
                    print('[STICKER] invalid group_id')
                    return
                grp = Group.query.get(gid)
                if not grp:
                    print('[STICKER] group not found')
                    return
                is_member = GroupMember.query.filter_by(group_id=gid, user_id=int(sender_id)).first()
                if not is_member:
                    print('[STICKER] sender not member of group')
                    return
                receiver_for_db = grp.owner_id or int(sender_id)
                msg = Message(
                    sender_id=sender_id,
                    receiver_id=receiver_for_db,
                    content=sticker_url,
                    message_type='sticker',
                    sticker_id=sticker_id,
                    sticker_url=sticker_url,
                    group_id=gid
                )
            else:
                msg = Message(
                    sender_id=sender_id,
                    receiver_id=receiver_id,
                    content=sticker_url,
                    message_type='sticker',
                    sticker_id=sticker_id,
                    sticker_url=sticker_url
                )
            db.session.add(msg)
            db.session.commit()
            print(f"[CHAT][GỬI] ✅ Sticker saved to DB: message_id={msg.id}")
        except Exception as e:
            print(f"[ERROR] ❌ ERROR saving sticker to DB: {e}")
            db.session.rollback()
            print("[STICKER] END - FAILED (DB save)\n")
            return
        
        # Prepare sticker message data
        sticker_data = {
            'id': msg.id,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'message_type': 'sticker',
            'sticker_id': sticker_id,
            'sticker_url': sticker_url,
            'timestamp': msg.timestamp.isoformat(),
            'status': 'sent',
        }
        try:
            s_user = User.query.get(int(sender_id)) if sender_id else None
            if s_user:
                sticker_data['sender_avatar_url'] = s_user.avatar_url
                sticker_data['sender_username'] = s_user.username
                sticker_data['sender_name'] = s_user.display_name or s_user.username
        except Exception:
            pass
        
        # Send ACK back to sender
        if client_message_id:
            ack_data = {
                'client_message_id': client_message_id,
                'message_id': msg.id,
                'status': 'sent',
            }
            print(f"[CHAT][GỬI] 📋 Sending ACK for sticker to sender: {ack_data}")
            socketio.emit('message_sent_ack', ack_data, room=request.sid)
        
        # Broadcast: group -> all members, otherwise single receiver
        if group_id:
            try:
                members = GroupMember.query.filter_by(group_id=int(group_id)).all()
                for m in members:
                    socketio.emit('receive_message', sticker_data, room=f'user-{m.user_id}')
                print(f"[CHAT][GỬI] ✅ Sticker emitted to group {group_id}")
            except Exception as e:
                print(f"[ERROR] ❌ ERROR emitting sticker to group {group_id}: {e}")
        else:
            receiver_room = f'user-{receiver_id}'
            print(f"[CHAT][GỬI] 📤 Emitting sticker to receiver room '{receiver_room}'...")
            try:
                socketio.emit('receive_message', sticker_data, room=receiver_room)
                print(f"[CHAT][GỬI] ✅ Sticker emitted to {receiver_room}")
            except Exception as e:
                print(f"[ERROR] ❌ ERROR emitting sticker to {receiver_room}: {e}")
        
        print("[CHAT][GỬI] [STICKER] END - SUCCESS")

    @socketio.on('send_file_message')
    def handle_send_file_message(data):
        """Handle file messages that were uploaded to S3.
        Expected data: { sender_id, receiver_id, file_url, file_name, file_size, file_type, client_message_id }
        """
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        group_id = data.get('group_id')
        file_url = data.get('file_url')
        file_name = data.get('file_name')
        file_size = data.get('file_size', 0)
        file_type = data.get('file_type', 'application/octet-stream')
        client_message_id = data.get('client_message_id')

        logger.debug("[CHAT][RECV] send_file_message sid=%s sender=%s receiver=%s file=%s", 
                     request.sid, sender_id, receiver_id, file_name)

        if not sender_id or (not receiver_id and not group_id) or not file_url or not file_name:
            logger.warning("Missing required fields for send_file_message: sender=%s receiver=%s file_url=%s file_name=%s", 
                          sender_id, receiver_id, file_url, file_name)
            return

        try:
            # Check block list: TWO-WAY check
            blocked_by_receiver = Block.query.filter_by(user_id=receiver_id, target_id=sender_id).first()
            blocked_by_sender = Block.query.filter_by(user_id=sender_id, target_id=receiver_id).first()
            if blocked_by_receiver or blocked_by_sender:
                logger.info("Block detected for file send - rejecting")
                if client_message_id:
                    if blocked_by_receiver and not blocked_by_sender:
                        blocked_message = 'Hiện tại bạn không thể gửi tin nhắn cho người này vì họ đã chặn bạn.'
                    elif blocked_by_sender and not blocked_by_receiver:
                        blocked_message = 'Bạn đã chặn người này, nên không thể gửi tin nhắn cho họ.'
                    else:
                        blocked_message = 'Tin nhắn bị chặn.'
                    ack_data = {
                        'client_message_id': client_message_id,
                        'status': 'blocked',
                        'blocked_message': blocked_message,
                        'blocked_by_receiver': bool(blocked_by_receiver),
                        'blocked_by_sender': bool(blocked_by_sender),
                    }
                    socketio.emit('message_sent_ack', ack_data, room=request.sid)
                return

            # Save file message to DB (support group)
            if group_id:
                try:
                    gid = int(group_id)
                except Exception:
                    logger.warning('Invalid group_id for file message: %s', group_id)
                    return
                grp = Group.query.get(gid)
                if not grp:
                    logger.warning('Group not found for file message: %s', gid)
                    return
                is_member = GroupMember.query.filter_by(group_id=gid, user_id=int(sender_id)).first()
                if not is_member:
                    logger.warning('Sender not member of group for file message: %s', sender_id)
                    return
                receiver_for_db = grp.owner_id or int(sender_id)
                msg = Message(
                    sender_id=sender_id,
                    receiver_id=receiver_for_db,
                    content=file_name,
                    message_type='file',
                    file_url=file_url,
                    group_id=gid
                )
            else:
                msg = Message(
                    sender_id=sender_id,
                    receiver_id=receiver_id,
                    content=file_name,
                    message_type='file',
                    file_url=file_url
                )
            db.session.add(msg)
            db.session.commit()
            logger.info("File message saved to DB: message_id=%s file=%s", msg.id, file_name)
        except Exception as e:
            logger.exception("Error saving file message to DB: %s", str(e))
            db.session.rollback()
            if client_message_id:
                ack_data = {'client_message_id': client_message_id, 'status': 'error'}
                socketio.emit('message_sent_ack', ack_data, room=request.sid)
            return

        # Prepare message data to broadcast
        message_data = {
            'id': msg.id,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': file_name,
            'message_type': 'file',
            'file_url': file_url,
            'file_name': file_name,
            'file_size': file_size,
            'file_type': file_type,
            'timestamp': msg.timestamp.isoformat(),
            'status': 'sent',
        }
        try:
            s_user = User.query.get(int(sender_id)) if sender_id else None
            if s_user:
                message_data['sender_avatar_url'] = s_user.avatar_url
                message_data['sender_username'] = s_user.username
                message_data['sender_name'] = s_user.display_name or s_user.username
        except Exception:
            pass

        # Send ACK back to sender
        if client_message_id:
            ack_data = {'client_message_id': client_message_id, 'message_id': msg.id, 'status': 'sent'}
            socketio.emit('message_sent_ack', ack_data, room=request.sid)
            logger.debug("Sent ACK for file message to sender: %s", ack_data)

        # Broadcast: group -> all members, otherwise single receiver
        if group_id:
            try:
                members = GroupMember.query.filter_by(group_id=int(group_id)).all()
                for m in members:
                    socketio.emit('receive_message', message_data, room=f'user-{m.user_id}')
                logger.info('Emitted file message_id=%s to group %s members=%s', msg.id, group_id, len(members))
            except Exception:
                logger.exception('Error emitting file message to group %s', group_id)
        else:
            receiver_room = f'user-{receiver_id}'
            logger.debug("Emitting file message to receiver room '%s'", receiver_room)
            try:
                socketio.emit('receive_message', message_data, room=receiver_room)
                logger.info("Emitted file message_id=%s to %s", msg.id, receiver_room)
            except Exception as e:
                logger.exception("Error emitting file message to %s: %s", receiver_room, str(e))

        logger.debug("[SEND_FILE_MESSAGE] END - SUCCESS sender=%s receiver=%s message_id=%s", sender_id, receiver_id, msg.id)

    @socketio.on('typing')
    def handle_typing(data):
        """Broadcast typing indicator."""
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        is_typing = data.get('is_typing', False)
        
        print(f"[CHAT][NHẬN] [TYPING] sender={sender_id} receiver={receiver_id} typing={is_typing}")
        
        # Send to receiver only
        receiver_room = f'user-{receiver_id}'
        socketio.emit('user_typing', {
            'sender_id': sender_id,
            'is_typing': is_typing
        }, room=receiver_room)
        print(f"[CHAT][GỬI] user_typing -> room={receiver_room}")

    @socketio.on('command')
    def handle_command(payload):
        """Handle generic JSON command payloads from client.
        Expected format: { action: 'GET_CONTACTS_LIST', data: {...}, token: 'jwt' }
        Responds with event 'command_response' and a JSON body containing status/action/data.
        """
        try:
            print(f"[CHAT][NHẬN] [COMMAND] from sid={request.sid} payload={payload}")
            if not payload or not isinstance(payload, dict):
                socketio.emit('command_response', {'status': 'ERROR', 'action': None, 'error': 'Invalid payload'}, room=request.sid)
                return

            action = payload.get('action')
            if action == 'GET_CONTACTS_LIST':
                token = payload.get('token')
                auth = decode_token(token) if token else None
                if not auth:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'CONTACTS_LIST_RESULT', 'error': 'Invalid token'}, room=request.sid)
                    return
                user_id = auth.get('user_id')
                contacts = GetContactsList(user_id)
                socketio.emit('command_response', {'status': 'SUCCESS', 'action': 'CONTACTS_LIST_RESULT', 'data': contacts}, room=request.sid)
                print(f"[CHAT][GỬI] [COMMAND] CONTACTS_LIST_RESULT sent to sid={request.sid}")
                return

            if action == 'FRIEND_REQUEST':
                token = payload.get('token')
                auth = decode_token(token) if token else None
                if not auth:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'FRIEND_REQUEST_SENT', 'error': 'Invalid token'}, room=request.sid)
                    return
                sender_id = auth.get('user_id')
                data = payload.get('data') or {}
                target_phone = data.get('target_phone')
                target_user_id = data.get('target_user_id')

                ok, msg, friend_obj, target_id = AddFriendRequest(sender_id, target_user_id=target_user_id, target_phone=target_phone)
                if not ok:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'FRIEND_REQUEST_SENT', 'error': msg}, room=request.sid)
                    return

                # Notify sender that request was created
                socketio.emit('command_response', {'status': 'SUCCESS', 'action': 'FRIEND_REQUEST_SENT', 'data': {'friend_id': friend_obj.id, 'target_user_id': target_id}}, room=request.sid)

                # Notify target user in real-time (if they're online in their room)
                try:
                    target_room = f'user-{target_id}'
                    socketio.emit('friend_request_received', {'event': 'FRIEND_REQUEST_RECEIVED', 'from_user': str(sender_id)}, room=target_room)
                    print(f"[CHAT][GỬI] Friend request real-time -> room={target_room}")
                except Exception as e:
                    print(f"[FRIENDS] Error emitting real-time notify: {e}")

                return

            if action == 'BLOCK_USER':
                token = payload.get('token')
                auth = decode_token(token) if token else None
                if not auth:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'BLOCK_USER', 'error': 'Invalid token'}, room=request.sid)
                    return
                user_id = auth.get('user_id')
                data = payload.get('data') or {}
                target = data.get('target')
                if not target:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'BLOCK_USER', 'error': 'missing_target'}, room=request.sid)
                    return
                # allow target either as id or string numeric
                try:
                    target_id = int(target)
                except Exception:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'BLOCK_USER', 'error': 'invalid_target'}, room=request.sid)
                    return
                ok, res = AddBlock(user_id, target_id)
                if not ok:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'BLOCK_USER', 'error': res}, room=request.sid)
                    return
                socketio.emit('command_response', {'status': 'SUCCESS', 'action': 'BLOCK_USER', 'data': {'target_id': str(target_id)}}, room=request.sid)
                # notify target (optional)
                try:
                    target_room = f'user-{target_id}'
                    socketio.emit('user_blocked', {'event': 'USER_BLOCKED', 'by_user': str(user_id)}, room=target_room)
                except Exception as e:
                    print(f"[BLOCK] error notifying target: {e}")
                return

            if action == 'UNBLOCK_USER':
                token = payload.get('token')
                auth = decode_token(token) if token else None
                if not auth:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'UNBLOCK_USER', 'error': 'Invalid token'}, room=request.sid)
                    return
                user_id = auth.get('user_id')
                data = payload.get('data') or {}
                target = data.get('target')
                if not target:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'UNBLOCK_USER', 'error': 'missing_target'}, room=request.sid)
                    return
                try:
                    target_id = int(target)
                except Exception:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'UNBLOCK_USER', 'error': 'invalid_target'}, room=request.sid)
                    return
                ok, res = RemoveBlock(user_id, target_id)
                if not ok:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'UNBLOCK_USER', 'error': res}, room=request.sid)
                    return
                socketio.emit('command_response', {'status': 'SUCCESS', 'action': 'UNBLOCK_USER', 'data': {'target_id': str(target_id)}}, room=request.sid)
                return

            if action == 'FRIEND_ACCEPT' or action == 'FRIEND_REJECT':
                token = payload.get('token')
                auth = decode_token(token) if token else None
                if not auth:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': action, 'error': 'Invalid token'}, room=request.sid)
                    return
                actor_id = auth.get('user_id')
                data = payload.get('data') or {}
                request_id = data.get('request_id')
                if not request_id:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': action, 'error': 'missing_request_id'}, room=request.sid)
                    return

                if action == 'FRIEND_ACCEPT':
                    ok, msg, fr_obj, requester_id = AcceptFriendRequest(request_id, actor_id)
                    if not ok:
                        socketio.emit('command_response', {'status': 'ERROR', 'action': 'FRIEND_ACCEPT', 'error': msg}, room=request.sid)
                        return
                    # Notify accepter (actor) of success
                    socketio.emit('command_response', {'status': 'SUCCESS', 'action': 'FRIEND_ACCEPT', 'data': {'request_id': request_id, 'friend_id': fr_obj.id}}, room=request.sid)
                    # Notify original requester in real-time
                    try:
                        requester_room = f'user-{requester_id}'
                        socketio.emit('friend_request_accepted', {'event': 'FRIEND_ACCEPTED', 'user_id': str(actor_id)}, room=requester_room)
                        print(f"[CHAT][GỬI] Friend accepted notify -> room={requester_room}")
                    except Exception as e:
                        print(f"[FRIENDS] Error emitting accepted notify: {e}")
                    return

                if action == 'FRIEND_REJECT':
                    ok, msg, requester_id = RejectFriendRequest(request_id, actor_id)
                    if not ok:
                        socketio.emit('command_response', {'status': 'ERROR', 'action': 'FRIEND_REJECT', 'error': msg}, room=request.sid)
                        return
                    socketio.emit('command_response', {'status': 'SUCCESS', 'action': 'FRIEND_REJECT', 'data': {'request_id': request_id}}, room=request.sid)
                    try:
                        requester_room = f'user-{requester_id}'
                        socketio.emit('friend_request_rejected', {'event': 'FRIEND_REJECTED', 'user_id': str(actor_id)}, room=requester_room)
                        print(f"[CHAT][GỬI] Friend rejected notify -> room={requester_room}")
                    except Exception as e:
                        print(f"[FRIENDS] Error emitting rejected notify: {e}")
                    return

            if action == 'CONTACTS_SYNC':
                token = payload.get('token')
                auth = decode_token(token) if token else None
                if not auth:
                    socketio.emit('command_response', {'status': 'ERROR', 'action': 'CONTACTS_SYNC_RESULT', 'error': 'Invalid token'}, room=request.sid)
                    return
                user_id = auth.get('user_id')
                data = payload.get('data') or {}
                contacts = data.get('contacts') or []
                matches, changed = SyncContacts(user_id, contacts)
                socketio.emit('command_response', {'status': 'SUCCESS', 'action': 'CONTACTS_SYNC_RESULT', 'friends': matches}, room=request.sid)
                if changed:
                    # emit contact updated event to user room
                    try:
                        socketio.emit('contact_updated', {'event': 'CONTACT_UPDATED', 'data': matches}, room=request.sid)
                    except Exception as e:
                        print(f"[CONTACTS] Error emitting update: {e}")
                return

            # Unknown action
            socketio.emit('command_response', {'status': 'ERROR', 'action': action, 'error': 'Unknown action'}, room=request.sid)
        except Exception as e:
            print(f"[COMMAND] Error handling command: {e}")
            socketio.emit('command_response', {'status': 'ERROR', 'action': None, 'error': 'Server error'}, room=request.sid)

    @socketio.on('group_created_notify')
    def handle_group_created_notify(payload):
        """Receive a client-side notification that a group was created and forward
        a lightweight 'group_created_notify' event to the listed member rooms so
        they can refresh their groups list.
        Expected payload: { group_id, group_name, members: [id,..], created_by }
        """
        try:
            if not payload or not isinstance(payload, dict):
                return
            members = payload.get('members') or []
            group_id = payload.get('group_id')
            group_name = payload.get('group_name') or payload.get('name')
            for m in members:
                try:
                    # emit to each user's personal room
                    socketio.emit('group_created_notify', {'group_id': group_id, 'group_name': group_name}, room=f'user-{m}')
                except Exception:
                    logger.exception('Error emitting group_created_notify to user %s', m)
        except Exception:
            logger.exception('Error in handle_group_created_notify')

    @socketio.on('edit_message')
    def handle_edit_message(data):
        """Allow sender to edit their message. data: { message_id, user_id, new_content }"""
        message_id = data.get('message_id')
        user_id = data.get('user_id')
        new_content = data.get('new_content')
        print(f"[CHAT][NHẬN] [EDIT] message_id={message_id} user={user_id}")
        if not message_id or not user_id or new_content is None:
            print('[EDIT] Missing fields')
            return
        try:
            msg = Message.query.get(message_id)
            if not msg:
                print('[EDIT] Message not found')
                return
            if int(msg.sender_id) != int(user_id):
                print('[EDIT] User not owner of message')
                return
            msg.content = new_content
            from datetime import datetime
            msg.timestamp = datetime.utcnow()
            db.session.commit()
            # Emit update to participants
            target_rooms = [f'user-{msg.sender_id}', f'user-{msg.receiver_id}']
            payload = {
                'message_id': message_id,
                'new_content': new_content,
                'timestamp': msg.timestamp.isoformat()
            }
            for r in set(target_rooms):
                try:
                    socketio.emit('message_edited', payload, room=r)
                except Exception as e:
                    print(f'[EDIT] Error emitting to {r}: {e}')
            print('[EDIT] Success')
        except Exception as e:
            db.session.rollback()
            print('[EDIT] Error:', e)

    @socketio.on('recall_message')
    def handle_recall_message(data):
        """Allow sender to recall (delete) a message. data: { message_id, user_id }"""
        message_id = data.get('message_id')
        user_id = data.get('user_id')
        print(f"[CHAT][NHẬN] [RECALL] message_id={message_id} user={user_id}")
        if not message_id or not user_id:
            print('[RECALL] Missing fields')
            return
        try:
            msg = Message.query.get(message_id)
            if not msg:
                print('[RECALL] Message not found')
                return
            if int(msg.sender_id) != int(user_id):
                print('[RECALL] User not owner of message')
                return
            # Simple recall: delete row from DB
            db.session.delete(msg)
            db.session.commit()
            payload = {'message_id': message_id}
            target_rooms = [f'user-{user_id}', f'user-{msg.receiver_id}']
            for r in set(target_rooms):
                try:
                    socketio.emit('message_recalled', payload, room=r)
                except Exception as e:
                    print(f'[RECALL] Error emitting to {r}: {e}')
            print('[RECALL] Success')
        except Exception as e:
            db.session.rollback()
            print('[RECALL] Error:', e)

    @socketio.on('disconnect')
    def handle_disconnect(data=None):
        print(f"[CHAT][NHẬN] [DISCONNECT] sid={request.sid}")
        # Remove user_id from mapping on disconnect
        for uid, sid in list(user_sockets.items()):
            if sid == request.sid:
                # remove mapping and remember uid for notifying friends
                del user_sockets[uid]
                removed_uid = uid
                print(f"[CHAT][NHẬN] ✅ Removed user_id={uid} from mapping")
                break
        # Notify friends that the user went offline (if we know which user was removed)
        try:
            if 'removed_uid' in locals():
                # Find friends in both directions
                outgoing = Friend.query.filter_by(user_id=removed_uid, status='accepted').all() or []
                incoming = Friend.query.filter_by(friend_id=removed_uid, status='accepted').all() or []
                friend_ids = set()
                for f in outgoing:
                    friend_ids.add(f.friend_id)
                for f in incoming:
                    friend_ids.add(f.user_id)
                for fid in friend_ids:
                    try:
                        # emit to each friend's personal room
                        socketio.emit('user_offline', {'user_id': removed_uid}, room=f'user-{fid}')
                        print(f"[CHAT][GỬI] user_offline emitted for {removed_uid} to user-{fid}")
                    except Exception:
                        print(f"[CHAT][GỬI] Error emitting user_offline to user-{fid}")
                # Persist offline status
                try:
                    u = User.query.get(int(removed_uid))
                    if u:
                        u.status = 'offline'
                        db.session.commit()
                except Exception:
                    db.session.rollback()
                    print('[CHAT] Failed to persist user offline status for', removed_uid)
                # Recompute group online status for groups the user belonged to
                try:
                    gms = GroupMember.query.filter_by(user_id=int(removed_uid)).all()
                    group_ids = set([gm.group_id for gm in gms])
                    for gid in group_ids:
                        try:
                            members = GroupMember.query.filter_by(group_id=gid).all()
                            online_count = 0
                            for m in members:
                                try:
                                    if str(m.user_id) in user_sockets or m.user_id in user_sockets:
                                        online_count += 1
                                    else:
                                        mu = User.query.get(m.user_id)
                                        if mu and mu.status == 'online':
                                            online_count += 1
                                except Exception:
                                    continue
                            grp = Group.query.get(gid)
                            if grp:
                                new_status = 'online' if online_count >= 2 else 'offline'
                                if getattr(grp, 'status', None) != new_status:
                                    try:
                                        grp.status = new_status
                                        db.session.commit()
                                    except Exception:
                                        db.session.rollback()
                                    try:
                                        for m in members:
                                            try:
                                                socketio.emit('group_updated', {'group_id': gid, 'status': new_status}, room=f'user-{m.user_id}')
                                            except Exception:
                                                print('[CHAT] Failed to emit group_updated to user', m.user_id)
                                    except Exception:
                                        print('[CHAT] Failed to emit group_updated for', gid)
                        except Exception:
                            print('[CHAT] Error recomputing online count for group', gid)
                except Exception:
                    print('[CHAT] Error while recomputing groups after disconnect for user', removed_uid)
            # also broadcast a generic offline event for compatibility
            emit('user_offline', {'sid': request.sid}, broadcast=True)
        except Exception:
            print('[CHAT] Error while emitting user_offline to friends')
        print("[CHAT][GỬI] [DISCONNECT] END")