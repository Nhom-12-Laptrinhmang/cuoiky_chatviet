Dọn dẹp dự án — 2025-12-01
Tóm tắt thay đổi

- Đã di chuyển các file workspace trùng và bản sao script vào `archive/removed-2025-12-01/`.
- Đã chuyển `run_backend.sh` và `run_frontend.sh` vào `scripts/` (bản gốc đã được lưu trong `archive/`).
- Đã xóa các file runtime `*.pid` khỏi root và thêm `*.pid` vào `.gitignore`.

Danh sách hành động (ví dụ)

- `archive/removed-2025-12-01/code-workspaces/` — các file `.code-workspace` trùng
- `archive/removed-2025-12-01/scripts/` — bản sao của script và batch files

Lưu ý

- Các file gốc đã bị xóa khỏi tree chính nhưng vẫn có thể khôi phục từ `archive/removed-2025-12-01/`.
- Nếu muốn xóa hoàn toàn `archive/`, báo mình để mình xóa vĩnh viễn.

Commit messages liên quan

- `chore: tidy project structure — archive duplicates and relocate scripts`
- `chore: permanently remove duplicate workspace and root scripts (archived)`

Tiếp theo

1. Mình có thể gộp các commit này nếu bạn muốn lịch sử sạch hơn.
2. Mình có thể đẩy (`git push`) lên remote khi bạn cho phép.

1) Di chuyển (archive) các file VS Code workspace trùng:
   - client/Vietnam Chat.code-workspace -> archive/removed-2025-12-01/code-workspaces/client__Vietnam Chat.code-workspace
   - client/src/components/Chat/Vietnam Chat.code-workspace -> archive/removed-2025-12-01/code-workspaces/client_src_components_Chat__Vietnam Chat.code-workspace
   - logs/Vietnam Chat.code-workspace -> archive/removed-2025-12-01/code-workspaces/logs__Vietnam Chat.code-workspace

2) Di chuyển (archive) các script sang `scripts/` và tạo bản lưu trong archive (sử dụng nội dung gốc):
   - run_backend.sh -> scripts/run_backend.sh (and archived copy)
   - run_frontend.sh -> scripts/run_frontend.sh (and archived copy)
   - start_backend.bat -> archive/removed-2025-12-01/scripts/start_backend.bat
   - start_frontend.bat -> archive/removed-2025-12-01/scripts/start_frontend.bat

3) Xoá các file runtime PID từ repo root:
   - backend.pid (deleted)
   - frontend.pid (deleted)

4) Thêm/ cập nhật `/.gitignore` để loại trừ: `*.pid`, `.venv/`, `archive/`, `node_modules/`, `*.log`.

Ghi chú:
- Tất cả các file bị xoá tại vị trí gốc đã được sao lưu trong `archive/removed-2025-12-01/` để bạn có thể khôi phục nếu cần.
- Tiếp theo mình có thể commit những thay đổi này nếu bạn cho phép.  
