#!/usr/bin/env python3
"""
Test helper to exercise realtime notifications:
- send a message (emit 'send_message')
- send a friend request via socket command (action: 'FRIEND_REQUEST')

Configure via environment variables:
- BACKEND_URL (default http://localhost:5000)
- RECEIVER_USERNAME (required)
- ACTIONS: comma-separated list: message,friend (default: message)

Example:
  RECEIVER_USERNAME=vietpham ACTIONS=message,friend python3 scripts/test_notifications.py

"""
import os
import sys
import time
import requests
import socketio

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
SOCKET_URL = os.environ.get('SOCKET_URL', BACKEND_URL)
RECEIVER_USERNAME = os.environ.get('RECEIVER_USERNAME')
ACTIONS = (os.environ.get('ACTIONS') or 'message').split(',')

TEST_USERNAME = f"test_bot_notify_{int(time.time())}"
TEST_PASSWORD = "P@ssw0rd123"
EMOJI_TO_SEND = os.environ.get('EMOJI', '👋')

if not RECEIVER_USERNAME:
    print('Please set RECEIVER_USERNAME env var to the username to receive test notifications')
    sys.exit(1)

session = requests.Session()

def register_and_login():
    # Try to register; ignore if exists
    try:
        session.post(f"{BACKEND_URL}/register", json={'username': TEST_USERNAME, 'password': TEST_PASSWORD, 'display_name': 'Test Notify Bot'}, timeout=8)
    except Exception:
        pass

    resp = session.post(f"{BACKEND_URL}/login", json={'username': TEST_USERNAME, 'password': TEST_PASSWORD}, timeout=8)
    if resp.status_code != 200:
        print('Login failed:', resp.status_code, resp.text)
        sys.exit(1)
    j = resp.json()
    token = j.get('token')
    user_id = j.get('user_info', {}).get('id')
    print('Logged in as', TEST_USERNAME, 'id=', user_id)
    session.headers.update({'Authorization': f'Bearer {token}'})
    return token, user_id

def find_user_by_username(username):
    try:
        resp = session.get(f"{BACKEND_URL}/users/search", params={'q': username}, timeout=8)
        if resp.status_code == 200:
            for u in resp.json():
                if u.get('username') == username:
                    return u
    except Exception:
        pass
    # fallback: list all users
    try:
        resp = session.get(f"{BACKEND_URL}/users", timeout=8)
        if resp.status_code == 200:
            for u in resp.json():
                if u.get('username') == username:
                    return u
    except Exception:
        pass
    return None

def main():
    token, user_id = register_and_login()

    recv = find_user_by_username(RECEIVER_USERNAME)
    if not recv:
        print('Receiver user not found:', RECEIVER_USERNAME)
        sys.exit(1)
    receiver_id = recv.get('id')
    print('Receiver id=', receiver_id)

    sio = socketio.Client()

    @sio.event
    def connect():
        print('Socket connected, sid=', sio.sid)
        sio.emit('join', {'user_id': user_id})

    @sio.event
    def disconnect():
        print('Socket disconnected')

    @sio.on('message_sent_ack')
    def on_ack(d):
        print('[ACK]', d)

    @sio.on('receive_message')
    def on_receive(d):
        print('[RECEIVE_MESSAGE]', d)

    print('Connecting to socket:', SOCKET_URL)
    sio.connect(SOCKET_URL, transports=['websocket'])

    if 'message' in ACTIONS:
        print('Sending message to', receiver_id)
        client_msg_id = f'cli_notif_{int(time.time())}'
        payload = {'sender_id': user_id, 'receiver_id': receiver_id, 'content': EMOJI_TO_SEND, 'client_message_id': client_msg_id}
        sio.emit('send_message', payload)
        # wait a bit
        time.sleep(2)

    if 'friend' in ACTIONS:
        print('Sending friend request to', receiver_id)
        # Use socket command pattern so server will emit friend_request_received to target room
        cmd = {'action': 'FRIEND_REQUEST', 'data': {'target_user_id': receiver_id}, 'token': token}
        sio.emit('command', cmd)
        time.sleep(1)

    print('Done. Disconnecting')
    sio.disconnect()

if __name__ == '__main__':
    main()
