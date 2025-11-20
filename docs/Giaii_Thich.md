# Tổng quan kiến trúc & phần mạng

Tài liệu này tóm tắt cách hoạt động của code trong repository, các phần liên quan tới lập trình mạng (HTTP REST, WebSocket/Socket.IO, uploads, S3/ngrok, authentication), và nơi tìm đoạn mã tương ứng.

**Mục đích**: giúp thành viên trong nhóm nhanh nắm được luồng dữ liệu mạng, các endpoint quan trọng, và những file cần chỉnh khi thay đổi hành vi mạng.

---

**1. Tổng quan cấu trúc**
- Backend: `server/` (Flask + Flask-SocketIO)
  - `server/app.py`: entrypoint, khởi tạo Flask app, SocketIO, đăng ký blueprints (routes) và socket events. Cũng chứa middleware CORS và khởi tạo DB.
  - `server/routes/`: các HTTP API (ví dụ `messages.py`, `uploads.py`, `auth/*`, `users.py`, ...).
  - `server/sockets/`: sự kiện realtime (ví dụ `chat_events.py`, `signaling_events.py`).
  - `server/services/`: helper/service (ví dụ `network_setup.py`, `auth_service.py`, `otp_service.py`, `rate_limit.py`).
  - `server/storage/`: nơi lưu file tạm/local uploads (dùng khi S3 không cấu hình).
- Frontend: `client/` (React)
  - `client/src/services/api.js`: wrapper HTTP (axios) cho REST API.
  - `client/src/services/socket.js`: wrapper Socket.IO client, tất cả emit/on liên quan realtime.
  - `client/src/services/upload.js`: upload file (multipart hoặc sử dụng presigned S3).
  - `client/src/App.js`, `client/src/index.js`: entrypoints React + routing.

---

**2. Luồng mạng chính**

- HTTP REST (request/response):
  - Các API chính nằm trong `server/routes/*`. Ví dụ:
    - `GET /messages?sender_id=...&receiver_id=...` — xem lịch sử 1:1 (`server/routes/messages.py:get_messages`).
    - `POST /messages/upload` — upload file qua backend (lưu S3 hoặc local) (`messages.py:upload_file`).
    - `POST /uploads/presigned-url` — trả presigned POST URL cho client upload trực tiếp lên S3 (`server/routes/uploads.py:generate_presigned_url`).
    - `POST /uploads/file` và `POST /uploads/avatar` — upload qua backend (fallback nếu S3 ko cấu hình).
  - Bảo mật: Token JWT (in `Authorization: Bearer <token>`) được decode bằng `server/services/auth_service.py:decode_token` để lấy `user_id` cho các route cần auth.

- Real-time (Socket.IO):
  - Server dùng Flask-SocketIO: socket được khởi tạo trong `server/app.py` và sự kiện đăng ký trong `server/sockets/*`.
  - `server/sockets/chat_events.py` chứa hầu hết logic chat realtime:
    - event `connect`, `join` (tham gia room), `send_message` (nhận payload từ client, validate, lưu DB, broadcast tới recipient/group), các event: `typing`, `add_reaction`, `send_sticker`, ...
    - mapping `user_sockets` duy trì `user_id -> sid` để gửi message/presence tới phòng `user-<id>`.
  - Client socket API: `client/src/services/socket.js` xử lý kết nối (`initializeSocket`), gửi `send_message`, `joinUserRoom`, nhận `receive_message`, `message_sent_ack`, `user_joined`, v.v.

- File uploads + S3:
  - Hai luồng upload:
    1. Presigned URL (direct-to-S3): client gọi `POST /uploads/presigned-url` (kèm JWT) để lấy `upload_url` + `fields` và upload trực tiếp lên S3. Lợi ích: không phải stream file qua backend.
    2. Upload qua backend: client POST multipart tới `/uploads/file` hoặc `/messages/upload`. Backend có thể upload vào S3 (khi config AWS có đủ) hoặc lưu local vào `server/storage/uploads/`.
  - S3 client config: `server/routes/uploads.py:get_s3_client()` đọc credentials từ `app.config` (từ `server/config/settings.py`). Nếu thiếu credential, backend dùng local fallback.
  - File URL trả về thường có dạng `https://{bucket}.s3.{region}.amazonaws.com/{key}` hoặc đường dẫn local `/uploads/files/<name>`.

- Ngrok / Public URL:
  - `server/services/network_setup.py` chứa `start_ngrok` để mở public tunnel khi `ENABLE_NGROK=true`.
  - `app.py` gọi `start_ngrok` nếu bật — URL public được lưu vào `app.config['BASE_URL']`.

---

**3. Luồng xử lý message (1:1) tóm tắt**
1. Client gọi `sendMessage` (socket.emit `send_message`) với payload: `{ sender_id, receiver_id, content, client_message_id, ... }`.
2. Server `chat_events.handle_send_message` validate (kiểm block, group membership nếu group message), lưu `Message` vào DB (SQLAlchemy) và commit.
3. Sau khi lưu, server chuẩn bị `message_data` (thêm thông tin sender) và emit tới phòng đích:
   - Nếu 1:1: emit tới room `user-<receiver_id>` (và có thể gửi ack `message_sent_ack` về socket sender qua `request.sid`).
   - Nếu group: emit tới room `group-<id>` hoặc từng user member.
4. Client `onReceiveMessage` lắng nghe event `receive_message` để hiển thị tin nhắn realtime.

---

**4. Bảo mật & kiểm soát**
- JWT: tạo/giải mã trong `server/services/auth_service.py`. Token chứa `user_id` và thời hạn.
- Rate limit, OTP: xem `server/services/rate_limit.py`, `server/services/otp_service.py`.
- CORS: đơn giản hóa trong `app.py` (`add_cors_headers`) cho dev; tighten khi production.
- Blacklist token (logout): `auth_service.blacklist` giữ token bị logout (in-memory). Đổi sang persistent store nếu cần.

---

**5. Những file cốt lõi để sửa khi thay đổi mạng**
- Thêm API/đổi route: `server/routes/*.py` (đăng ký blueprint trong `server/app.py`).
- Đổi luồng realtime / event name: `server/sockets/chat_events.py` và `client/src/services/socket.js` (phải đồng bộ tên event).
- S3 / uploads: `server/routes/uploads.py`, `client/src/services/upload.js`, và cấu hình AWS trong `server/config/settings.py`.
- Ngrok / public: `server/services/network_setup.py` và biến môi trường `ENABLE_NGROK`, `NGROK_AUTH_TOKEN`.

---

**6. Lệnh hữu ích để chạy & debug**
- Chạy backend (dev):
```powershell
# Powershell (Windows)
cd <repo-root>\server
# tạo venv, cài dependencies, rồi
python -m pip install -r requirements.txt
python app.py
```
- Chạy frontend (dev):
```bash
cd client
npm install
npm start
```
- Bật ngrok tạm (nếu cần):
```bash
# bật bằng biến môi trường trên Windows PowerShell
$env:ENABLE_NGROK='true'; $env:NGROK_AUTH_TOKEN='YOUR_TOKEN'; python app.py
```

---

**7. Gợi ý triển khai & nâng cấp**
- Scale Socket.IO: nếu cần nhiều instance, dùng message queue (Redis) cho SocketIO (Flask-SocketIO supports Redis message queue). Hiện code dùng in-memory `user_sockets` nên không phù hợp multi-instance.
- Token blacklist: thay in-memory thành Redis/DB để hỗ trợ nhiều instance.
- File storage: khuyến nghị dùng S3 (presigned uploads) để giảm tải backend.
- Logging & monitoring: cấu hình `LOG_LEVEL`, gửi logs đến external system cho production.

---

Nếu bạn muốn, tôi có thể:
- Tạo phiên bản ngắn gọn (one-page) để dán trong `README.md`.
- Tạo sơ đồ sequence (text) cho luồng gửi/nhận message.
- Viết checklist để chuyển sang production (Redis, persistent token blacklist, CORS hardening).

File đã lưu tại: `docs/CODE_NETWORK_OVERVIEW.md`.

Tổng quan ngắn gọn
Ứng dụng này gồm hai phần chính: backend (server bằng Python/Flask) và frontend (client bằng React). Backend xử lý API HTTP (đăng nhập, gửi/nhận tin nhắn, upload file) và cả realtime (WebSocket qua Socket.IO) để gửi tin nhắn ngay lập tức giữa người dùng. Frontend gọi API để thao tác dữ liệu và kết nối Socket.IO để nhận tin tức realtime.

1) Khi server khởi động

File chính là app.py. Nó tạo một ứng dụng Flask, kết nối cơ sở dữ liệu và khởi động Socket.IO.
Nếu bạn bật ENABLE_NGROK=true, server cố gắng mở một đường hầm công khai bằng ngrok và lưu URL công khai vào cấu hình.
Server đăng ký các nhóm route (API) từ server/routes/* và các sự kiện realtime từ server/sockets/*.

2) Đăng nhập và xác thực (Auth)

Khi người dùng đăng nhập, frontend gửi yêu cầu HTTP tới API (ví dụ /login). Backend kiểm tra mật khẩu và tạo một JWT (mã thông báo).
JWT này được lưu trên client (localStorage) và được gửi kèm trong header Authorization: Bearer <token> cho các API cần quyền.
Backend giải mã token bằng auth_service.py để biết user_id của người gọi.
Khi user logout, token có thể bị đưa vào một danh sách đen tạm thời (in-memory) — nếu cần hoạt động đa instance, phải lưu danh sách này vào Redis/DB.

3) Gửi và nhận tin nhắn (quy trình 1:1)

Client sử dụng Socket.IO (socket.js) kết nối tới server. Sau khi kết nối, client gọi join với user_id để server biết socket của người đó. Server lưu mapping user_id -> sid trong user_sockets.
Khi user gửi tin nhắn, client emit event send_message kèm payload như { sender_id, receiver_id, content, client_message_id }.
Server (chat_events.py) nhận, kiểm tra (ví dụ: người gửi/nhận có chặn nhau không), lưu message vào cơ sở dữ liệu, rồi gửi (emit) message tới phòng của người nhận (room user-<receiver_id>) hoặc tới mọi thành viên nhóm nếu là group message.
Sau khi lưu, server có thể gửi ack (message_sent_ack) về socket gửi để client biết tin nhắn đã lưu thành công.
4) Realtime presence (trạng thái online/offline)

Khi client join room bằng join (với user_id), server đánh dấu user đó online (ghi vào user_sockets) và phát thông báo user_joined tới bạn bè của họ để cập nhật trạng thái online.
Khi socket ngắt kết nối (disconnect), server có thể phát user_offline để bạn bè biết
5) Upload file (hình ảnh, tệp)
Có hai cách upload:

Direct-to-S3 (khuyến nghị): client gọi POST /uploads/presigned-url kèm JWT để lấy một presigned POST (URL + fields). Client dùng form POST trực tiếp lên S3, giảm tải cho backend. File sau đó có URL công khai trên S3.
Qua backend: client POST multipart tới /uploads/file hoặc /messages/upload. Backend nhận file, kiểm tra kích thước, nếu có credential AWS thì upload lên S3, nếu không thì lưu cục bộ trong uploads. Sau đó backend trả về file_url để frontend hiển thị.
6) Các lỗi/thực tế cần chú ý

CORS: app.py dùng header CORS khá mở để tiện dev; khi deploy cần thu hẹp lại danh sách origin cho an toàn.
Hiện user_sockets là in-memory: nếu chạy nhiều instance backend (scale horizontal), mapping này chỉ tồn tại trên mỗi instance — cần Redis pub/sub để SocketIO hoạt động đa instance.
Token blacklist hiện lưu in-memory → không dùng được cho multi-instance. Dùng Redis/DB nếu muốn logout across instances.

7) Debug cơ bản

Xem log backend: chạy python app.py trong server và quan sát log.
Kiểm tra kết nối socket: frontend console sẽ log khi socket connect/disconnect.
Kiểm tra uploads: nếu S3 không cấu hình, file sẽ lưu trong uploads.
Xem bảng messages trong DB (SQLite file chatapp.db trong dự án) để kiểm tra message đã được lưu đúng chưa.

8) Nếu bạn muốn thay đổi một tính năng mạng

Thêm/đổi API HTTP → sửa trong server/routes/<file>.py và đăng ký (nếu cần) trong app.py.
Thay đổi event hay payload realtime → sửa chat_events.py và tương ứng socket.js. Cần giữ tên event và format payload đồng bộ giữa client/server.
Thay S3 hoặc presigned behavior → sửa uploads.py và frontend upload.js.