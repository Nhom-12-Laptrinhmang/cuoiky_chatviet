# 📎 File Upload Implementation Guide

## Luồng Upload File với S3 Presigned URL

### 📋 Tổng quan
Hệ thống upload file sử dụng AWS S3 với presigned URL để:
- Upload trực tiếp từ client lên S3 (không qua server)
- Giảm tải cho server backend
- Tăng tốc độ upload
- Hiển thị preview file ngay lập tức

### 🔄 Luồng hoạt động

```
1. User chọn file 📂
   ↓
2. Client request presigned URL từ server 🔑
   ↓
3. Server tạo presigned URL từ AWS S3 ☁️
   ↓
4. Client upload file trực tiếp lên S3 📤
   ↓
5. Tạo message local (optimistic UI) 💬
   ↓
6. Emit socket event tới server 🔌
   ↓
7. Server lưu message vào DB 💾
   ↓
8. Broadcast message tới receiver 📡
   ↓
9. Hiển thị preview file 🖼️
```

## 🛠️ Cài đặt

### 1. Backend Setup

#### a) Cài đặt boto3
```bash
pip install boto3>=1.28.0
```

Hoặc thêm vào `server/requirements.txt`:
```
boto3>=1.28.0
```

#### b) Cấu hình AWS S3 (`server/config/settings.py`)
```python
# AWS S3 Configuration for file uploads
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '')
AWS_S3_BUCKET = os.environ.get('AWS_S3_BUCKET', 'vietnam-chat-files')
AWS_S3_REGION = os.environ.get('AWS_S3_REGION', 'ap-southeast-1')
S3_PRESIGNED_URL_EXPIRATION = 3600  # 1 hour
```

#### c) Biến môi trường
Tạo file `.env` trong thư mục `server/`:
```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET=vietnam-chat-files
AWS_S3_REGION=ap-southeast-1
```

### 2. API Endpoint

#### `/uploads/presigned-url` (POST)
Tạo presigned URL cho upload file.

**Request:**
```json
{
  "filename": "image.png",
  "content_type": "image/png",
  "file_size": 1024000
}
```

**Response:**
```json
{
  "upload_url": "https://s3.amazonaws.com/...",
  "fields": {
    "key": "uploads/user1/1234567890_abc123_image.png",
    "Content-Type": "image/png",
    "policy": "...",
    "x-amz-signature": "..."
  },
  "file_url": "https://vietnam-chat-files.s3.ap-southeast-1.amazonaws.com/...",
  "key": "uploads/user1/1234567890_abc123_image.png"
}
```

### 3. Socket Event

#### `send_file_message`
Gửi message chứa file đã upload.

**Payload:**
```javascript
{
  sender_id: 1,
  receiver_id: 2,
  file_url: "https://...",
  file_name: "image.png",
  file_size: 1024000,
  file_type: "image/png",
  client_message_id: "client_1234567890_abc123"
}
```

**Response:** `message_sent_ack`
```javascript
{
  client_message_id: "client_1234567890_abc123",
  message_id: 42,
  status: "sent"
}
```

### 4. Client Implementation

#### Component Usage
```javascript
// ChatBox.js
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  
  // Step 1: Get presigned URL
  const presignedResponse = await fetch('/uploads/presigned-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type,
      file_size: file.size,
    }),
  });
  
  const { upload_url, fields, file_url } = await presignedResponse.json();
  
  // Step 2: Upload to S3
  const formData = new FormData();
  Object.keys(fields).forEach(key => {
    formData.append(key, fields[key]);
  });
  formData.append('file', file);
  
  await fetch(upload_url, {
    method: 'POST',
    body: formData,
  });
  
  // Step 3: Create optimistic message
  const clientMessageId = `client_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
  const fileMessage = {
    id: clientMessageId,
    content: file.name,
    message_type: 'file',
    file_url: file_url,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    timestamp: new Date().toISOString(),
    isSent: true,
    sender_id: currentUserId,
    receiver_id: selectedUser.id,
    status: 'sending',
  };
  
  setMessages(prev => [...prev, fileMessage]);
  
  // Step 4: Emit socket event
  socket.emit('send_file_message', {
    sender_id: currentUserId,
    receiver_id: selectedUser.id,
    file_url: file_url,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    client_message_id: clientMessageId,
  });
};
```

## 🎨 UI Components

### File Preview in MessageBubble

Hỗ trợ các loại file:
- **🖼️ Images**: Hiển thị preview thumbnail
- **🎥 Video**: Icon video
- **🎵 Audio**: Icon audio  
- **📄 PDF**: Icon PDF
- **📎 Other**: Icon file chung

### Features:
- Preview hình ảnh tự động
- Hiển thị tên file + kích thước
- Nút download
- Mở file trong tab mới
- Responsive layout

## 🔒 Security

### Validation
- Max file size: **50MB**
- Content type validation
- Authenticated requests only
- Presigned URL expiration: **1 hour**

### S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vietnam-chat-files/uploads/*"
    }
  ]
}
```

### CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST", "PUT"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## 📊 Database Schema

### Message Model
```python
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, nullable=False)
    receiver_id = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)  # File name
    message_type = db.Column(db.String(50), default='text')  # 'file'
    file_url = db.Column(db.String(500), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
```

## 🐛 Troubleshooting

### Lỗi thường gặp

#### 1. "S3 not configured"
**Nguyên nhân:** Thiếu AWS credentials  
**Giải pháp:** Kiểm tra file `.env` và biến môi trường

#### 2. "Failed to upload to S3"
**Nguyên nhân:** CORS hoặc bucket policy chưa đúng  
**Giải pháp:** Kiểm tra CORS config và bucket policy

#### 3. "File size exceeds 50MB limit"
**Nguyên nhân:** File quá lớn  
**Giải pháp:** Nén file hoặc tăng giới hạn trong code

#### 4. Message không hiển thị
**Nguyên nhân:** Socket event không được broadcast  
**Giải pháp:** Kiểm tra socket connection và room

## 🚀 Testing

### Test Upload Flow
```bash
# 1. Start backend
cd server
python app.py

# 2. Start frontend
cd client
npm start

# 3. Test steps:
# - Đăng nhập
# - Chọn user để chat
# - Click nút 📎
# - Chọn file
# - Kiểm tra preview
# - Verify file trong S3
# - Verify message trong DB
```

## 📝 Notes

- File được lưu trữ vĩnh viễn trên S3
- URL có định dạng: `https://{bucket}.s3.{region}.amazonaws.com/{key}`
- Key format: `uploads/user{user_id}/{timestamp}_{uuid}_{filename}`
- Optimistic UI giúp trải nghiệm mượt mà
- Socket ACK xác nhận message đã lưu DB

## 🔮 Future Enhancements

- [ ] File compression trước khi upload
- [ ] Progress bar chi tiết
- [ ] Multiple file upload cùng lúc
- [ ] File preview trước khi gửi
- [ ] Thumbnail generation cho video
- [ ] File expiration/cleanup policy
- [ ] End-to-end encryption cho file nhạy cảm
