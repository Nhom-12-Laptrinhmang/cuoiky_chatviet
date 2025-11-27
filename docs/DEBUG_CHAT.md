# 🔧 Debug Chat Realtime - Hướng dẫn chi tiết

## ✅ Vừa sửa gì?

1. **Backend** (`server/sockets/chat_events.py`):
   - Thay `emit()` bằng `socketio.emit()` (đúng API Flask-SocketIO)
   - Thay `to=room_name` bằng `room=room_name` (cách gọi đúng)
   - Thêm log chi tiết từng bước

2. **Frontend** (`client/src/services/socket.js`):
   - Auto-detect socket URL dựa vào hostname
   - Thêm check `socket.connected` trước khi emit
   - Retry join room nếu socket chưa ready

---

## 📋 Cách test

### **Terminal 1: Backend**
```bash
cd /Users/melaniepham/Documents/Viet/HK1\ Năm\ 3/CUOI\ KY/11_11cuoiky
bash run_backend.sh
```

Xem output, phải thấy:
```
[SOCKET] Connected from 127.0.0.1, sid=abc123
[JOIN] user_id=1 joined room=user-1
```

### **Terminal 2: Frontend**
```bash
cd /Users/melaniepham/Documents/Viet/HK1\ Năm\ 3/CUOI\ KY/11_11cuoiky
bash run_frontend.sh
```

### **Trình duyệt: 2 tab**

#### Tab 1 (alice):
- URL: `http://localhost:3000/chat`
- Đăng nhập: `alice` / `password`
- Mở DevTools (F12) → Console

#### Tab 2 (bob):
- URL: `http://localhost:3000/chat` (tab mới hoặc window mới)
- Đăng nhập: `bob` / `password`
- Mở DevTools (F12) → Console

---

## 📊 Kiểm tra kết nối Socket

### **Trên Backend Terminal, phải thấy:**

**Tab 1 đăng nhập:**
```
[SOCKET] Connected from 127.0.0.1, sid=xyz789...
[JOIN] user_id=1 joined room=user-1
```

**Tab 2 đăng nhập:**
```
[SOCKET] Connected from 127.0.0.1, sid=abc123...
[JOIN] user_id=2 joined room=user-2
```

---

## 📝 Kiểm tra gửi tin nhắn

### **Tab 1 (Alice) gửi "hi" cho Bob:**

**Tab 1 Console sẽ thấy:**
```
[SEND_MESSAGE] {sender_id: 1, receiver_id: 2, content: "hi", ...}
[RECEIVE_MESSAGE] {id: 1, sender_id: 1, receiver_id: 2, content: "hi", ...}
```

**Backend Terminal sẽ thấy:**
```
[SEND_MESSAGE] sender=1 receiver=2 content=hi
[SEND_MESSAGE] Saved message_id=1
[SEND_MESSAGE] Broadcasting to receiver room: user-2
[SEND_MESSAGE] Broadcasting to sender room: user-1
```

**Tab 2 (Bob) Console sẽ thấy:**
```
[RECEIVE_MESSAGE] {id: 1, sender_id: 1, receiver_id: 2, content: "hi", ...}
[CHAT] Received message: {...}
```

---

## ❌ Nếu không thấy tin nhắn - Kiểm tra từng bước:

### **Bước 1: Socket connect?**
Tab console phải thấy:
```
[SOCKET] Connected, sid: ...
```

Nếu không thấy → Backend không lắng nghe hoặc port sai

### **Bước 2: Join room?**
Tab console phải thấy:
```
[JOIN] Joining user room: 1
[JOIN] Emitted join event for user_id: 1
```

Backend terminal phải thấy:
```
[JOIN] user_id=1 joined room=user-1
```

Nếu không → Socket không emit đúng

### **Bước 3: Send message?**
Tab console phải thấy:
```
[SEND_MESSAGE] {sender_id: ..., receiver_id: ..., ...}
```

Backend terminal phải thấy:
```
[SEND_MESSAGE] sender=X receiver=Y
[SEND_MESSAGE] Saved message_id=Z
```

Nếu không → Form gửi không hoạt động

### **Bước 4: Receive message?**
Tab console của receiver phải thấy:
```
[RECEIVE_MESSAGE] {...}
```

Nếu không → Socket emit không broadcast đúng

---

## 🆘 Nếu vẫn không được - Kiểm tra các điều này:

### **1. Port Backend**
```bash
lsof -i :5000
# Phải thấy process Python đang chạy
```

### **2. Port Frontend**
```bash
lsof -i :3000
# Phải thấy node process đang chạy
```

### **3. Socket URL**
Tab console gõ:
```javascript
// In ra URL socket đang connect tới
console.log('Socket URL:', window.location.protocol + '//' + window.location.hostname + ':5000')
```

Phải là: `http://localhost:5000` hoặc `http://127.0.0.1:5000`

### **4. Network tab (DevTools)**
- F12 → Network
- Gửi tin nhắn
- Tìm event `send_message`
- Xem status: phải là 101 (WebSocket upgrade) hoặc request thành công

### **5. Clear cache**
```bash
# Terminal tab frontend Ctrl+C
rm -rf client/node_modules/.cache
bash run_frontend.sh
```

---

## 📞 Nếu vẫn có vấn đề - Báo cáo như sau:

```
1. Backend terminal log (copy 5-10 dòng)
2. Frontend tab 1 Console log (copy 5-10 dòng)
3. Frontend tab 2 Console log (copy 5-10 dòng)
4. Network tab detail (screenshot)
5. Điều gì đã thử sửa
```

---

## ✨ Nếu hoạt động - Bạn sẽ thấy:

✅ Gửi tin nhắn từ Tab 1 → Tab 2 nhận ngay lập tức
✅ Backend log mỗi event realtime
✅ Cả 2 tab đều thấy tin nhắn
✅ Hover tin nhắn → thấy nút reaction/reply
✅ Click emoji → tin nhắn hiểm reaction

---

**Good luck! 🚀**
