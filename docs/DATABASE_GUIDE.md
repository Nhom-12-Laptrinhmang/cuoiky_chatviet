# Database & Admin API Guide
# Hướng dẫn Database & Admin API (tóm tắt)

Tập trung vào cách quản lý database SQLite, migration và các endpoint admin phục vụ công tác quản trị.

Vị trí chính
 - Database SQLite: `server/storage/chatapp.db`.
 - Migrations (Alembic / Flask-Migrate): `migrations/`.
 - Script tiện ích: `server/scripts/` (ví dụ `inspect_db.py`, `migrate_contacts_json_to_sql.py`).

---

## Thao tác cơ bản

1. Áp migration mới

```bash
cd server
export FLASK_APP=app
# Tạo migration từ thay đổi models
flask db migrate -m "mô tả thay đổi"
# Áp migration vào DB
flask db upgrade
```

2. Kiểm tra nhanh dữ liệu

```bash
python3 server/scripts/inspect_db.py
```

3. Mở DB bằng DB Browser for SQLite (tùy chọn)

 - File DB: `server/storage/chatapp.db`
 - Mở bằng `DB Browser for SQLite` trên macOS/Windows/Linux.

---

## Admin API (tóm tắt)

Admin blueprint cung cấp endpoint cơ bản để quản trị (users, stats...).

Xác thực admin:
 - Truy cập từ `localhost` thường được cho phép.
 - Hoặc set env `ADMIN_SECRET` và gửi header `X-ADMIN-SECRET: <secret>`.

Endpoint mẫu:
 - `GET /admin/users` — danh sách user (hỗ trợ pagination & search).
 - `GET /admin/users/<id>` — chi tiết user.
 - `POST /admin/users` — tạo user.
 - `PATCH /admin/users/<id>` — cập nhật.
 - `DELETE /admin/users/<id>` — xóa.
 - `GET /admin/db/stats` — thống kê tổng quan.

Ví dụ:

```bash
curl -H "X-ADMIN-SECRET: your-secret" http://localhost:5000/admin/users
```

---

## Migration dữ liệu JSON → SQL

Script hiện tại chuyển `contact_sync.contacts_json` sang bảng `contact`:

```bash
python3 server/scripts/migrate_contacts_json_to_sql.py
```

Hành vi:
 - Tạo bảng `contact` nếu chưa có.
 - Tách các số điện thoại trong JSON và chèn vào `contact` (mỗi số trên một hàng).
 - Giữ nguyên dữ liệu JSON gốc trong `contact_sync` làm bản sao lưu.

---

## Backup & Restore

 - Tạo backup nhanh:

```bash
cp server/storage/chatapp.db server/storage/chatapp.db.bak.$(date +%s)
```

 - Khôi phục:

```bash
cp server/storage/chatapp.db.bak.<timestamp> server/storage/chatapp.db
```

---

## Truy vấn hữu dụng (ví dụ)

 - Lấy contacts của user:

```sql
SELECT phone_number FROM contact WHERE user_id = ?;
```

 - Đếm users:

```sql
SELECT COUNT(*) FROM "user";
```

---

## Xử lý sự cố nhanh

 - Lỗi migration: kiểm tra `migrations/versions/`, dùng `flask db current` và `flask db history` để debug.
 - Cảnh báo SQLAlchemy về relationships overlapping thường là cảnh báo, không luôn là lỗi.

---

Nếu bạn muốn mình mở rộng phần này (diagram schema, ví dụ response API chi tiết, hoặc hướng dẫn restore theo quy trình), mình sẽ cập nhật thêm.
