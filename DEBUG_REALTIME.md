# 🐛 DEBUG GUIDE - Real-time Chat (Chi Tiết)

## Bước 1: Khởi động Backend (Terminal 1)

```bash
cd /Users/melaniepham/Documents/Viet/HK1\ Năm\ 3/CUOI\ KY/11_11cuoiky
source .venv/bin/activate
python server/app.py
```

**Quan sát:**
```
═══════════════════════════════════════════════════════════
🔗 [SOCKET] INITIALIZATION
═══════════════════════════════════════════════════════════
📍 SOCKET_URL: http://localhost:5000
...
═══════════════════════════════════════════════════════════
[SOCKET] Connected from 127.0.0.1, sid=abc123...
========== [JOIN] START ==========
Received join data: {'user_id': 1}
✅ Stored mapping: user_id=1 → sid=abc123...
✅ User joined room: user-1
Current user_sockets mapping: {1: 'abc123...'}
[JOIN] END - SUCCESS
```

---

## Bước 2: Khởi động Frontend (Terminal 2)

```bash
cd /Users/melaniepham/Documents/Viet/HK1\ Năm\ 3/CUOI\ KY/11_11cuoiky/client
npm start
```

**Quan sát trong Browser DevTools Console:**
```
═══════════════════════════════════════════════════════════
🔗 [SOCKET] INITIALIZATION
═══════════════════════════════════════════════════════════
📍 SOCKET_URL: http://localhost:5000
📍 Current location: http://localhost:3000/chat
📍 Hostname: localhost
📍 Protocol: http:
═══════════════════════════════════════════════════════════

✅ [SOCKET] Connected successfully!
   sid: xyz789...

[JOIN] Attempting to join user room: user-1
[JOIN] ✅ Socket connected, emitting join event...
[JOIN] ✅ Join event emitted for user_id: 1
```

---

## Bước 3: Mở 2 Browser Tabs (Tab A & Tab B)

### Tab A (User Alice - id=1)
- Đăng nhập: alice / password
- Chọn user "bob" để chat

### Tab B (User Bob - id=2)  
- Đăng nhập: bob / password
- Chọn user "alice" để chat

---

## Bước 4: Kiểm Tra Join Room

**Backend Terminal:**
```
[SOCKET] Connected from 127.0.0.1, sid=client1_sid
========== [JOIN] START ==========
Received join data: {'user_id': 1}
✅ Stored mapping: user_id=1 → sid=client1_sid
✅ User joined room: user-1
[JOIN] END - SUCCESS

[SOCKET] Connected from 127.0.0.1, sid=client2_sid
========== [JOIN] START ==========
Received join data: {'user_id': 2}
✅ Stored mapping: user_id=2 → sid=client2_sid
✅ User joined room: user-2
[JOIN] END - SUCCESS
```

✅ **Nếu thấy 2 join success** → Socket kết nối OK!
❌ **Nếu chỉ có 1 hoặc không join** → Kiểm tra lại mạng & URL backend

---

## Bước 5: Alice Gửi Tin Nhắn (Tab A)

1. Vào chat với "bob"
2. Gõ: "Hi Bob"
3. Nhấn Gửi

**Frontend Console (Tab A):**
```
========== [SEND_MESSAGE] CLIENT ==========
Payload: {
  sender_id: 1,
  receiver_id: 2,
  content: "Hi Bob",
  reply_to_id: null,
  forward_from_id: null
}
Socket connected? true
Socket id: client1_sid
✅ Emitted to server
========== 
```

**Backend Terminal:**
```
========== [SEND_MESSAGE] START ==========
Received data: {
  'sender_id': 1, 
  'receiver_id': 2, 
  'content': 'Hi Bob'
}
✅ Message saved to DB: message_id=15, timestamp=2024-11-15T10:30:45.123456
📤 Emitting to receiver room 'user-2'...
✅ Emitted to user-2
📤 Emitting to sender room 'user-1'...
✅ Emitted to user-1
[SEND_MESSAGE] END - SUCCESS
```

✅ **Nếu thấy:** `✅ Emitted to user-2` → Backend gửi thành công!
❌ **Nếu không:** Lỗi emit (check lại socketio.emit syntax)

---

## Bước 6: Bob Nhận Tin Nhắn (Tab B)

**Frontend Console (Tab B):**
```
========== [RECEIVE_MESSAGE] CLIENT ==========
Received: {
  id: 15,
  sender_id: 1,
  receiver_id: 2,
  content: "Hi Bob",
  timestamp: "2024-11-15T10:30:45.123456"
}
========== 

[CHAT] Received message: {id: 15, sender_id: 1, ...}
```

✅ **Nếu thấy RECEIVE_MESSAGE** → Tin nhắn nhận được! 🎉
❌ **Nếu không thấy** → Socket.IO không broadcast đúng room

---

## Bước 7: Kiểm Tra Lại (Alice Nhận Tin Nhắn Của Bob)

Bob gửi tin nhắn "Hello Alice" → Alice phải thấy trong frontend console:
```
========== [RECEIVE_MESSAGE] CLIENT ==========
Received: {
  id: 16,
  sender_id: 2,
  receiver_id: 1,
  content: "Hello Alice",
  ...
}
```

---

## 🔴 Vấn Đề Thường Gặp

### 1. "Socket not connected" ⚠️
```
[JOIN] ⚠️  Socket not connected yet (connected=false), will retry in 500ms
[JOIN] ⚠️  Socket not connected yet...
[JOIN] ⚠️  Socket not connected yet...
```
**Nguyên nhân:** Backend không chạy hoặc URL sai
**Giải pháp:** 
- Kiểm tra backend chạy ở port 5000
- Kiểm tra URL: `http://localhost:5000` (không phải localhost:3000)

### 2. "Connection error: Error: connect ECONNREFUSED" ❌
```
❌ [SOCKET] Connection error: Error: connect ECONNREFUSED
```
**Nguyên nhân:** Backend chưa start
**Giải pháp:** Chạy `python server/app.py` trong terminal khác

### 3. Tin nhắn không nhận được 📭
- ✅ Thấy `[SEND_MESSAGE]` trên client
- ✅ Thấy `[SEND_MESSAGE] Saved message_id=...` trên backend
- ❌ Nhưng không thấy `[RECEIVE_MESSAGE]` trên client kia

**Kiểm tra:**
1. Backend có emit đúng room không? (Tìm `✅ Emitted to user-X`)
2. Client kia có socket room đúng không? (Tìm `[JOIN] ✅ User joined room: user-X`)

### 4. 2 tin nhắn (1 sender + 1 receiver) không khớp nhau
**Nguyên nhân:** `sender_id` hoặc `receiver_id` sai
**Giải pháp:** Kiểm tra:
- Tab A: currentUserId = 1 (alice)
- Tab B: currentUserId = 2 (bob)
- Payload sender_id phải = currentUserId
- Payload receiver_id phải = selectedUser.id

---

## ✅ Checklist Thành Công

- [ ] Backend console thấy `✅ User joined room: user-1` và `user-2`
- [ ] Frontend console thấy `✅ [SOCKET] Connected successfully!`
- [ ] Alice gửi tin → Backend thấy `[SEND_MESSAGE] sender=1 receiver=2`
- [ ] Backend thấy `✅ Emitted to user-2` 
- [ ] Bob (Tab B) console thấy `[RECEIVE_MESSAGE]`
- [ ] Bob gửi tin → Alice nhận được ngược lại
- [ ] Tin nhắn hiện trong chat UI (không chỉ console)

---

## 🎯 Kết Luận

Nếu đạt hết checklist → **Chat real-time hoạt động! 🎉**

Nếu vẫn lỗi → Xem Backend Terminal output trong bước 5, post lại tất cả logs ở đó.
