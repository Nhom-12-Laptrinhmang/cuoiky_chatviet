# Project quick start

This repository contains a React frontend (`/client`) and a Flask backend (`/server`).

Quick steps for others (clone + run):

1) Install Python 3.8+ and Node.js (14+ recommended).

2) From project root, start the backend (script will create a `.venv` and install requirements automatically):

```bash
# from project root
./run_backend.sh
```

This will:
- Create a virtualenv at `./.venv` if missing
- Install packages listed in `server/requirements.txt`
- Launch the Flask server on http://localhost:5000

# Vietnam Chat — Tài liệu & Hướng dẫn nhanh

Ứng dụng chat gồm frontend React (`client/`) và backend Flask + Socket.IO (`server/`). Tài liệu này tóm tắt cách cài và chạy local cho môi trường phát triển.

## Yêu cầu
- Python 3.8+ (hoặc Python 3.x mới)
- Node.js 14+ và npm
- Git

## Khởi động nhanh
1. Clone repo:

```bash
git clone <repo-url> vietnam-chat
cd vietnam-chat
```

2. Khởi động backend (script tạo `.venv` và cài dependencies):

```bash
./scripts/run_backend.sh
```

3. Khởi động frontend (terminal khác):

```bash
./scripts/run_frontend.sh
# hoặc
cd client && npm install && npm start
```

## Các lệnh hay dùng
- Chạy migration: `cd server && flask db migrate -m "msg" && flask db upgrade`.  
- Inspect DB: `python3 server/scripts/inspect_db.py`.  
- Migrate contacts từ JSON: `python3 server/scripts/migrate_contacts_json_to_sql.py`.

## Ngrok (tùy chọn)
- Dùng `ngrok` để mở public URL: `ngrok http <port>` hoặc bật `ENABLE_NGROK=true` khi chạy backend (cần `ngrok authtoken`).

## Tài liệu chi tiết
- `docs/DATABASE_GUIDE.md`: hướng dẫn database, migration và admin endpoints.  
- `docs/RUN_GUIDE.md`, `docs/FULL_DOCUMENTATION.md`: tài liệu tham khảo thêm.

Nếu cần mình có thể mở rộng hướng dẫn deploy hoặc script `setup_all.sh` để tự động hóa cài đặt.
