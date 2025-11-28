# 📊 Xem Dữ Liệu Database

Database: `server/storage/chatapp.db`

## Lệnh Xem Dữ Liệu

```bash
cd server

# Xem tất cả bảng
python3 view_db.py

# Xem bảng cụ thể
python3 view_db.py user          # Bảng user
python3 view_db.py message 10    # Bảng message (10 dòng)

# Thống kê nhanh
python3 view_db.py --stats
```

## Hoặc Dùng SQLite

```bash
cd server

# Xem danh sách bảng
sqlite3 storage/chatapp.db ".tables"

# Xem dữ liệu
sqlite3 storage/chatapp.db "SELECT * FROM [user] LIMIT 5;"
sqlite3 storage/chatapp.db "SELECT COUNT(*) FROM [message];"
```

## Các Bảng

| Bảng | Dòng |
|------|------|
| user | 38 |
| message | 818 |
| group | 28 |
| friend | 129 |
| group_member | 166 |
| block | 1 |
