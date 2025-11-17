#!/usr/bin/env python3
"""
End-to-end test: register a temporary user, login, find receiver 'vietpham', connect socket.io and send an emoji message, wait for ACK, then call GET /messages to verify persistence.
"""
import os
import time
import requests
import socketio
import sys

BACKEND_URL = os.environ.get('BACKEND_URL') or 'http://localhost:5000'
SOCKET_URL = os.environ.get('SOCKET_URL') or BACKEND_URL

TEST_USERNAME = f"test_bot_full_{int(time.time())}"
TEST_PASSWORD = "P@ssw0rd123"
RECEIVER_USERNAME = "vietpham"
EMOJI_TO_SEND = "❤️"

session = requests.Session()

print(f"Using BACKEND_URL={BACKEND_URL}")

# register
print('\n==> Registering test user:', TEST_USERNAME)
resp = session.post(f"{BACKEND_URL}/register", json={
    'username': TEST_USERNAME,
    'password': TEST_PASSWORD,
    'display_name': 'Test Bot Full'
}, timeout=10)
print('Register status:', resp.status_code)
print('Register resp:', resp.text)
if resp.status_code != 200:
    print('Registration failed, abort')
    sys.exit(1)

# login
print('\n==> Logging in')
resp = session.post(f"{BACKEND_URL}/login", json={'username': TEST_USERNAME, 'password': TEST_PASSWORD}, timeout=10)
print('Login status:', resp.status_code)
print('Login resp:', resp.text)
if resp.status_code != 200:
    print('Login failed, abort')
    sys.exit(1)
login_json = resp.json()
if not login_json.get('success'):
    print('Login returned no success')
    sys.exit(1)
token = login_json.get('token')
user_id = login_json.get('user_info', {}).get('id')
print('Got token & user_id=', user_id)

session.headers.update({'Authorization': f'Bearer {token}'})

# find receiver
print('\n==> Finding receiver', RECEIVER_USERNAME)
resp = session.get(f"{BACKEND_URL}/users/search", params={'q': RECEIVER_USERNAME}, timeout=10)
print('Search status:', resp.status_code)
print('Search resp:', resp.text)
users = resp.json() if resp.status_code == 200 else []
receiver = None
for u in users:
    if u.get('username') == RECEIVER_USERNAME:
        receiver = u
        break
if not receiver:
    resp2 = session.get(f"{BACKEND_URL}/users", timeout=10)
    allu = resp2.json() if resp2.status_code == 200 else []
    for u in allu:
        if u.get('username') == RECEIVER_USERNAME:
            receiver = u
            break
if not receiver:
    print('Receiver not found, abort')
    sys.exit(1)
receiver_id = receiver.get('id')
print('Receiver found id=', receiver_id)

# socket.io connect and send
sio = socketio.Client()
ack_received = None

@sio.on('connect')
def on_connect():
    print('Socket connected, sid=', sio.sid)
    sio.emit('join', {'user_id': user_id})

@sio.on('message_sent_ack')
def on_ack(data):
    global ack_received
    print('[ACK]', data)
    ack_received = data

@sio.on('receive_message')
def on_receive(data):
    print('[RECEIVE_MESSAGE]', data)

@sio.on('connect_error')
def on_conn_err(data):
    print('Connect error', data)

@sio.on('disconnect')
def on_disc():
    print('Socket disconnected')

print('\n==> Connecting socket...')
try:
    sio.connect(SOCKET_URL, transports=['websocket'])
except Exception as e:
    print('Socket connect failed:', e)
    sys.exit(1)

# send
client_msg_id = f'cli_full_{int(time.time())}'
payload = {
    'sender_id': user_id,
    'receiver_id': receiver_id,
    'content': EMOJI_TO_SEND,
    'client_message_id': client_msg_id
}
print('Emitting payload:', payload)
sio.emit('send_message', payload)

# wait up to 5s for ack
wait = 0
while wait < 6 and ack_received is None:
    time.sleep(1)
    wait += 1

print('ACK received:', ack_received)

# Query messages between users
print('\n==> Querying GET /messages between', user_id, 'and', receiver_id)
resp = session.get(f"{BACKEND_URL}/messages", params={'sender_id': user_id, 'receiver_id': receiver_id}, timeout=10)
print('GET /messages status:', resp.status_code)
print('GET /messages resp:', resp.text)

# check if message exists (by content or message id from ack)
msgs = resp.json() if resp.status_code == 200 else []
found = False
for m in msgs:
    if m.get('id') == (ack_received.get('message_id') if ack_received else None) or m.get('content') == EMOJI_TO_SEND:
        found = True
        print('Found persisted message:', m)
        break

if not found:
    print('Message not found in GET /messages — persistence failed')
else:
    print('Message persisted successfully')

sio.disconnect()
print('Done')
