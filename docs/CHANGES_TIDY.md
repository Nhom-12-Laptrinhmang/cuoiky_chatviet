Dọn dẹp dự án — 2025-12-01

Các thay đổi thực hiện:

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
