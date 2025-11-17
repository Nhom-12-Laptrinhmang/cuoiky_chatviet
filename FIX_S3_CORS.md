# 🔧 Hướng dẫn cấu hình CORS cho AWS S3 Bucket

## ⚠️ Vấn đề
Khi upload file trực tiếp từ browser lên S3 bằng presigned URL, bạn gặp lỗi:
```
Access to fetch at 'https://vietnam-chat-files.s3.amazonaws.com/' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## ✅ Giải pháp 1: Cấu hình CORS trên S3 Bucket (Khuyến nghị cho production)

### Bước 1: Truy cập AWS S3 Console
1. Đăng nhập vào [AWS Console](https://console.aws.amazon.com/)
2. Vào **Services** → **S3**
3. Chọn bucket `vietnam-chat-files`

### Bước 2: Thêm CORS Configuration
1. Click tab **Permissions**
2. Scroll xuống phần **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste nội dung từ file `S3_CORS_CONFIG.json`:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:5000",
            "https://*.ngrok.io",
            "https://*.ngrok-free.app"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

5. Click **Save changes**

### Bước 3: Kiểm tra Bucket Policy (Optional)
Đảm bảo bucket có policy cho phép public read:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::vietnam-chat-files/*"
        }
    ]
}
```

## ✅ Giải pháp 2: Upload qua Backend (Đã implement - Dùng ngay được)

Thay vì client upload trực tiếp lên S3, file sẽ được upload qua backend:

**Flow mới:**
```
Client → Backend (/uploads/file) → S3 or Local Storage → Return file_url
```

**Ưu điểm:**
- ✅ Không cần config CORS
- ✅ Backend control hoàn toàn upload process
- ✅ Fallback về local storage nếu S3 không available
- ✅ Dễ implement virus scan, file validation

**Nhược điểm:**
- ❌ Tốn băng thông server
- ❌ Chậm hơn với file lớn

### Code đã được cập nhật:

**Backend:** `server/routes/uploads.py`
- Thêm endpoint `/uploads/file` (POST)
- Upload qua backend rồi lên S3 với ACL='public-read'
- Fallback về local storage nếu S3 fail

**Frontend:** `client/src/components/Chat/ChatBox.js`
- Đổi từ presigned URL flow → direct upload
- Gửi file qua FormData đến `/uploads/file`
- Nhận về file_url và metadata

## 🚀 Test ngay

1. **Khởi động lại backend:**
```bash
cd server
python app.py
```

2. **Khởi động frontend:**
```bash
cd client
npm start
```

3. **Test upload:**
- Chọn người nhận
- Click 📎 và chọn file
- File sẽ được upload qua backend

## 📊 So sánh 2 phương pháp

| Feature | Presigned URL | Backend Upload |
|---------|---------------|----------------|
| **Speed** | ⚡ Nhanh (direct to S3) | 🐢 Chậm hơn (qua server) |
| **CORS** | ❌ Cần config S3 | ✅ Không cần config |
| **Server Load** | ✅ Thấp | ❌ Cao hơn |
| **Security** | ✅ Tốt (presigned) | ✅ Tốt (backend control) |
| **Setup** | ❌ Phức tạp | ✅ Đơn giản |
| **Production** | ✅ Khuyến nghị | ⚠️ OK cho app nhỏ |

## 🔄 Chuyển đổi giữa 2 phương pháp

Hiện tại code đã được chuyển sang **Backend Upload** để fix lỗi CORS ngay.

Nếu muốn dùng lại **Presigned URL** (sau khi config CORS):
- Uncomment code cũ trong `ChatBox.js`
- Comment code upload qua backend

## 🎯 Khuyến nghị

**Cho Development (localhost):**
- ✅ Dùng **Backend Upload** (đơn giản, không cần config AWS)

**Cho Production:**
- ✅ Config CORS trên S3
- ✅ Dùng **Presigned URL** (nhanh hơn, scale tốt hơn)
- ✅ Thêm CloudFront CDN phía trước S3

## 🐛 Troubleshooting

### Vẫn gặp lỗi CORS sau khi config?
1. Xóa cache browser (Ctrl + Shift + Delete)
2. Kiểm tra CORS config đã save chưa
3. Đợi vài phút để AWS propagate changes

### File upload nhưng không thấy trong chat?
1. Check console log xem socket emit thành công không
2. Check backend log xem có lưu DB không
3. Check receiver có online không

### File quá lớn?
- Tăng giới hạn trong code (hiện tại: 50MB)
- Hoặc implement chunked upload cho file lớn
