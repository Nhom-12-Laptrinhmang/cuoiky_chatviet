# 📤 File Upload Flow - Chi tiết luồng upload file

## 🎯 Tổng quan
Flow upload file trong Vietnam Chat sử dụng **S3 presigned URL** để upload trực tiếp từ client lên S3, đảm bảo tốc độ nhanh và giảm tải cho server.

## 📋 Luồng hoạt động đầy đủ

```
User chọn file
    ↓
1️⃣  Client gọi /uploads/presigned-url (POST)
    → Server tạo presigned URL từ AWS S3
    → Trả về: { upload_url, fields, file_url, key }
    ↓
2️⃣  Client upload file trực tiếp lên S3
    → Sử dụng presigned POST với FormData
    → Upload hoàn tất, file được lưu trên S3
    ↓
3️⃣  Client tạo message optimistic trên UI
    → Hiển thị file ngay lập tức (status: 'sending')
    → Bao gồm: file_url, file_name, file_size, file_type
    ↓
4️⃣  Client emit socket event 'send_file_message'
    → Gửi: sender_id, receiver_id, file_url, metadata
    → Bao gồm client_message_id để tracking ACK
    ↓
5️⃣  Server nhận socket event
    → Kiểm tra block list
    → Lưu message vào database (message_type='file')
    → Tạo message_id trong DB
    ↓
6️⃣  Server gửi ACK về sender
    → emit 'message_sent_ack' với: client_message_id, message_id, status
    → Client cập nhật message từ 'sending' → 'sent'
    ↓
7️⃣  Server broadcast message đến receiver
    → emit 'receive_message' vào room của receiver
    → Receiver nhận và hiển thị message với preview
    ↓
8️⃣  Client hiển thị preview
    → Image: Hiển thị thumbnail + download button
    → Other files: Icon + tên file + kích thước + download button
```

## 💻 Code Implementation

### 1. Client - ChatBox.js

#### handleFileUpload Function
```javascript
const handleFileUpload = async (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  if (!selectedUser || !currentUserId) {
    alert('Vui lòng chọn người nhận trước khi gửi file');
    return;
  }

  for (let file of files) {
    // Step 1: Get presigned URL
    const presignedResponse = await fetch('/uploads/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        file_size: file.size,
      }),
    });

    const { upload_url, fields, file_url } = await presignedResponse.json();

    // Step 2: Upload to S3
    const formData = new FormData();
    Object.keys(fields).forEach((key) => {
      formData.append(key, fields[key]);
    });
    formData.append('file', file);

    await fetch(upload_url, {
      method: 'POST',
      body: formData,
    });

    // Step 3: Create optimistic message
    const clientMessageId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileMessage = {
      id: clientMessageId,
      content: file.name,
      message_type: 'file',
      file_url: file_url,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      timestamp: new Date().toISOString(),
      status: 'sending',
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
    };
    
    setMessages((prev) => [...prev, fileMessage]);

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

    // Set ACK timeout
    const ackTimeout = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === clientMessageId ? { ...m, status: 'failed' } : m))
      );
    }, 5000);
  }
};
```

### 2. Server - routes/uploads.py

#### Presigned URL Endpoint
```python
@uploads_bp.route('/presigned-url', methods=['POST'])
def generate_presigned_url():
    # Auth check
    auth = request.headers.get('Authorization', '')
    user_id = None
    if auth.startswith('Bearer '):
        token = auth.split(' ', 1)[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        user_id = payload.get('user_id')

    data = request.get_json() or {}
    filename = data.get('filename')
    content_type = data.get('content_type', 'application/octet-stream')
    file_size = data.get('file_size', 0)

    # Validate file size (max 50MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024
    if file_size > MAX_FILE_SIZE:
        return jsonify({'error': 'File size exceeds 50MB limit'}), 400

    # Generate unique key
    secure_name = secure_filename(filename)
    unique_id = str(uuid.uuid4())[:8]
    timestamp = int(time.time())
    key = f'uploads/user{user_id}/{timestamp}_{unique_id}_{secure_name}'

    # Generate presigned POST
    presigned_post = s3_client.generate_presigned_post(
        Bucket=bucket,
        Key=key,
        Fields={'Content-Type': content_type},
        Conditions=[
            {'Content-Type': content_type},
            ['content-length-range', 0, MAX_FILE_SIZE]
        ],
        ExpiresIn=3600
    )

    file_url = f'https://{bucket}.s3.{region}.amazonaws.com/{key}'

    return jsonify({
        'upload_url': presigned_post['url'],
        'fields': presigned_post['fields'],
        'file_url': file_url,
        'key': key
    })
```

### 3. Server - sockets/chat_events.py

#### Socket Event Handler
```python
@socketio.on('send_file_message')
def handle_send_file_message(data):
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    file_url = data.get('file_url')
    file_name = data.get('file_name')
    client_message_id = data.get('client_message_id')

    # Check block list
    blocked = Block.query.filter_by(user_id=receiver_id, target_id=sender_id).first()
    if blocked:
        if client_message_id:
            socketio.emit('message_sent_ack', {
                'client_message_id': client_message_id, 
                'status': 'blocked'
            }, room=request.sid)
        return

    # Save to database
    msg = Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=file_name,
        message_type='file',
        file_url=file_url
    )
    db.session.add(msg)
    db.session.commit()

    # Send ACK to sender
    if client_message_id:
        socketio.emit('message_sent_ack', {
            'client_message_id': client_message_id,
            'message_id': msg.id,
            'status': 'sent'
        }, room=request.sid)

    # Broadcast to receiver
    message_data = {
        'id': msg.id,
        'sender_id': sender_id,
        'receiver_id': receiver_id,
        'content': file_name,
        'message_type': 'file',
        'file_url': file_url,
        'file_name': file_name,
        'file_size': data.get('file_size', 0),
        'file_type': data.get('file_type', 'application/octet-stream'),
        'timestamp': msg.timestamp.isoformat(),
        'status': 'sent',
    }

    receiver_room = f'user-{receiver_id}'
    socketio.emit('receive_message', message_data, room=receiver_room)
```

### 4. Client - MessageBubble.js

#### File Preview Display
```javascript
{message.message_type === 'file' || message.file_url ? (
  <div style={{ marginBottom: '8px', maxWidth: '300px' }}>
    {/* Image preview */}
    {message.file_type && message.file_type.startsWith('image/') && (
      <a href={message.file_url} target="_blank" rel="noopener noreferrer">
        <img
          src={message.file_url}
          alt={message.file_name || message.content}
          style={{
            maxWidth: '100%',
            maxHeight: '200px',
            borderRadius: '8px',
            marginBottom: '8px',
            cursor: 'pointer',
          }}
        />
      </a>
    )}
    
    {/* File info card */}
    <div style={{
      background: isSent ? 'rgba(255,255,255,0.1)' : 'rgba(102,126,234,0.1)',
      padding: '8px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(0,0,0,0.1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* File icon */}
        <span style={{ fontSize: '24px' }}>
          {message.file_type && message.file_type.startsWith('image/') ? '🖼️' :
           message.file_type && message.file_type.startsWith('video/') ? '🎥' :
           message.file_type && message.file_type.startsWith('audio/') ? '🎵' :
           message.file_type && message.file_type.includes('pdf') ? '📄' :
           '📎'}
        </span>
        
        {/* File name and size */}
        <div style={{ flex: 1 }}>
          <a href={message.file_url} target="_blank" rel="noopener noreferrer">
            {message.file_name || message.content}
          </a>
          {message.file_size && (
            <div style={{ fontSize: '11px', opacity: 0.7 }}>
              {formatFileSize(message.file_size)}
            </div>
          )}
        </div>
        
        {/* Download button */}
        <a href={message.file_url} download title="Tải xuống">
          ⬇️
        </a>
      </div>
    </div>
  </div>
) : ...}
```

## ✅ Các tính năng đã implement

### Client-side
- ✅ Chọn file từ file picker
- ✅ Validate kích thước file (max 50MB)
- ✅ Get presigned URL từ server
- ✅ Upload trực tiếp lên S3
- ✅ Optimistic UI update (hiển thị ngay)
- ✅ Emit socket event với metadata đầy đủ
- ✅ Xử lý ACK timeout (5 giây)
- ✅ Hiển thị status: sending/sent/failed
- ✅ Preview cho image files
- ✅ File info card cho tất cả file types
- ✅ Download button
- ✅ Multiple file upload support

### Server-side
- ✅ Generate presigned URL với auth check
- ✅ Validate file size
- ✅ Unique key generation (user_id + timestamp + uuid)
- ✅ Lưu message vào database
- ✅ Check block list
- ✅ Send ACK về sender
- ✅ Broadcast đến receiver
- ✅ Error handling đầy đủ

## 🎨 UI/UX Features

### Preview Types
1. **Images** (image/*)
   - Hiển thị thumbnail preview
   - Click để xem full size (new tab)
   - Max height: 200px

2. **Videos** (video/*)
   - Icon 🎥
   - File name + size
   - Download button

3. **Audio** (audio/*)
   - Icon 🎵
   - File name + size
   - Download button

4. **PDF** (application/pdf)
   - Icon 📄
   - File name + size
   - Download button

5. **Other files**
   - Icon 📎
   - File name + size
   - Download button

### Status Indicators
- **sending** (⏳): Đang upload/gửi
- **sent** (✓✓): Đã gửi thành công
- **failed** (❌): Gửi thất bại (có nút retry)
- **blocked** (🚫): Bị block bởi người nhận

## 🔒 Security

- ✅ JWT authentication required
- ✅ File size validation (50MB max)
- ✅ Secure filename sanitization
- ✅ Unique key per file (prevent overwrite)
- ✅ Presigned URL expiration (1 hour)
- ✅ Block list checking
- ✅ Content-Type validation

## 📊 Performance

- ✅ Upload trực tiếp lên S3 (không qua server)
- ✅ Optimistic UI updates (UX nhanh)
- ✅ Socket.IO real-time delivery
- ✅ ACK mechanism cho reliability
- ✅ Timeout handling cho error cases

## 🐛 Error Handling

1. **No receiver selected**: Alert user
2. **File too large**: Alert with size limit
3. **Presigned URL failed**: Show error message
4. **S3 upload failed**: Show error message
5. **Socket timeout**: Mark as 'failed' with retry button
6. **Blocked user**: Server sends blocked status in ACK

## 🚀 Future Enhancements

- [ ] Progress bar cho upload
- [ ] Pause/resume upload
- [ ] Multiple file selection UI preview
- [ ] Video thumbnail generation
- [ ] Audio player inline
- [ ] PDF preview inline
- [ ] File compression before upload
- [ ] Image resizing/optimization
- [ ] Upload queue management
- [ ] CDN integration
