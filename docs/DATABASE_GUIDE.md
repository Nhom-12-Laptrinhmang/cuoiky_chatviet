# Database & Admin API Guide

Hướng dẫn sử dụng SQLite database, migrations, và admin endpoints để quản lý dữ liệu.

## Database Setup

### 1. Initial Migration
Migrations đã được khởi tạo sẵn. Để áp dụng migration mới sau khi chỉnh models:

```bash
export FLASK_APP=server.app
export FLASK_ENV=development

# Generate migration từ thay đổi models
flask db migrate -m "Your description here"

# Apply migration vào DB
flask db upgrade
```

### 2. Inspect Database
Xem dữ liệu trong SQLite một cách nhanh:

```bash
# Print sample rows từ các bảng chính
python3 server/scripts/inspect_db.py
```

### 3. View in DB Browser
Mở file `server/storage/chatapp.db` bằng **DB Browser for SQLite**:
- App location: `/Applications/DB Browser for SQLite.app`
- Hoặc từ Spotlight: tìm "DB Browser"

## Admin API Endpoints

Các endpoint admin để quản lý users, groups, và statistics. Yêu cầu auth đơn giản.

### Authentication

**Option 1: Localhost** (no header needed)
- Truy cập từ `127.0.0.1`, `::1`, hoặc `localhost` = tự động authorized.

**Option 2: Admin Secret Header**
- Đặt env var: `export ADMIN_SECRET="your-strong-secret"`
- Gửi request với header: `X-ADMIN-SECRET: your-strong-secret`

**Default (không an toàn)**
- Mặc định `ADMIN_SECRET=admin123` — chỉ allow localhost.
- Để sử dụng header, bạn phải set `ADMIN_SECRET` thành giá trị khác.

### Endpoints

#### List Users
```bash
curl -X GET http://localhost:5000/admin/users \
  -H "X-ADMIN-SECRET: your-secret"

# Với pagination & search
curl -X GET "http://localhost:5000/admin/users?page=1&per_page=10&search=alice" \
  -H "X-ADMIN-SECRET: your-secret"
```

**Response:**
```json
{
  "total": 38,
  "page": 1,
  "per_page": 50,
  "pages": 1,
  "users": [
    {
      "id": 1,
      "username": "alice",
      "display_name": "Alice Nguyễn",
      "avatar_url": "...",
      "status": "offline",
      "gender": null,
      "birthdate": null,
      "phone_number": null,
      "created_at": "2025-11-15T04:04:37.643027"
    }
  ]
}
```

#### Get User Detail
```bash
curl -X GET http://localhost:5000/admin/users/1 \
  -H "X-ADMIN-SECRET: your-secret"
```

**Response:**
```json
{
  "id": 1,
  "username": "alice",
  "display_name": "Alice Nguyễn",
  ...
  "friend_count": 2,
  "group_count": 1,
  "message_count": 15,
  "owned_groups": [...]
}
```

#### Create User
```bash
curl -X POST http://localhost:5000/admin/users \
  -H "Content-Type: application/json" \
  -H "X-ADMIN-SECRET: your-secret" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "display_name": "New User",
    "avatar_url": "https://...",
    "gender": "male",
    "phone_number": "0123456789"
  }'
```

#### Update User
```bash
curl -X PATCH http://localhost:5000/admin/users/1 \
  -H "Content-Type: application/json" \
  -H "X-ADMIN-SECRET: your-secret" \
  -d '{
    "display_name": "Updated Name",
    "status": "online",
    "avatar_url": "https://..."
  }'
```

#### Delete User
```bash
curl -X DELETE http://localhost:5000/admin/users/1 \
  -H "X-ADMIN-SECRET: your-secret"
```

#### Database Statistics
```bash
curl -X GET http://localhost:5000/admin/db/stats \
  -H "X-ADMIN-SECRET: your-secret"
```

**Response:**
```json
{
  "users": 38,
  "groups": 5,
  "messages": 127,
  "friends": 12,
  "message_reactions": 0,
  "blocks": 0,
  "stickers": 0,
  "group_members": 8,
  "timestamp": "2025-12-01T10:30:45.123456"
}
```

## Data Migration: JSON to SQL

Đã tạo script để migrate `contact_sync.contacts_json` → bảng `contact`:

```bash
python3 server/scripts/migrate_contacts_json_to_sql.py
```

Kết quả:
- Bảng `contact` được tạo (nếu chưa có)
- Mỗi phone number từ JSON được tạo thành một row trong `contact`
- Original `contacts_json` vẫn giữ nguyên (để backup)

## Tables & Relationships

### Bảng chính:
- **user**: Users (username, password_hash, profile info)
- **friend**: Friend relationships (user_id, friend_id, status)
- **group**: Groups (name, owner_id, avatar)
- **group_member**: Group memberships (group_id, user_id, role, joined_at)
- **message**: Messages (sender_id, receiver_id, group_id, content, file_url)
- **message_reaction**: Reactions on messages (message_id, user_id, reaction_type)
- **sticker**: Stickers (name, file_url, created_by)
- **contact**: Phone contacts (user_id, phone_number) — migrated from JSON
- **block**: Blocked users (user_id, target_id)
- **contact_sync**: Legacy — contains original `contacts_json` (backup)

### Key Relationships:
```
user (id) → friend (user_id, friend_id) ← user
user (id) → group (owner_id) ← group
user (id) → group_member (user_id) ← group_member → group (id)
user (id) → message (sender_id/receiver_id) ← message
message (id) → message_reaction (message_id) ← message_reaction
user (id) → contact (user_id) ← contact
user (id) → block (user_id/target_id) ← block
```

## Useful SQL Queries

Một vài query mẫu cho SQLite (có thể chạy trong DB Browser hoặc CLI):

### Get user with friends
```sql
SELECT u.id, u.username, u.display_name, COUNT(f.id) as friend_count
FROM "user" u
LEFT JOIN friend f ON u.id = f.user_id AND f.status = 'accepted'
GROUP BY u.id
LIMIT 10;
```

### Get messages in a group
```sql
SELECT m.id, u.display_name, m.content, m.timestamp
FROM message m
JOIN "user" u ON m.sender_id = u.id
WHERE m.group_id = 1
ORDER BY m.timestamp DESC
LIMIT 20;
```

### Get user's contacts
```sql
SELECT phone_number FROM contact WHERE user_id = 13;
```

### Get user's groups
```sql
SELECT g.name, gm.role, gm.joined_at
FROM group_member gm
JOIN "group" g ON gm.group_id = g.id
WHERE gm.user_id = 5
ORDER BY gm.joined_at DESC;
```

## Backup & Restore

### Backup DB
```bash
cp server/storage/chatapp.db server/storage/chatapp.db.bak.$(date +%s)
```

### List backups
```bash
ls -lh server/storage/chatapp.db.*
```

### Restore từ backup
```bash
# Kiểm tra backup files
ls server/storage/chatapp.db.bak*

# Restore (example)
cp server/storage/chatapp.db.bak.1234567890 server/storage/chatapp.db
```

## Troubleshooting

### Migration conflicts
Nếu migration gặp lỗi, kiểm tra:
1. `migrations/versions/` — xem migration file mới được tạo
2. `flask db current` — kiểm tra revision hiện tại
3. `flask db history` — xem toàn bộ migration history

### Relationship warnings
SQLAlchemy có thể warning về overlapping relationships (normal):
```
SAWarning: relationship 'Message.group_chat' will copy column group.id...
```
Cảnh báo này an toàn và có thể ignore. Nó xảy ra vì cả `Message.group` và `Group.group_messages` đều tham chiếu cùng FK.

### Reset DB (dangerous!)
```bash
# Delete all data and recreate tables (chỉ dev)
curl -X POST http://localhost:5000/admin/db/clear-all \
  -H "X-ADMIN-SECRET: your-secret"
```

**Yêu cầu:** `ADMIN_SECRET` env var phải được set (không được default `admin123`).

## Next Steps

- **Routes/Services**: Cập nhật `server/routes/*.py` và `server/services/*.py` để sử dụng ORM queries thay vì file I/O.
- **Tests**: Chạy `python3 server/test_api.py` hoặc `pytest` để kiểm tra DB integration.
- **Frontend**: Update client-side code để gửi requests tới các endpoint mới nếu cần.
