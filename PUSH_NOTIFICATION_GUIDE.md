# 📱 Hướng Dẫn Thông Báo Đẩy (Push Notifications)

## 🎯 Tổng Quan

Hệ thống thông báo đẩy của ứng dụng đã được nâng cấp với tính năng **thông báo thông minh** - chỉ hiển thị thông báo mới nhất và tự động nhóm/thay thế thông báo cũ, tương tự như Facebook và Zalo.

### ✨ Tính Năng Chính

1. **Single Latest Mode** (Mặc định) - Chỉ hiển thị 1 thông báo mới nhất
2. **Smart Grouping** - Tự động nhóm tin nhắn từ cùng người gửi
3. **Smooth Animations** - Chuyển đổi mượt mà giữa các thông báo
4. **Multiple Display Modes** - Linh hoạt tùy chỉnh cách hiển thị

---

## 🚀 Cách Hoạt Động

### 1. Single Latest Mode (Chế Độ Mặc Định)

Khi có nhiều thông báo đến cùng lúc:

```
Tin nhắn 1 từ User A → Hiển thị
Tin nhắn 2 từ User A → Thay thế tin nhắn 1 (cùng người gửi)
Tin nhắn 3 từ User B → Đóng tin nhắn 2, hiển thị tin nhắn 3
```

**Ưu điểm:**
- ✅ Không làm phiền người dùng với quá nhiều thông báo
- ✅ Luôn hiển thị thông tin mới nhất
- ✅ Tiết kiệm không gian màn hình
- ✅ Trải nghiệm giống Facebook/Zalo

### 2. Queue Mode (Chế Độ Hàng Đợi)

Hiển thị từng thông báo lần lượt:

```
Tin nhắn 1 → Hiển thị → Đóng
Tin nhắn 2 → Hiển thị → Đóng
Tin nhắn 3 → Hiển thị → Đóng
```

**Ưu điểm:**
- ✅ Không bỏ sót thông báo
- ✅ Người dùng đọc từng tin nhắn

### 3. Multiple Mode (Chế Độ Nhiều Thông Báo)

Hiển thị nhiều thông báo cùng lúc (tối đa 5):

```
Tin nhắn 1 }
Tin nhắn 2 } Hiển thị cùng lúc
Tin nhắn 3 }
```

---

## 💻 Sử Dụng Trong Code

### Import Service

```javascript
import { 
  showToast, 
  showMessageToast,
  getNotificationMode,
  setNotificationMode,
  isGroupingEnabled,
  setGroupingEnabled,
  NOTIFICATION_MODES
} from '../../services/notifications';
```

### Hiển Thị Thông Báo Tin Nhắn

```javascript
// Cách 1: Sử dụng showMessageToast (Khuyến nghị)
showMessageToast({
  senderName: 'Nguyễn Văn A',
  senderAvatar: 'https://example.com/avatar.jpg',
  senderId: 'user_123',  // Quan trọng: để nhóm thông báo
  message: 'Xin chào! Bạn khỏe không?',
  onClick: () => {
    // Xử lý khi click vào thông báo
    console.log('User clicked notification');
  }
});

// Cách 2: Sử dụng showToast với options
showToast(
  'Nguyễn Văn A',
  'Xin chào! Bạn khỏe không?',
  {
    variant: 'message',
    category: 'message',
    senderName: 'Nguyễn Văn A',
    senderAvatar: 'https://example.com/avatar.jpg',
    senderId: 'user_123',  // Để nhóm thông báo
    onClick: handleClick
  }
);
```

### Đặt Chế Độ Hiển Thị

```javascript
// Đặt về chế độ single latest (mặc định)
setNotificationMode(NOTIFICATION_MODES.SINGLE_LATEST);

// Chế độ hàng đợi
setNotificationMode(NOTIFICATION_MODES.QUEUE);

// Chế độ nhiều thông báo
setNotificationMode(NOTIFICATION_MODES.MULTIPLE);

// Kiểm tra chế độ hiện tại
const currentMode = getNotificationMode();
console.log('Current mode:', currentMode);
```

### Bật/Tắt Nhóm Thông Báo

```javascript
// Bật nhóm thông báo theo người gửi (mặc định: bật)
setGroupingEnabled(true);

// Tắt nhóm thông báo
setGroupingEnabled(false);

// Kiểm tra trạng thái
const isGrouping = isGroupingEnabled();
console.log('Grouping enabled:', isGrouping);
```

---

## 🎨 Animation & Styling

Hệ thống sử dụng các animation mượt mà:

### 1. **fadeInScale** - Thông báo mới xuất hiện
```css
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### 2. **fadeOutScale** - Thông báo cũ biến mất
```css
@keyframes fadeOutScale {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
}
```

### 3. **bounceIn** - Tin nhắn mới từ cùng người gửi
```css
@keyframes bounceIn {
  0% { transform: scale(1); }
  30% { transform: scale(1.05); }
  60% { transform: scale(0.98); }
  100% { transform: scale(1); }
}
```

---

## 🔧 Cấu Hình Settings

### Trong Component Settings

```javascript
import { 
  setNotificationMode, 
  setGroupingEnabled,
  NOTIFICATION_MODES 
} from '../services/notifications';

function NotificationSettings() {
  return (
    <div>
      <h3>Chế Độ Hiển Thị</h3>
      <select onChange={(e) => setNotificationMode(e.target.value)}>
        <option value={NOTIFICATION_MODES.SINGLE_LATEST}>
          Chỉ hiển thị mới nhất
        </option>
        <option value={NOTIFICATION_MODES.QUEUE}>
          Hiển thị lần lượt
        </option>
        <option value={NOTIFICATION_MODES.MULTIPLE}>
          Hiển thị nhiều cùng lúc
        </option>
      </select>

      <label>
        <input 
          type="checkbox" 
          onChange={(e) => setGroupingEnabled(e.target.checked)}
          defaultChecked={true}
        />
        Nhóm tin nhắn từ cùng người gửi
      </label>
    </div>
  );
}
```

### LocalStorage Keys

```javascript
// Chế độ hiển thị
localStorage.getItem('notifications_mode')
// Values: 'single_latest' | 'queue' | 'multiple'

// Bật/tắt nhóm
localStorage.getItem('notifications_group_enabled')
// Values: '1' | '0'
```

---

## 📋 Ví Dụ Thực Tế

### Ví Dụ 1: Chat Box - Nhận Tin Nhắn Mới

```javascript
// Trong ChatBox.js
useEffect(() => {
  socket.on('new_message', (data) => {
    const { sender, message, senderId, senderAvatar } = data;
    
    // Chỉ hiển thị thông báo nếu không phải tin nhắn từ mình
    if (senderId !== currentUserId) {
      showMessageToast({
        senderName: sender,
        senderId: senderId,        // Quan trọng!
        senderAvatar: senderAvatar,
        message: message.text,
        onClick: () => {
          // Mở chat với người gửi
          selectUser(senderId);
        }
      });
    }
  });
}, [socket, currentUserId]);
```

### Ví Dụ 2: Group Chat - Nhiều Tin Nhắn Liên Tiếp

```javascript
// Tình huống: Nhóm chat có 3 người gửi tin liên tục
// User A → Tin nhắn 1
// User A → Tin nhắn 2 (thay thế tin 1)
// User B → Tin nhắn 3 (đóng tin A, hiển thị tin B)
// User A → Tin nhắn 4 (đóng tin B, hiển thị tin A)

socket.on('group_message', (data) => {
  showMessageToast({
    senderName: data.sender,
    senderId: data.senderId,  // Nhóm theo ID
    senderAvatar: data.avatar,
    message: data.text,
    onClick: () => openGroupChat(data.groupId)
  });
});
```

### Ví Dụ 3: Thông Báo Hệ Thống

```javascript
// Thông báo không nhóm (mỗi thông báo độc lập)
showToast(
  'Hệ thống',
  'Bạn có lời mời kết bạn mới',
  {
    variant: 'success',
    category: 'system',
    groupKey: 'friend_request',  // Nhóm theo loại
    onClick: () => openFriendRequests()
  }
);
```

---

## 🎯 Best Practices

### 1. Luôn Cung Cấp `senderId`

```javascript
// ✅ Đúng
showMessageToast({
  senderName: 'User A',
  senderId: 'user_123',  // Có ID để nhóm
  message: 'Hello'
});

// ❌ Sai
showMessageToast({
  senderName: 'User A',
  // Thiếu senderId → không nhóm được
  message: 'Hello'
});
```

### 2. Sử Dụng `groupKey` Cho Thông Báo Hệ Thống

```javascript
// Nhóm theo loại thông báo
showToast('Hệ thống', 'Cập nhật mới', {
  groupKey: 'system_update',
  category: 'system'
});

showToast('Hệ thống', 'Lỗi kết nối', {
  groupKey: 'system_error',
  category: 'error'
});
```

### 3. Xử Lý onClick Đúng Cách

```javascript
showMessageToast({
  senderName: 'User A',
  senderId: 'user_123',
  message: 'Hello',
  onClick: () => {
    // Thực hiện action
    selectUser('user_123');
    // Toast sẽ tự động đóng sau khi click
  }
});
```

---

## ⚙️ Cấu Hình Nâng Cao

### Tùy Chỉnh Duration

```javascript
// Trong ToastContainer props
<ToastContainer 
  duration={5000}  // 5 giây (mặc định: 7000ms)
  position="bottom-right"
/>
```

### Tùy Chỉnh Số Lượng Toast Tối Đa (Multiple Mode)

```javascript
<ToastContainer 
  maxToasts={3}  // Tối đa 3 toast (mặc định: 5)
  position="bottom-right"
/>
```

### Vị Trí Hiển Thị

```javascript
// Trong settings localStorage
const settings = {
  toastPosition: 'bottom-right',  // Hoặc: 'top-right', 'top-left', 'bottom-left'
  toastDuration: 7000,
  toastMaxCount: 5
};
localStorage.setItem('settings_notifications', JSON.stringify(settings));
```

---

## 🐛 Troubleshooting

### Vấn Đề 1: Thông Báo Không Nhóm

**Nguyên nhân:** Thiếu `senderId` hoặc `groupKey`

**Giải pháp:**
```javascript
// Đảm bảo có senderId
showMessageToast({
  senderName: 'User',
  senderId: 'user_id',  // Thêm dòng này
  message: 'Hello'
});
```

### Vấn Đề 2: Animation Không Mượt

**Nguyên nhân:** CSS chưa được load

**Giải pháp:**
```javascript
// Đảm bảo import CSS
import '../../styles/Toast.css';
```

### Vấn Đề 3: Thông Báo Biến Mất Quá Nhanh

**Nguyên nhân:** Duration quá ngắn

**Giải pháp:**
```javascript
// Tăng duration trong settings
const settings = {
  toastDuration: 10000  // 10 giây
};
```

---

## 📊 So Sánh Các Chế Độ

| Tính năng | Single Latest | Queue | Multiple |
|-----------|--------------|-------|----------|
| Số toast hiển thị | 1 | 1 | 1-5 |
| Nhóm theo người gửi | ✅ | ❌ | ❌ |
| Auto-replace | ✅ | ❌ | ❌ |
| Tốc độ hiển thị | Nhanh | Chậm | Vừa |
| Tránh spam | ✅✅✅ | ✅ | ❌ |
| UX giống FB/Zalo | ✅ | ❌ | ❌ |

---

## 🎓 Kết Luận

Hệ thống thông báo đẩy mới mang lại trải nghiệm người dùng tốt hơn:

- ✅ **Không spam**: Chỉ hiển thị thông báo quan trọng nhất
- ✅ **Thông minh**: Tự động nhóm tin nhắn từ cùng người
- ✅ **Mượt mà**: Animation chuyển đổi tự nhiên
- ✅ **Linh hoạt**: 3 chế độ hiển thị khác nhau
- ✅ **Dễ tùy chỉnh**: API đơn giản, rõ ràng

### Khuyến Nghị

Sử dụng **Single Latest Mode** (mặc định) cho trải nghiệm tốt nhất, giống Facebook và Zalo.

---

## 📞 Liên Hệ & Hỗ Trợ

Nếu cần hỗ trợ hoặc có câu hỏi, vui lòng liên hệ team phát triển.

**Version:** 1.0  
**Last Updated:** November 18, 2025
