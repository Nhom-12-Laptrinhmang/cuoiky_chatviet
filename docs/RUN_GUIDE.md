# RUN GUIDE — Chạy project (ngắn gọn)

Ngắn gọn: có 2 phần chính — **backend** (Flask) và **frontend** (React). Chạy theo thứ tự: chuẩn bị môi trường → cài dependencies → chạy backend → chạy frontend.

## 1) Yêu cầu
- Python 3.8+, Node.js 14+, Git
- (Tùy chọn) ngrok để expose public URL

### System / native prerequisites (ngắn)
Một số package trong `pip` hoặc `npm` cần công cụ build native (compiler, header files). Nếu gặp lỗi khi cài dependencies, cài các công cụ bên dưới trước:

- macOS:
	```bash
	xcode-select --install
	```

- Ubuntu/Debian:
	```bash
	sudo apt update
	sudo apt install -y build-essential python3-dev libssl-dev libffi-dev libjpeg-dev zlib1g-dev
	```

- Windows:
	- Cài "Build Tools for Visual Studio" (chứa C++ build toolchain) nếu `pip install` hoặc `npm install` báo lỗi biên dịch.
	- Nếu dùng PowerShell và bị chặn script, chạy `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (với quyền admin) hoặc dùng `activate.bat` trong CMD.

Lưu ý: các script trong repo (`run_backend.sh`, `start_backend.bat`, `run_frontend.sh`, `run_frontend.bat`) cố gắng cài dependencies tự động, nhưng nếu hệ thiếu tool native thì vẫn cần cài thủ công theo trên.

## 2) Quick start (recommended)

1) Clone
```bash
git clone <repo-url> vietnam-chat
cd vietnam-chat
```

2) Start with one command (no `cd` required)

- macOS / Linux:
	- Backend: `bash run_backend.sh`
	- Frontend: `bash run_frontend.sh`

- Windows (CMD / PowerShell):
	- Backend: `.\start_backend.bat`
	- Frontend: `.\start_frontend.bat` (or `.\run_frontend.bat`)

These scripts perform the usual steps (create/activate venv, install `requirements.txt`, initialize DB via `init_db.py`, then start the server or start the React dev server). Use the single command matching your OS.

If you prefer manual steps (detailed): create/activate virtualenv, run `pip install -r requirements.txt`, run `python init_db.py`, then `python app.py` for the backend; for frontend run `npm install` then `npm start` in `client/`.

## 3) Một lệnh (tùy repo) — Unix
```bash
bash start_all.sh   # nếu repo có script này: start backend + frontend (+ ngrok nếu cấu hình)
```

## 4) Ngrok (tùy chọn)
- Nếu muốn public URL cho backend: `ngrok http 5000`
- Hoặc bật `ENABLE_NGROK=true` khi chạy backend (nếu script hỗ trợ pyngrok)

## 5) Dừng tiến trình (ngắn)
- Unix: `lsof -ti:3000 | xargs kill -9` / `lsof -ti:5000 | xargs kill -9`
- Windows: `stop_all.bat` (hoặc kill theo PID bằng `Get-NetTCPConnection` + `Stop-Process`)

## 6) Troubleshooting nhanh
- `run_backend.sh: $'\r': command not found` → convert CRLF → LF hoặc chạy `.bat` trên Windows
- `port 5000/3000 already in use` → kill process theo port/PID
- `npm start` lỗi → chạy `npm install` trong `client` và kiểm tra Node version

---

Nếu muốn, mình sẽ nhận commit các thay đổi này (add/update `docs/RUN_GUIDE.md` và xóa `run.md`).
- Vào ngrok URL từ logs backend
