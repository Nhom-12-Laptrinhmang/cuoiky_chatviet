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

3) Start the frontend (in a separate terminal):

```bash
cd client
npm install   # first-time only
npm start
```

The frontend is configured to proxy API requests to `http://localhost:5000` (see `client/package.json`).

```markdown
# Vietnam Chat — Hướng dẫn cài đặt & chạy (macOS / Linux / Windows)

Repository này gồm:
- Frontend: React app ở `client/` (dev server chạy trên port 3000)
- Backend: Flask + Socket.IO ở `server/` (mặc định port 5000)

Mục tiêu tài liệu này: hướng dẫn chi tiết cách cài đặt, chạy local và cách mở public tunnel bằng ngrok để gửi link cho bạn bè khảo thử.

## Yêu cầu
- Python 3.8+ (hoặc Python 3.x hiện đại)
- Node.js (14+) và npm (hoặc yarn)
- Git (để clone)
- (Tùy chọn) ngrok — dùng để mở public URL cho backend

## Tóm tắt nhanh
1. Cài backend (tạo virtualenv, cài requirements) — script `./run_backend.sh` hỗ trợ tự động.
2. Cài frontend: `cd client && npm install && npm start`.
3. (Tùy chọn) Mở tunnel bằng ngrok: `ngrok http 5000` hoặc bật `ENABLE_NGROK=true` khi chạy backend.

---

## 1) Clone repository

```bash
git clone <repo-url> vietnam-chat
cd vietnam-chat
```

## 2) Backend — cài và chạy

Lưu ý: project đã kèm script `run_backend.sh` tại root để tạo virtualenv (tại `./.venv`), cài dependencies và khởi động server. Đây là cách đơn giản nhất.

### Cách nhanh (macOS / Linux)

Từ thư mục gốc của project:

```bash
# chỉ chạy một lệnh để chuẩn bị và start
./run_backend.sh
```

Script sẽ:
- tạo virtualenv ở `./.venv` nếu chưa có
- cài packages từ `server/requirements.txt`
- chọn port mặc định 5000 (nếu port bận sẽ thử tăng dần)
- chạy `server/app.py` (Flask + Socket.IO)

Bạn có thể kiểm soát port bằng biến môi trường `BACKEND_PORT`:

```bash
export BACKEND_PORT=6000
./run_backend.sh
```

Nếu muốn bật tunneling tự động (app sẽ gọi pyngrok), set `ENABLE_NGROK=true` (vẫn cần ngrok đã được authenticate trên máy):

```bash
export ENABLE_NGROK=true
./run_backend.sh
```

### Cách thủ công (nếu không dùng script)

```bash
cd server
# tạo virtualenv tại thư mục gốc (theo convention script)
python3 -m venv ../.venv
source ../.venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Windows (PowerShell)

```powershell
cd server
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1   # hoặc Activate.bat cho cmd
pip install -r requirements.txt
python app.py
```

## 3) Frontend — cài và chạy

```bash
cd client
npm install    # lần đầu
npm start
```

Front-end dev server mặc định chạy trên http://localhost:3000 và proxy API tới `http://localhost:5000` (xem `client/package.json`). Nếu backend chạy ở port khác, chỉnh các biến môi trường trong `run_frontend.sh` hoặc set `REACT_APP_API_URL` và `REACT_APP_SOCKET_URL` trước khi khởi chạy.

Ví dụ (mac/linux):

```bash
REACT_APP_API_URL=http://localhost:5000 REACT_APP_SOCKET_URL=http://localhost:5000 npm start
```

## 4) Ngrok — mở public URL để gửi cho bạn bè test

Bạn có 2 cách:
- Chạy ngrok thủ công từ terminal
- Hoặc bật `ENABLE_NGROK=true` và chạy `./run_backend.sh` (app sẽ cố gắng tạo tunnel bằng pyngrok). Tuy nhiên pyngrok vẫn cần `ngrok authtoken`/binary hợp lệ trên máy.

### Cài ngrok

- macOS (Homebrew):
  ```bash
  brew install --cask ngrok
  # hoặc từ website: download unzip
  ```
- Linux: tải từ https://ngrok.com/download, giải nén và đặt binary vào `~/bin` hoặc `/usr/local/bin`.
- Windows: tải ZIP từ ngrok.com, giải nén và đặt `ngrok.exe` vào PATH.

Sau khi đăng ký tài khoản ngrok, chạy:

```bash
ngrok authtoken <YOUR_AUTHTOKEN>
```

### Mở tunnel (thủ công)

Khi backend đang chạy (ví dụ trên port 5000), mở 1 terminal mới và chạy:

```bash
ngrok http 5000
```

Ngrok sẽ in ra các `Forwarding` URLs, ví dụ `https://abcd-1234.ngrok.io`. Copy URL đó (https) — đó là link public để bạn bè truy cập API/Socket.

Nếu bạn muốn frontend truy cập API public này, set `REACT_APP_API_URL` thành URL ngrok khi chạy frontend hoặc build frontend với biến này.

### Mở tunnel tự động từ script

1) Xác thực ngrok (`ngrok authtoken ...`).
2) Bật biến môi trường rồi chạy script:

```bash
export ENABLE_NGROK=true
./run_backend.sh
```

Khi backend khởi động, nếu cấu hình đúng, app sẽ in ra `NGROK PUBLIC URL` lên console (app.py đã hiển thị public_url khi start_ngrok thành công).

## 5) Lấy link và chia sẻ

- Nếu dùng `ngrok http 5000`: copy `https://...ngrok.io` từ output của ngrok.
- Nếu bật `ENABLE_NGROK=true` và chạy `./run_backend.sh`, xem console output của backend — app sẽ in một khối giống:

```
========================================
🌐 [NGROK] PUBLIC URL - SHARE THIS WITH FRIENDS:
   https://abcd-1234.ngrok.io
   API Base:     https://abcd-1234.ngrok.io
   Socket URL:   https://abcd-1234.ngrok.io
========================================
```

Copy `https://...` và gửi cho bạn bè.

## 6) Lưu ý & xử lý sự cố thường gặp
- Nếu script báo thiếu `python3` hoặc `pip`, đảm bảo đã cài Python và dùng đúng alias (`python3` trên mac/linux).
- Nếu `./run_backend.sh` không chạy vì quyền, cấp quyền: `chmod +x run_backend.sh`.
- Nếu port 5000 đã bận, script sẽ tự thử port tiếp theo (5001, 5002...). Khi dùng ngrok, chỉ cần chạy `ngrok http <actual_port>`.
- Nếu pyngrok/ENABLE_NGROK không hoạt động, chạy ngrok thủ công (cách đơn giản nhất).

## 7) Muốn mình chạy giúp và gửi link ngrok?
- Nếu bạn muốn, mình có thể thử khởi động backend và ngrok trên máy của bạn (yêu cầu: bạn đang cho phép mình chạy lệnh trong thư mục repo). Mình sẽ:
  1. Chạy `./run_backend.sh` (tạo venv + cài packages nếu cần).
  2. Mở `ngrok http <port>` (hoặc bật `ENABLE_NGROK=true` và để app in public url).
  3. Trả lại public URL để bạn chia sẻ.

---

Nếu cần, mình có thể thêm một script `setup_all.sh` (tạo venv, cài pip, cài npm packages) để tiện cho người mới.

Chúc bạn test vui! :)
```