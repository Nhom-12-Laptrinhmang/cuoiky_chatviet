# 🎨 Hướng dẫn Gửi Sticker & Emoji

## ✨ Tính năng được implement

### 1.1.3 Gửi Emoji / Reaction
- ✅ **ReactionButton** hover → chọn emoji
- ✅ Socket emit: `send_message({ type: "reaction", content: "❤️", target_message_id })`
- ✅ Server lưu DB → broadcast `message_reacted`
- ✅ Client hiển thị emoji nhỏ dưới tin nhắn

### 1.1.4 Gửi Sticker
- ✅ Click **StickerButton** (🖼️) → mở modal với 2 tab
- ✅ **STICKER tab**: hiển thị sticker, click → gửi trực tiếp
- ✅ **EMOJI tab**: hiển thị emoji, click → thêm vào input (giống như typing)
- ✅ Emit socket: `send_sticker({ sender_id, receiver_id, sticker_id, sticker_url })`
- ✅ Server lưu DB, broadcast `receive_message` với `message_type: "sticker"`
- ✅ Client hiển thị sticker dưới dạng hình ảnh

---

## 🗂️ Files được tạo/sửa

### Frontend (React)

#### 1. **`client/src/components/Chat/StickerButton.js`** (NEW)
- Modal với 2 tab: STICKER | EMOJI
- **STICKER tab**: Grid 4x, click → gửi trực tiếp
- **EMOJI tab**: 8 cột, click → thêm vào input
- Search & categories support

#### 2. **`client/src/components/Chat/ChatBox.js`** (MODIFIED)
```javascript
// Import StickerButton
import StickerButton from './StickerButton';

// Handler gửi sticker
const handleSendSticker = (sticker) => {
  // Gửi qua socket, optimistic UI
};

// Handler thêm emoji vào input
const handleAddEmoji = (emoji) => {
  setMessageText((prev) => prev + emoji);
};

// Render
<StickerButton onSelectSticker={handleSendSticker} onAddEmoji={handleAddEmoji} />
```

#### 3. **`client/src/components/Chat/MessageBubble.js`** (MODIFIED)
```javascript
// Hiển thị sticker
{message.message_type === 'sticker' ? (
  <img src={message.sticker_url} alt="sticker" />
) : ...
```

#### 4. **`client/src/services/socket.js`** (MODIFIED)
```javascript
// Gửi sticker
export const sendSticker = (senderId, receiverId, stickerId, stickerUrl, opts = {}) => {
  const sock = getSocket();
  sock.emit('send_sticker', {
    sender_id: senderId,
    receiver_id: receiverId,
    sticker_id: stickerId,
    sticker_url: stickerUrl,
    client_message_id: opts.client_message_id || null,
  });
};
```

### Backend (Python/Flask)

#### 5. **`server/models/message_model.py`** (MODIFIED)
```python
class Message(db.Model):
    # ... existing fields ...
    message_type = db.Column(db.String(50), default='text')  # 'text', 'sticker', 'reaction'
    sticker_id = db.Column(db.String(255), nullable=True)
    sticker_url = db.Column(db.String(500), nullable=True)
```

#### 6. **`server/sockets/chat_events.py`** (MODIFIED)
```python
@socketio.on('send_sticker')
def handle_send_sticker(data):
    """Handle sticker messages (Giphy, EmojiOne, Twemoji, custom pack)."""
    # Lưu DB với message_type='sticker'
    # Emit ACK + broadcast receive_message
```

#### 7. **`server/migrate_add_sticker_type.py`** (NEW)
- Migration script: thêm cột `message_type`, `sticker_id`, `sticker_url`
- Chạy: `python3 migrate_add_sticker_type.py`

---

## 🚀 Cách sử dụng

### Gửi Sticker
1. Click nút 🖼️ (StickerButton)
2. Chọn tab **STICKER**
3. Click vào sticker bất kỳ → gửi ngay

### Gửi Emoji
1. Click nút 🖼️ (StickerButton)
2. Chọn tab **EMOJI**
3. Click emoji → thêm vào input
4. Tiếp tục nhập hoặc nhấn **Enter/Gửi**

### Reaction emoji (existing feature)
1. Hover vào message
2. Click vào emoji reaction
3. Hiển thị emoji nhỏ dưới message

---

## 📊 Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StickerButton Modal                      │
├─────────────────────┬───────────────────────────────────────┤
│    STICKER TAB      │         EMOJI TAB                     │
├─────────────────────┼───────────────────────────────────────┤
│ - Grid 4x           │ - Grid 8x                             │
│ - Click → send now  │ - Click → add to input                │
│   via sendSticker() │   setMessageText(prev+emoji)          │
│                     │ - User press Enter to send            │
└─────────────────────┴───────────────────────────────────────┘

STICKER FLOW:
  Client: handleSendSticker() 
    → socket.emit('send_sticker')
    → optimistic UI (setMessages)
    ↓
  Server: handle_send_sticker()
    → save to DB (message_type='sticker')
    → emit('message_sent_ack')
    → broadcast('receive_message')
    ↓
  Client: onReceiveMessage()
    → render MessageBubble with <img>

EMOJI FLOW:
  Client: handleAddEmoji(emoji)
    → setMessageText(text + emoji)
    ↓
  User: presses Enter/Click Gửi
    → handleSendMessage()
    → socket.emit('send_message')
    → (same as normal text message)
```

---

## 🎨 Customization

### Thêm Sticker mới
Edit `StickerButton.js`:
```javascript
const STICKERS = [
  { id: 'your_id', url: 'https://...' },
  // ...
];
```

### Thêm Emoji categories
Edit `StickerButton.js`:
```javascript
const EMOJIS = [
  { category: 'Yêu thích', emojis: ['😍', '❤️', ...] },
  // ...
];
```

### Tích hợp Giphy API
```javascript
const fetchGiphyStickers = async (query) => {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=YOUR_KEY&q=${query}`
  );
  const data = await res.json();
  return data.data.map(gif => ({
    id: gif.id,
    url: gif.images.fixed_width.url
  }));
};
```

---

## ✅ Testing Checklist

- [ ] Click StickerButton → modal opens
- [ ] Click STICKER tab → stickers display
- [ ] Click sticker → message sent immediately
- [ ] Click EMOJI tab → emojis display
- [ ] Click emoji → added to input text
- [ ] Type more text after emoji + press Enter → sent
- [ ] Received sticker displays as image
- [ ] Received emoji displays as text
- [ ] Sticker appears in database with `message_type='sticker'`
- [ ] Hover message → reaction picker works

---

## 🔧 API References

### Socket Events

#### Client → Server
```javascript
// Send Sticker
socket.emit('send_sticker', {
  sender_id: 123,
  receiver_id: 456,
  sticker_id: 'cat1',
  sticker_url: 'https://...',
  client_message_id: 'client_xyz'
});

// Send Text (unchanged)
socket.emit('send_message', {
  sender_id: 123,
  receiver_id: 456,
  content: 'Hello',
  client_message_id: 'client_abc'
});

// Add Reaction (unchanged)
socket.emit('add_reaction', {
  message_id: 789,
  user_id: 123,
  reaction: '❤️'
});
```

#### Server → Client
```javascript
// Message Sent Ack (unchanged)
socket.on('message_sent_ack', {
  client_message_id: 'client_xyz',
  message_id: 789,
  status: 'sent'
});

// Receive Message (now supports sticker type)
socket.on('receive_message', {
  id: 789,
  sender_id: 123,
  receiver_id: 456,
  message_type: 'sticker',  // NEW: 'text' or 'sticker'
  sticker_id: 'cat1',       // NEW
  sticker_url: 'https://...', // NEW
  timestamp: '2025-11-16T...',
  status: 'sent'
});
```

---

## 📝 Notes

- Sticker gửi trực tiếp → optimistic UI ngay
- Emoji được thêm vào input như text bình thường
- Database schema được update tự động qua migration
- Hỗ trợ Giphy API (cần config API key)
- Emoji categories có thể expand với ngôn ngữ khác
