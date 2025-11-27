# Hướng Dẫn Triển Khai Thông Báo Tin Nhắn (Toast Notifications)

## Tổng Quan

Hệ thống thông báo tin nhắn dạng toast được thiết kế để hiển thị thông báo tin nhắn mới một cách trực quan, không gây phiền nhiễu. Popup sẽ xuất hiện ở góc dưới bên phải màn hình (có thể tùy chỉnh) và tự động biến mất sau 5-10 giây.

## 📋 Mục Lục

1. [Tính năng](#tính-năng)
2. [Cấu trúc files](#cấu-trúc-files)
3. [Cách sử dụng](#cách-sử-dụng)
4. [Cài đặt người dùng](#cài-đặt-người-dùng)
5. [Tích hợp với Socket](#tích-hợp-với-socket)
6. [Customization](#customization)
7. [API Reference](#api-reference)

---

## ✨ Tính Năng

### 1. **Giao Diện và Vị Trí**
- ✅ Hiển thị ở góc dưới bên phải màn hình (mặc định)
- ✅ Hỗ trợ 4 vị trí: `bottom-right`, `bottom-left`, `top-right`, `top-left`
- ✅ Không che khuất nội dung chính
- ✅ Animation mượt mà (slide in/out)
- ✅ Responsive trên mobile
- ✅ Tự động biến mất sau 5-10 giây (có thể tùy chỉnh)

### 2. **Nội Dung Thông Báo**
- ✅ Avatar người gửi (hoặc placeholder với chữ cái đầu)
- ✅ Tên người gửi
- ✅ Nội dung tin nhắn (tối đa 100 ký tự, tự động cắt với "...")
- ✅ Thời gian nhận (hiển thị động: "Vừa xong", "5 phút trước", "14:30")
- ✅ Progress bar hiển thị thời gian còn lại

### 3. **Tùy Chỉnh Cài Đặt**
- ✅ Bật/tắt thông báo popup
- ✅ Chọn vị trí hiển thị (4 góc màn hình)
- ✅ Điều chỉnh thời gian hiển thị (3s, 5s, 7s, 10s, hoặc đóng thủ công)
- ✅ Bật/tắt âm thanh thông báo
- ✅ Giới hạn số lượng popup hiển thị cùng lúc (3-10 thông báo)

### 4. **Tương Tác**
- ✅ Click vào toast để mở tin nhắn đầy đủ
- ✅ Nút đóng (×) để đóng thủ công
- ✅ Hover effect với shadow và transform
- ✅ Nút "Xóa tất cả" khi có nhiều hơn 2 toast

### 5. **Âm Thanh**
- ✅ Âm thanh nhẹ nhàng sử dụng Web Audio API
- ✅ Chỉ phát âm thanh cho toast mới nhất
- ✅ Có thể bật/tắt trong cài đặt
- ✅ Fallback an toàn nếu browser không hỗ trợ

---

## 📁 Cấu Trúc Files

```
client/src/
├── components/
│   └── Notifications/
│       ├── ToastNotification.js      # Component toast đơn lẻ (mới tạo)
│       ├── ToastContainer.js         # Container quản lý toasts (đã cập nhật)
│       └── Toast.js                  # Component hiển thị toast (đã cập nhật)
│
├── services/
│   └── notifications.js              # Service quản lý notifications (đã cập nhật)
│
├── styles/
│   └── Toast.css                     # Styles cho toast (mới tạo)
│
└── components/Settings/
    └── components/
        └── NotificationSettings.js   # Cài đặt thông báo (đã cập nhật)
```

---

## 🚀 Cách Sử Dụng

### 1. Hiển thị Toast từ bất kỳ đâu

```javascript
import { showMessageToast } from '../../services/notifications';

// Hiển thị toast tin nhắn mới
showMessageToast({
  senderName: 'Nguyễn Văn A',
  senderAvatar: 'https://example.com/avatar.jpg',
  message: 'Xin chào! Bạn có khỏe không?',
  onClick: () => {
    // Xử lý khi click vào toast
    // Ví dụ: chuyển đến conversation
    navigateToChat(conversationId);
  }
});
```

### 2. Sử dụng trong Chat Component

```javascript
import React, { useEffect } from 'react';
import { socket } from '../../services/socket';
import { showMessageToast } from '../../services/notifications';

const ChatComponent = () => {
  useEffect(() => {
    // Lắng nghe tin nhắn mới từ socket
    socket.on('new_message', (data) => {
      const { sender, message, conversationId } = data;
      
      // Kiểm tra nếu không đang ở conversation này
      if (currentConversationId !== conversationId) {
        showMessageToast({
          senderName: sender.name,
          senderAvatar: sender.avatar,
          message: message.content,
          onClick: () => {
            // Chuyển đến conversation khi click
            setCurrentConversation(conversationId);
          }
        });
      }
    });

    return () => socket.off('new_message');
  }, [currentConversationId]);

  return (
    // ... component JSX
  );
};
```

### 3. Thêm ToastContainer vào App

```javascript
import React from 'react';
import ToastContainer from './components/Notifications/ToastContainer';

function App() {
  // Lấy cài đặt từ localStorage hoặc context
  const toastSettings = {
    position: localStorage.getItem('toastPosition') || 'bottom-right',
    duration: parseInt(localStorage.getItem('toastDuration') || '7000'),
    maxToasts: parseInt(localStorage.getItem('toastMaxCount') || '5')
  };

  return (
    <div className="App">
      {/* Nội dung chính của app */}
      
      {/* Toast container */}
      <ToastContainer 
        position={toastSettings.position}
        duration={toastSettings.duration}
        maxToasts={toastSettings.maxToasts}
      />
    </div>
  );
}
```

---

## ⚙️ Cài Đặt Người Dùng

Người dùng có thể tùy chỉnh thông báo trong **Settings > Notifications > Thông Báo Popup**:

### Các tùy chọn:
1. **Bật/tắt thông báo popup** - Toggle on/off
2. **Vị trí hiển thị** - Chọn 1 trong 4 góc màn hình
3. **Thời gian hiển thị** - 3s, 5s, 7s (mặc định), 10s, hoặc đóng thủ công
4. **Âm thanh thông báo** - Bật/tắt âm thanh
5. **Số lượng popup tối đa** - 3, 5 (mặc định), 7, hoặc 10 thông báo

### Lưu cài đặt:

```javascript
import { updateNotificationSettings } from '../services/settingsService';

// Lưu cài đặt toast
await updateNotificationSettings({
  toastEnabled: true,
  toastPosition: 'bottom-right',
  toastDuration: 7000,
  toastSound: true,
  toastMaxCount: 5
});
```

---

## 🔌 Tích Hợp Với Socket

### Ví dụ trong socket handler:

```javascript
// client/src/services/socket.js hoặc chat events handler

import { showMessageToast } from './notifications';

// Lắng nghe tin nhắn mới
socket.on('receive_message', (data) => {
  const { message, sender, conversation } = data;
  
  // Kiểm tra xem có hiển thị toast không
  const toastEnabled = localStorage.getItem('toastEnabled') !== 'false';
  const isCurrentChat = currentConversationId === conversation.id;
  const isWindowFocused = document.hasFocus();
  
  // Chỉ hiển thị toast nếu:
  // - Toast được bật
  // - Không đang ở chat đó
  // - Hoặc cửa sổ không được focus
  if (toastEnabled && (!isCurrentChat || !isWindowFocused)) {
    showMessageToast({
      senderName: sender.name || sender.username,
      senderAvatar: sender.avatar_url,
      message: message.content,
      onClick: () => {
        // Mở conversation
        window.location.href = `/chat/${conversation.id}`;
        // Hoặc sử dụng React Router:
        // navigate(`/chat/${conversation.id}`);
      }
    });
  }
});
```

---

## 🎨 Customization

### 1. Thay đổi màu sắc theme

Chỉnh sửa trong `Toast.css`:

```css
/* Thay đổi màu border */
.toast-message {
  border-left: 4px solid #your-color;
}

/* Thay đổi màu gradient background */
.toast-message {
  background: linear-gradient(135deg, #color1 0%, #color2 100%);
}

/* Thay đổi màu progress bar */
.toast-progress-fill {
  background: linear-gradient(90deg, #color1 0%, #color2 100%);
}
```

### 2. Thay đổi animation

```css
/* Tốc độ animation */
.toast {
  animation: slideInRight 0.5s ease-out; /* Chậm hơn */
}

/* Kiểu animation khác */
@keyframes slideInBottom {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### 3. Thay đổi kích thước

```css
.toast {
  min-width: 280px;  /* Nhỏ hơn */
  max-width: 350px;  /* Nhỏ hơn */
}

.toast-avatar {
  width: 40px;   /* Nhỏ hơn */
  height: 40px;
}
```

### 4. Custom âm thanh

Trong `notifications.js`:

```javascript
export const playCustomSound = (frequency = 800) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency; // Thay đổi tần số
    oscillator.type = 'sine'; // 'sine', 'square', 'triangle', 'sawtooth'
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.warn('Could not play sound:', error);
  }
};
```

---

## 📚 API Reference

### `showMessageToast(options)`

Hiển thị toast thông báo tin nhắn mới.

**Parameters:**
```typescript
{
  senderName: string;        // Tên người gửi (required)
  senderAvatar?: string;     // URL avatar (optional)
  message: string;           // Nội dung tin nhắn (required)
  onClick?: () => void;      // Callback khi click vào toast (optional)
}
```

**Returns:** `string` - ID của toast

**Example:**
```javascript
const toastId = showMessageToast({
  senderName: 'John Doe',
  message: 'Hello there!',
  onClick: () => console.log('Toast clicked!')
});
```

---

### `showToast(title, message, options)`

Hiển thị toast với nhiều tùy chọn hơn.

**Parameters:**
```typescript
title: string;           // Tiêu đề toast
message: string;         // Nội dung
options?: {
  variant?: 'message' | 'success' | 'error';  // Kiểu toast
  category?: string;     // Phân loại
  senderName?: string;   // Tên người gửi
  senderAvatar?: string; // Avatar
  timestamp?: Date;      // Thời gian
  onClick?: () => void;  // Callback click
  duration?: number;     // Thời gian hiển thị (ms)
  playSound?: boolean;   // Phát âm thanh
}
```

**Example:**
```javascript
showToast('Success', 'Message sent!', {
  variant: 'success',
  duration: 5000
});
```

---

### `closeToast(id)`

Đóng một toast cụ thể.

**Parameters:**
- `id: string` - ID của toast cần đóng

**Example:**
```javascript
const toastId = showMessageToast({...});
setTimeout(() => closeToast(toastId), 3000);
```

---

### ToastContainer Props

**Props:**
```typescript
{
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  duration?: number;        // Thời gian hiển thị mặc định (ms)
  maxToasts?: number;       // Số toast tối đa hiển thị cùng lúc
}
```

**Example:**
```jsx
<ToastContainer 
  position="bottom-right"
  duration={7000}
  maxToasts={5}
/>
```

---

## 🧪 Testing

### Test thủ công:

```javascript
// Trong browser console
import { showMessageToast } from './services/notifications';

// Test 1: Toast cơ bản
showMessageToast({
  senderName: 'Test User',
  message: 'This is a test message!'
});

// Test 2: Toast với avatar
showMessageToast({
  senderName: 'John Doe',
  senderAvatar: 'https://i.pravatar.cc/150?img=1',
  message: 'Hello with avatar!'
});

// Test 3: Toast với click handler
showMessageToast({
  senderName: 'Jane',
  message: 'Click me!',
  onClick: () => alert('Toast clicked!')
});

// Test 4: Multiple toasts
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    showMessageToast({
      senderName: `User ${i + 1}`,
      message: `Message ${i + 1}`
    });
  }, i * 1000);
}
```

---

## 🐛 Troubleshooting

### Toast không hiển thị?

1. Kiểm tra `toastEnabled` trong settings:
```javascript
console.log(localStorage.getItem('toastEnabled'));
```

2. Kiểm tra ToastContainer đã được thêm vào App:
```jsx
<ToastContainer />
```

3. Kiểm tra import đúng:
```javascript
import { showMessageToast } from './services/notifications';
```

### Âm thanh không phát?

1. Kiểm tra cài đặt âm thanh:
```javascript
import { isSoundEnabled } from './services/notifications';
console.log('Sound enabled:', isSoundEnabled());
```

2. Kiểm tra quyền browser (một số browser chặn autoplay audio)

### Toast bị che khuất?

1. Kiểm tra z-index trong CSS:
```css
.toast-container {
  z-index: 9999; /* Đảm bảo cao nhất */
}
```

2. Thay đổi vị trí:
```javascript
<ToastContainer position="top-right" />
```

---

## 📱 Mobile Support

Toast notifications được tối ưu cho mobile:

- Responsive width (280px trên mobile)
- Touch-friendly buttons
- Smaller avatar (40px)
- Adjusted font sizes
- Safe margins (8px từ edges)

---

## 🎯 Best Practices

1. **Không spam toast** - Giới hạn số lượng toast hiển thị
2. **Tin nhắn ngắn gọn** - Tối đa 100 ký tự
3. **Thời gian hợp lý** - 5-10 giây là tốt nhất
4. **Có thể đóng thủ công** - Luôn có nút đóng
5. **Không che khuất nội dung** - Sử dụng góc màn hình
6. **Accessibility** - Sử dụng ARIA labels
7. **Performance** - Giới hạn số toast, cleanup timers

---

## 📝 Notes

- Toast sử dụng localStorage để lưu cài đặt người dùng
- Tự động fallback nếu browser không hỗ trợ Web Audio API
- Hỗ trợ dark mode thông qua `[data-theme="dark"]`
- Animation sử dụng CSS transitions cho performance tốt
- Click outside không đóng toast (chỉ auto-dismiss hoặc click X)

---

## 🔗 Related Files

- [`ToastNotification.js`](./client/src/components/Notifications/ToastNotification.js) - Component toast mới
- [`ToastContainer.js`](./client/src/components/Notifications/ToastContainer.js) - Container quản lý
- [`Toast.js`](./client/src/components/Notifications/Toast.js) - Component hiển thị
- [`Toast.css`](./client/src/styles/Toast.css) - Styles
- [`notifications.js`](./client/src/services/notifications.js) - Service
- [`NotificationSettings.js`](./client/src/components/Settings/components/NotificationSettings.js) - Cài đặt

---

## 📄 License

Phần này là một phần của dự án Chat App.

---

**Cập nhật lần cuối:** 18/11/2025

**Người tạo:** GitHub Copilot

**Version:** 1.0.0
