# Pseudocode Toàn bộ dự án (chi tiết)

Tài liệu này đưa pseudocode mô tả logic chính cho hầu hết các file/module trong dự án: backend (models, routes, sockets, services), frontend (api, socket, upload), khởi động app, upload/S3, ngrok, và những lưu ý deploy/scale.

Mục tiêu: cho người đọc nhanh hiểu hành vi từng chức năng, flow dữ liệu, và nơi cần sửa khi thay đổi.

---

## A. Khởi động ứng dụng (server/app.py)

START_APP:
  set CLIENT_BUILD_DIR = ../client/build
  if exists(CLIENT_BUILD_DIR):
    app = Flask(static_folder=CLIENT_BUILD_DIR)
  else:
    app = Flask()
  app.config.from_object(Config)

  socketio = SocketIO(app, cors_allowed_origins="*")
  add CORS handlers via @app.after_request và middleware _CORSMiddleware
  db.init_app(app); migrate.init_app(app, db)

  register blueprints:
    - auth (register/login/logout/refresh/me/check_username/forgot_password)
    - users, messages, friends, groups, uploads, stickers

  create tables if missing
  seed demo users if DB empty

  register socket event handlers from server/sockets/*

  if ENV ENABLE_NGROK == 'true':
    public_url = start_ngrok(app, port)
    app.config["BASE_URL"] = public_url

  socketio.run(app, host, port, allow_unsafe_werkzeug=True)
END

---

## B. Models (server/models/*.py) — conceptual pseudocode

MODEL User:
  id, username, password_hash, display_name, phone_number, avatar_url, status, created_at, updated_at
  methods: check_password(password), to_dict()

MODEL Message:
  id, sender_id, receiver_id, content, timestamp, file_url, message_type, sticker_id, sticker_url, group_id

MODEL Friend:
  id, user_id, friend_id, status (pending/accepted), created_at

MODEL Group:
  id, name, owner_id, created_at
MODEL GroupMember:
  id, group_id, user_id, role

MODEL Block:
  id, user_id, target_id

MODEL ContactSync:
  id, user_id, contacts_json, updated_at
  methods: set_contacts(list), get_contacts()

MODEL MessageReaction:
  id, message_id, user_id, reaction, created_at

MODEL Sticker:
  id, pack, url, type

---

## C. Services (server/services/*)

AUTH_SERVICE (server/services/auth_service.py):
  register_user(username, password, display_name):
    if User exists: return error
    hash = generate_password_hash(password)
    create User(hash, display_name)
    return success

  login_user(username, password):
    user = find User
    if not user or not check_password: return invalid
    payload = { user_id: user.id, exp: now + 24h }
    token = jwt.encode(payload, JWT_SECRET)
    return {success: true, token}

  create_token_for_user(user, hours=24): return jwt
  decode_token(token): try jwt.decode -> return payload or None
  logout_user(token): add token to in-memory blacklist
  is_token_blacklisted(token): check blacklist

NETWORK_SETUP (server/services/network_setup.py):
  start_ngrok(app, port):
    if NGROK_AUTH_TOKEN: ngrok.set_auth_token
    existing = ngrok.get_tunnels()
    if tunnel exists for port: reuse
    else: connect new tunnel -> return public_url

OTP_SERVICE (server/services/otp_service.py):
  generate_otp(contact): create OTP, store temporary (in-memory or db)
  verify_otp(contact, otp): check stored OTP -> return success/fail

RATE_LIMIT (server/services/rate_limit.py):
  decorator rate_limit(key_func, limit, period):
    check store (in-memory/redis) for count -> allow/deny

LOGGING_HELPERS (server/utils/logging_helpers.py):
  LoggingDedupFilter(window_seconds): filter repeated identical log messages within window

---

## D. Routes (server/routes/*) — pseudocode per route

ROUTE /register (POST):
  read username, password, display_name
  return auth_service.register_user(...)

ROUTE /login (POST):
  read username, password
  result = auth_service.login_user(...)
  return token or error

ROUTE /logout (POST):
  token = read Authorization
  auth_service.logout_user(token)
  return success

ROUTE /users (GET):
  return list of users (optionally search, paginate)

ROUTE /users/me (GET/PATCH):
  token -> payload = decode_token
  if no payload: 401
  GET: return current user data
  PATCH: update profile fields, save, and notify via socket (contact_updated)

ROUTE /messages (GET):
  params: sender_id, receiver_id, limit
  query Message where (sender==a & receiver==b) OR (sender==b & receiver==a), order asc
  return list with sender avatar, content, file_url, timestamp

ROUTE /messages (POST) ? (if exists):
  HTTP send message fallback (if used): validate and create Message (like socket handler), return saved message

ROUTE /messages/conversations (GET):
  token -> uid
  find latest message per conversation (group or user), enrich with display name/avatar
  return sorted list

ROUTE /messages/upload (POST):
  form data: file + sender_id + receiver_id
  save to server/storage/uploads or S3 (see Uploads route)
  create Message with file_url and return 201

ROUTE /uploads/presigned-url (POST):
  Authorization -> payload
  read filename, content_type, file_size
  generate key = user{user_id}/{timestamp}_{uuid}_{secure(filename)}
  s3_client = get_s3_client()
  presigned_post = s3_client.generate_presigned_post(...)
  file_url = build s3 url
  return { upload_url, fields, file_url, key }

ROUTE /uploads/file (POST):
  Authorization -> user_id
  file = request.files['file']
  if s3 configured: upload_fileobj to S3 with ACL public-read -> file_url
  else: save locally to storage/uploads -> file_url = /uploads/files/<name>
  return file_url

ROUTE /uploads/avatar (POST):
  possibly auth
  save avatar (S3 or local)
  if auth: persist avatar_url into user and emit 'contact_updated' via socket to friends
  return avatar_url

ROUTE /uploads/files/<filename> (GET):
  serve file from storage/uploads

ROUTE groups, friends, stickers: similar CRUD operations

---

## E. Socket logic (server/sockets/chat_events.py)

GLOBAL user_sockets = {}  // map user_id -> sid

REGISTER_EVENTS(socketio):

  @on('connect'):
    log
    emit('connected', {msg})

  @on('join') with data:
    user_id = data.user_id
    room = data.room
    if user_id:
      user_sockets[user_id] = request.sid
      room_name = 'user-' + user_id
    else if room:
      room_name = room
    else: return
    join_room(room_name)
    emit('user_joined', {user_id, room}, room=room_name)
    notify friends: for friend_id in friends(user_id): emit('user_joined', {user_id}, room='user-'+friend_id)

  @on('send_message') with data:
    extract sender_id, receiver_id, group_id, content, client_message_id, reply_to, forward_from
    validate payload (sender, receiver/group, content not empty)

    if not group_id:
      if Block exists blocking sender/receiver: if client_message_id emit ack blocked to sender; return

    try:
      if group_id:
        verify group exists and sender is member
        receiver_for_db = group.owner_id or sender
        msg = Message(sender_id, receiver_for_db, content, group_id)
      else:
        msg = Message(sender_id, receiver_id, content)
      db.session.add(msg); db.session.commit()
    except Exception as e:
      db.session.rollback()
      if client_message_id: emit('message_sent_ack', {client_message_id, status:'error', error_detail})
      return

    message_data = build with msg.id, sender_id, receiver_id, content, timestamp, sender profile info

    if group_id:
      emit('receive_message', message_data, room='group-'+group_id)
    else:
      emit('receive_message', message_data, room='user-'+receiver_id)
      if client_message_id: emit('message_sent_ack', {client_message_id, status:'sent', message_id: msg.id}, room=request.sid)

  @on('add_reaction') with data:
    save MessageReaction to DB
    emit('message_reaction', {message_id, user_id, reaction}, room appropriate)

  @on('typing') with data:
    emit('user_typing', data, room='user-'+receiver_id)

  @on('disconnect'):
    find user_id by sid in user_sockets, remove mapping
    for friend in friends(user_id): emit('user_offline', {user_id}, room='user-'+friend)

NOTE: use try/except to avoid socket crash on DB errors; write debug logs to file if save fails.

SIGNALING_EVENTS (server/sockets/signaling_events.py):
  @on('signal'):
    emit('signal', data, broadcast=True)  // placeholder for WebRTC signaling

---

## F. Frontend services (client/src/services/*.js)

API (client/src/services/api.js):
  determine API_URL from env (REACT_APP_API_URL or BACKEND_URL or window.location.origin)
  create axios instance `api` with baseURL
  add request interceptor: attach Authorization: Bearer <token> if present
  add response interceptor: log in dev

  authAPI:
    register(username, password, display_name) => api.post('/register', ...)
    login(username, password) => api.post('/login', ...)
    logout() => remove token locally
    forgotPassword, resetPassword => api.post(...) or mock flows

  userAPI:
    getUsers() => api.get('/users')
    getCurrent() => api.get('/users/me')
    updateMe(payload) => api.patch('/users/me', payload)
    friends endpoints => api.get/post/delete

  messageAPI:
    getMessages(senderId, receiverId) => api.get('/messages', {params})
    sendMessage(senderId, receiverId, content) => api.post('/messages', { ... }) (if used)
    sendFile(formData) => api.post('/messages/upload', formData)
    getConversations() => api.get('/messages/conversations')

  groupAPI: createGroup, joinGroup, getMyGroups, etc.

Socket client (client/src/services/socket.js):
  initializeSocket():
    if socket exists return
    SOCKET_URL = env or default
    socket = io(SOCKET_URL, { reconnection options })
    socket.on('connect'): debug log
    socket.on('disconnect'): debug
    socket.on('connect_error'): console.error
    return socket

  getSocket(), closeSocket()

  sendCommand(cmd): socket.emit('command', cmd)  // generic pattern
  requestContactsList(token): sendCommand({action:'GET_CONTACTS_LIST', token})

  joinUserRoom(userId): socket.emit('join', { user_id: userId })
  sendMessage(senderId, receiverId, content, opts):
    payload = { sender_id, receiver_id, content, client_message_id, reply_to, forward_from }
    socket.emit('send_message', payload)
    in dev: debug logging

  onReceiveMessage(callback): attach to 'receive_message' event
  onMessageSentAck(callback): attach to 'message_sent_ack'
  onReaction, onTyping, onUserJoined, onUserOffline, onContactUpdated, onFriendRequestReceived etc.

Upload client (client/src/services/upload.js):
  uploadFile(file, token):
    formData.append('file', file)
    url = backendURL ? `${backendURL}/uploads/file` : '/uploads/file'
    axios.post(url, formData, headers: { Authorization: Bearer token }) => return data

  getPresignedURL(filename, contentType, fileSize, token):
    axios.post('/uploads/presigned-url', {filename, content_type, file_size}, {headers:{Authorization}})
    return response data (upload_url, fields, file_url)

Frontend app (client/src/App.js / components):
  - Provide routes: /login, /register, /forgot-password, /chat
  - ProtectedRoute reads token from localStorage and redirects to /login if missing
  - ChatBox component: after login, call initializeSocket(), joinUserRoom(userId), load conversations via messageAPI.getConversations(), handle UI events to sendMessage/upload

---

## G. DB & Storage behaviors

- DB: SQLAlchemy models stored in `server/storage/chatapp.db` (SQLite) by default for dev.
- When app starts, db.create_all() called to ensure tables exist (convenience for dev).
- Uploads: S3 when AWS credentials provided in config; else local storage `server/storage/uploads/`.
  - presigned flow: client uploads directly to S3 via form upload to presigned URL.
  - backend upload flow: server receives multipart, then either upload to S3 using boto3 or save to local path.

---

## H. Error handling & logs

- On DB save errors (e.g., saving messages), server writes debug traceback to `server/chat_save_error.log` and optionally `/tmp/chat_save_error.log`.
- LoggingDedupFilter used to reduce repeated identical log lines.
- Many try/except blocks ensure socket handlers don't crash the server.

---

## I. Scaling & Production notes (short)

- user_sockets is in-memory -> not suitable for multi-instance; use Redis + Flask-SocketIO message queue adapter.
- Token blacklist stored in-memory -> move to Redis/DB for cross-instance logout.
- CORS currently permissive for dev -> restrict allowed origins in production.
- For file uploads, presigned URL to S3 recommended to reduce backend load and avoid streaming large files through the server.

---

## J. Quick mapping: file -> responsibility

- `server/app.py`: init app, CORS, register blueprints, start ngrok, start socketio
- `server/routes/*.py`: REST endpoints
- `server/sockets/chat_events.py`: socket event handlers (join, send_message, typing, reactions)
- `server/services/auth_service.py`: JWT create/decode, register/login
- `server/services/network_setup.py`: start ngrok
- `server/models/*.py`: SQLAlchemy models
- `client/src/services/api.js`: axios wrapper for REST APIs
- `client/src/services/socket.js`: socket client wrapper
- `client/src/services/upload.js`: client upload helpers

---

Nếu bạn muốn tôi tiếp tục, tôi có thể:
- Chuyển pseudocode này thành sơ đồ sequence (Mermaid) cho các luồng chính (ví dụ: gửi tin nhắn 1:1, presigned upload).
- Sinh các unit/integration tests giả để kiểm thử `send_message` flow (Python script dùng socketio-client để emit event).
- Bắt đầu thực thi (sửa code) theo checklist nếu cần hoàn thiện tính năng cụ thể.

File đã lưu tại `vsls:/docs/PSEUDOCODE_FULL.md`.
