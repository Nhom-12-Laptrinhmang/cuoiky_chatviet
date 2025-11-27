# 🎯 Chat Features - Hướng dẫn sử dụng

## ✅ Tính năng đã được sửa/thêm

### 1. **Chat Realtime (Tin nhắn tức thời)**
- ✅ 2 client có thể nhắn tin cho nhau và nhận ngay lập tức (không cần reload)
- ✅ Tin nhắn được lưu vào database
- ✅ Log chi tiết ở terminal backend (`[SEND_MESSAGE] sender=X receiver=Y`)

**Cách dùng:**
1. Chọn người trong danh sách bên trái
2. Gõ tin nhắn ở ô input phía dưới
3. Nhấn "Gửi" hoặc Enter
4. Tin nhắn sẽ hiện ở cả 2 client ngay lập tức

---

### 2. **Trả lời tin nhắn (Reply)**
- ✅ Di chuột vào tin nhắn → nhấn nút "↩️"
- ✅ Tin nhắn sẽ được highlight (reply preview)
- ✅ Gửi tin nhắn trả lời

**Cách dùng:**
1. Di chuột vào tin nhắn bạn muốn trả lời
2. Click nút "↩️" (reply button)
3. Gõ tin nhắn trả lời (sẽ hiện trên thanh input)
4. Click "Gửi"

---

### 3. **Chuyển tiếp tin nhắn (Forward)** ⬆️
- ✅ Di chuột vào tin nhắn → nhấn nút "⬆️"
- 🔄 Tính năng sẽ cho phép chọn người nhận sau

**Cách dùng:**
1. Di chuột vào tin nhắn
2. Click nút "⬆️" (forward button)
3. Chọn người muốn chuyển tiếp
4. Gửi

---

### 4. **Cảm xúc/Reaction (Emoji)**
- ✅ Di chuột vào tin nhắn → nhấn emoji (❤️, 😂, 😮, 😢, 🔥, 👍)
- ✅ Emoji sẽ hiện dưới tin nhắn
- ✅ Cả 2 client sẽ thấy reaction

**Cách dùng:**
1. Di chuột vào tin nhắn
2. Click emoji mà bạn muốn (❤️, 😂, v.v)
3. Emoji sẽ hiện dưới tin nhắn

---

## 🔧 Log Backend (Để debug)

Terminal backend sẽ hiển thị:
```
[SOCKET] Connected from 127.0.0.1, sid=abc123...
[JOIN] user_id=1 joined room=user-1
[SEND_MESSAGE] sender=1 receiver=2 content=hello... (first 30 chars)
[SEND_MESSAGE] Saved message_id=15
[SEND_MESSAGE] Emitting to receiver room: user-2
[SEND_MESSAGE] Emitting to sender room: user-1
[REACTION] message_id=15 user=1 reaction=❤️
[TYPING] sender=1 receiver=2 typing=true
```

---

## 🔧 Log Frontend (DevTools Console)

Trình duyệt sẽ hiển thị:
```
[SOCKET] Connected, sid: xyz789...
[JOIN] Joining user room: 1
[SEND_MESSAGE] {sender_id: 1, receiver_id: 2, content: "hello", ...}
[RECEIVE_MESSAGE] {id: 15, sender_id: 1, receiver_id: 2, content: "hello", ...}
[ADD_REACTION] message_id: 15, reaction: ❤️
```

---

## 🚀 Cách chạy

### Terminal 1 - Backend:
```bash
bash run_backend.sh
```

### Terminal 2 - Frontend:
```bash
bash run_frontend.sh
```

### Trình duyệt:
- Mở 2 tab hoặc 2 window: `http://localhost:3000`
- Đăng nhập bằng 2 tài khoản khác nhau
- Chat giữa 2 tab!

---

## 📋 Danh sách tài khoản test

```
alice / password
bob / password
carol / password
admin@example.com / password
test_user_profile / password
viet 2 / password
```

---

## ✨ Tính năng sắp tới

- [ ] Xóa tin nhắn (Delete)
- [ ] Chỉnh sửa tin nhắn (Edit)
- [ ] Voice message
- [ ] Video call (WebRTC)
- [ ] Group chat realtime
- [ ] Message search

---

**Chúc bạn sử dụng vui vẻ! 🎉**
