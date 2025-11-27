# HƯỚNG DẪN CHẠY (Windows)

Tài liệu này hướng dẫn từng bước để chạy project `cuoiky_chatviet` trên máy Windows (CMD / PowerShell). Bao gồm: clone, cài dependencies, chạy backend + frontend, mở tunnel với ngrok (tùy chọn) và các lỗi cơ bản thường gặp.

---

## 1. Yêu cầu (Prerequisites)
- Git for Windows (Git Bash hữu ích)
- Node.js 14+ và npm
- Python 3.8+ và pip
- (Tùy chọn) ngrok nếu muốn mở public URL

Kiểm tra phiên bản:

```powershell
node -v
npm -v
python --version
git --version
```

---

## 2. Clone repository

Mở CMD hoặc PowerShell, chạy:

```powershell
cd C:\Users\pc\Documents
git clone <repo-url> cuoiky_chatviet
cd cuoiky_chatviet
```

---

## 3. Chạy backend (Windows - recommended: dùng .bat)

Có hai cách: (A) dùng script `.bat` (dễ nhất) hoặc (B) chạy thủ công bằng Python.

A) Dùng script (recommended)

```powershell
# Từ thư mục repo root
start_backend.bat
```

B) Thủ công (PowerShell)

```powershell
cd .\server
python -m venv ..\.venv
..\.venv\Scripts\Activate.ps1    # PowerShell
# Nếu PowerShell chặn script: run as Administrator and: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
pip install -r requirements.txt
python app.py
```

Ghi chú:
- `start_backend.bat` (nếu có) gọi script tương tự và dễ dùng cho Windows.
- Nếu bạn dùng Git Bash hoặc WSL, bạn có thể chạy `./run_backend.sh` sau khi chuyển dòng xuống LF.

---

## 4. Chạy frontend (Windows)

A) Dùng script `run_frontend.bat` (đã có trong repo):

```powershell
cd C:\Users\pc\Documents\cuoiky_chatviet
run_frontend.bat
```

B) Thủ công (PowerShell):

```powershell
cd .\client
npm install    # lần đầu
$env:REACT_APP_API_URL = 'http://localhost:5000'
$env:REACT_APP_SOCKET_URL = 'http://localhost:5000'
npm start
```

C) CMD (Command Prompt):

```cmd
cd client
npm install
set REACT_APP_API_URL=http://localhost:5000 && set REACT_APP_SOCKET_URL=http://localhost:5000 && npm start
```

Ghi chú: Dev server mặc định chạy `http://localhost:3000` và proxy API tới `http://localhost:5000`.

---

## 5. Dùng ngrok (tùy chọn)

Nếu muốn public URL, sau khi backend đang chạy (ví dụ port 5000), mở terminal mới và chạy:

```powershell
ngrok authtoken <YOUR_AUTHTOKEN>   # chỉ cần làm 1 lần
ngrok http 5000
```

Copy `https://...ngrok.io` từ output và dùng làm `REACT_APP_API_URL` / `REACT_APP_SOCKET_URL` khi chạy frontend hoặc khi build.

---

## 6. Dừng các service trên Windows

Bạn có thể dùng `stop_all.bat` (đã có trong repo) hoặc kill thủ công các tiến trình:

```powershell
# Dùng script
stop_all.bat

# Hoặc kill bằng taskkill
taskkill /F /IM node.exe
taskkill /F /IM python.exe
taskkill /F /IM ngrok.exe
```

---

## 7. Lỗi thường gặp và cách khắc phục

- `run_backend.sh: line 3: $'\r': command not found` — Nguyên nhân: file `.sh` có CRLF (Windows) và bạn đang chạy bằng bash. Giải pháp: dùng `start_backend.bat` trên Windows, hoặc convert file sang LF và chạy trong Git Bash/WSL:

```bash
# Git Bash / WSL
sed -i 's/\r$//' run_backend.sh
chmod +x run_backend.sh
./run_backend.sh
```

- `set: invalid option name 'pipefail'` — Do shell không hỗ trợ `set -o pipefail` (ví dụ dùng sh thay vì bash). Chạy script bằng bash (Git Bash/WSL) hoặc dùng `.bat` trên Windows.

- `port 5000/3000 already in use` — Kiểm tra tiến trình và kill:

```powershell
# PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
taskkill /PID <pid> /F

# Hoặc kill node/ python
taskkill /F /IM node.exe
taskkill /F /IM python.exe
```

- `npm start` lỗi (missing dependencies) — Chạy `npm install` trong `client/` trước.

- `ModuleNotFoundError` khi chạy backend — Kiểm tra venv đã active và chạy `pip install -r requirements.txt`.

- `ngrok` không tìm thấy `authtoken` hoặc không khởi được tunnel — đảm bảo đã `ngrok authtoken <token>` và binary có trong PATH.

- `Permission denied` khi chạy `Activate.ps1` — mở PowerShell với quyền Administrator và chạy `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` hoặc dùng `Activate.bat` từ CMD.

- Lỗi upload S3 / presigned URL — kiểm tra biến môi trường AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `AWS_S3_REGION`) và policy/CORS của bucket.

---

## 8. Mẹo & Best practices

- Nếu team có nhiều người Windows, dùng các file `.bat` (`run_frontend.bat`, `start_backend.bat`) để giảm lỗi line-ending.
- Thêm `.gitattributes` để chuẩn hoá line endings cho file scripts:

```
*.sh text eol=lf
*.bat text eol=crlf
```

- Nếu bạn dùng Git Bash/WSL, cài `dos2unix` để convert nhanh CRLF → LF.

---

Nếu bạn muốn, tôi có thể:
- Tạo `run_backend.bat` tương tự cho Windows (tự động tạo venv và chạy backend).  
- Thêm phần ngắn vào `FULL_DOCUMENTATION.md` để chỉ rõ Windows vs macOS/Linux commands.  

Yêu cầu tiếp theo của bạn là gì? Tôi sẽ thực hiện ngay.
