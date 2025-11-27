# Vietnam Chat — Tài liệu tổng hợp

Toàn bộ hướng dẫn này gom từ các file trong `docs/` và script trong repository. Bao gồm: giới thiệu, các chức năng hiện có, yêu cầu, cách cài đặt và chạy trên macOS / Linux / Windows, mở tunnel với ngrok, và các lệnh hữu dụng.

---

## Mục lục
- **Giới thiệu**
- **Tính năng chính**
- **Yêu cầu**
- **Cài đặt nhanh**
- **Chạy (macOS / Linux)**
- **Chạy (Windows)**
- **Cách chạy toàn bộ (recommended)**
- **Ngrok - mở public URL**
- **Triển khai & Biến môi trường**
- **Debug / Troubleshooting**
- **Các scripts hữu dụng**
- **Tài khoản test & kiểm tra nhanh**

---

**Giới thiệu**

Project `Vietnam Chat` là ứng dụng chat full-stack gồm React frontend (`/client`) và Flask backend (`/server`) (kèm Socket.IO cho realtime). Repository gồm nhiều tài liệu chi tiết trong `docs/` và nhiều scripts tiện ích ở root.

**Tính năng chính (hiện có)**
- Chat realtime giữa hai client (Socket.IO).
- Lưu tin nhắn vào database (model `message`).
- Trả lời (reply), chuyển tiếp (forward) tin nhắn.
- Reaction / Emoji cho từng tin nhắn.
- Gửi file (upload bằng S3 presigned URL) với preview/thumbnail.
- Thư viện Sticker & Emoji: gửi sticker trực tiếp, thêm emoji vào input.
- Settings module: nhiều lựa chọn (language, privacy, notifications, appearance, mock server hỗ trợ phát triển).
- Hỗ trợ đa ngôn ngữ (multilanguage).
- Hỗ trợ push notification (tài liệu hướng dẫn và tóm tắt trong `docs/`).

---

## Yêu cầu
- Python 3.8+ (hoặc Python 3.x hiện đại)
- Node.js 14+ và `npm` (hoặc `yarn`)
- Git
- (Tùy chọn) ngrok nếu muốn mở public URL

**Chú ý:** script `./run_backend.sh` tạo virtualenv tại `./.venv` và cài `server/requirements.txt` tự động.

### Yêu cầu hệ thống / thư viện native

Một số package Python hoặc Node có thể yêu cầu thành phần native (build tools, header files, thư viện C) để biên dịch. Dưới đây là hướng dẫn cài trên các nền tảng:

- Windows:
	- Cài "Build Tools for Visual Studio" (chứa C++ build toolchain) để biên dịch native Node/Python extensions.
	- Python dev headers thường có sẵn khi cài Python từ installer; nếu không, cài Python bằng installer chính thức.

- macOS:
	- Cài Xcode Command Line Tools:
		```bash
		xcode-select --install
		```
	- Với Homebrew, cài thêm các thư viện như `libjpeg`, `libpng`, `pkg-config` nếu cần.

- Ubuntu/Debian:
	- Cài các gói build and headers:
		```bash
		sudo apt update
		sudo apt install -y build-essential python3-dev libssl-dev libffi-dev libjpeg-dev zlib1g-dev
		```

Nếu khi chạy `npm install` hoặc `pip install` gặp lỗi kiểu thiếu header (.h) hoặc lỗi biên dịch, đọc log để biết gói nào cần library hệ thống và cài thêm như hướng dẫn ở trên.

---

## Cài đặt nhanh

1. Clone repo:

```bash
git clone <repo-url> vietnam-chat
cd vietnam-chat
```

2. Backend: script hỗ trợ tự động (tạo venv + cài dependencies)

```bash
./run_backend.sh
```

3. Frontend (terminal khác)

```bash
cd client
npm install   # lần đầu
npm start
```

Frontend dev server mặc định chạy trên `http://localhost:3000` và proxy API về `http://localhost:5000`.

---

## Chạy trên macOS / Linux

1) Chạy nhanh backend với script (recommended):

```bash
./run_backend.sh
```

Phụ thuộc vào biến môi trường:
- `BACKEND_PORT` - port backend (mặc định 5000)
- `ENABLE_NGROK=true` - bật ngrok (nếu đã auth)

2) Chạy frontend:

```bash
bash run_frontend.sh
# hoặc
cd client
REACT_APP_API_URL=http://localhost:5000 REACT_APP_SOCKET_URL=http://localhost:5000 npm start
```

3) Cách chạy tất cả (1 lệnh) - khuyến nghị:

```bash
bash start_all.sh
```

`start_all.sh` khởi động backend + frontend (và ngrok nếu cấu hình sẵn), đồng thời dọn các process cũ.

---

## Chạy trên Windows (PowerShell)

1) Backend (PowerShell):

```powershell
cd server
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1   # hoặc Activate.bat cho cmd
pip install -r requirements.txt
python app.py
```

2) Frontend (cmd / PowerShell):

```powershell
cd client
npm install
npm start
```

3) Có script cho Windows dev settings: `start_settings_dev.bat` (xem `docs/SETTINGS_COMPLETE_SUMMARY.md`).

---

## Tùy chọn chạy & mô tả các cách

3 cách chạy chính (từ `docs/RUN_GUIDE.md`):

- **Cách 1 (Easiest)**: `bash start_all.sh` — start backend + frontend + ngrok (nếu cấu hình). Khuyến nghị.
- **Cách 2**: Chạy backend với `export ENABLE_NGROK=true && bash run_backend.sh` và `bash run_frontend.sh` ở terminal khác.
- **Cách 3**: Chạy backend, frontend, và (tùy chọn) khởi ngrok thủ công `ngrok http 5000`.

---

## Ngrok — mở public URL

Hai cách:

- Chạy `ngrok` thủ công:

```bash
ngrok http 5000
```

- Hoặc bật trong script backend (pyngrok) bằng `ENABLE_NGROK=true` trước khi chạy `run_backend.sh`.

Lưu ý: cần `ngrok authtoken <TOKEN>` đã được cấu hình trên máy.

Sau khi ngrok mở, copy `https://...ngrok.io` và dùng làm `REACT_APP_API_URL`/`REACT_APP_SOCKET_URL` khi chạy frontend hoặc build.

---

## Sơ lược chức năng kỹ thuật và flow chính

1) Tin nhắn realtime
- Socket.IO để gửi/nhận, server emit tới room của người nhận.

2) File upload
- Sử dụng S3 presigned URL. Flow: client request presigned URL → upload trực tiếp lên S3 → emit event `send_file_message` → backend lưu DB và broadcast.

3) Sticker & Emoji
- Sticker có `message_type='sticker'` và `sticker_url`/`sticker_id` lưu trên message.
- Emoji có thể là một phần của text message.

4) Settings
- Module đầy đủ GUI, mock server để dev, offline queue, optimistic UI.

5) Multilanguage & Notifications
- Hỗ trợ đa ngôn ngữ (tài liệu trong `docs/MULTILANGUAGE_COMPLETE.md`).
- Push notification: xem `docs/PUSH_NOTIFICATION_GUIDE.md` & `docs/PUSH_NOTIFICATION_SUMMARY.md` cho chi tiết.

---

## Biến môi trường quan trọng

- `BACKEND_PORT` — port backend (default 5000)
- `ENABLE_NGROK` — `true` để bật ngrok tự động
- `REACT_APP_API_URL` — URL API (frontend)
- `REACT_APP_SOCKET_URL` — URL Socket.IO (frontend)
- AWS S3 cho file upload (đặt trong `server/.env` hoặc env): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_REGION`

---

## Debug / Troubleshooting nhanh

- Kiểm tra backend: `lsof -i :5000` hoặc xem logs terminal.
- Kiểm tra frontend: `lsof -i :3000` hoặc console của React dev server.
- Nếu socket không connect: kiểm tra `REACT_APP_SOCKET_URL`, CORS, và room join logs ở backend.
- Kill cổng bận:

```bash
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Về `stop_all` / dừng tiến trình trên Windows

Trong repository có `stop_all.bat` (Windows) và `stop_all.sh` (Unix). Ở phiên bản hiện tại `stop_all.bat` sử dụng `taskkill /F /IM node.exe` và `taskkill /F /IM python.exe` để ép dừng mọi tiến trình `node`/`python`/`ngrok` trên hệ thống. Điều này nhanh nhưng không phân biệt tiến trình của project khác.

An toàn hơn, bạn có thể dừng tiến trình theo `PID` hoặc theo `port`:

- Tìm PID theo port (PowerShell):
	```powershell
	Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess
	Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess
	```

- Dừng PID cụ thể:
	```powershell
	Stop-Process -Id <pid> -Force
	# hoặc
	taskkill /PID <pid> /F
	```

Trước khi chạy `stop_all.bat`, cân nhắc rằng nó sẽ dừng mọi tiến trình `node`/`python` đang chạy trên máy.

- Nếu pyngrok/ngrok không hoạt động: chạy `ngrok` thủ công từ terminal.

---

## Các scripts hữu dụng (root)

- `start_all.sh` — start backend + frontend (+ ngrok). Recommended.
- `run_backend.sh` — tạo venv, cài requirements và chạy backend.
- `run_frontend.sh` — chạy frontend (wrapper `npm start`).
- `start_backend_clean.sh` / `start_backend.bat` — các biến thể cho start backend.
- `stop_all.sh` — dừng các process.

Xem file script để biết flags và cách dùng cụ thể.

---

## Kiểm tra nhanh (smoke test)

1. Mở terminal A: `bash start_all.sh` (hoặc chạy backend và frontend riêng)
2. Mở terminal B: `cd client && npm start` (nếu chưa dùng `start_all`)
3. Mở 2 tab trình duyệt `http://localhost:3000`, đăng nhập 2 tài khoản khác nhau (xem danh sách test bên dưới) và thử gửi tin nhắn, file, sticker, reaction.

---

## Tài khoản test (ví dụ trong `docs/CHAT_FEATURES.md`)

- `alice / password`
- `bob / password`
- `carol / password`
- `admin@example.com / password`

---

## Tài liệu tham khảo chi tiết

- `docs/RUN_GUIDE.md` — các cách chạy, troubleshooting, recommended flow.
- `docs/CHAT_FEATURES.md` — mô tả chi tiết các tính năng chat.
- `docs/FILE_UPLOAD_GUIDE.md` — luồng upload file, presigned URL, security.
- `docs/STICKER_EMOJI_GUIDE.md`, `docs/IMPLEMENTATION_SUMMARY.md` — chi tiết Sticker & Emoji.
- `docs/SETTINGS_COMPLETE_SUMMARY.md` — module settings hoàn chỉnh.
- `docs/MULTILANGUAGE_COMPLETE.md` — hướng dẫn đa ngôn ngữ.

---

Nếu bạn muốn tôi: tạo một `README.md` ngắn hơn ở root, hoặc commit file này, hoặc thêm script `setup_all.sh`, nói mình biết bước tiếp theo bạn muốn làm.

*Tạo bởi công cụ tổng hợp từ `docs/` — nếu muốn sửa nội dung cụ thể (ví dụ bổ sung biến môi trường, hoặc thay đổi lệnh cho Windows), mình sẽ cập nhật theo yêu cầu.*
