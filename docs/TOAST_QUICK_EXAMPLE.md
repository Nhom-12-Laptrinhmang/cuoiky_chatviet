# Toast Notification - Quick Example

## Ví dụ nhanh để test thông báo toast

### 1. Trong component Chat hoặc App.js

```javascript
import React, { useEffect } from 'react';
import { showMessageToast } from './services/notifications';

// Ví dụ 1: Hiển thị toast đơn giản
const handleTestToast = () => {
  showMessageToast({
    senderName: 'Nguyễn Văn A',
    senderAvatar: 'https://i.pravatar.cc/150?img=1',
    message: 'Xin chào! Đây là tin nhắn test thông báo popup.',
    onClick: () => {
      alert('Bạn đã click vào thông báo!');
    }
  });
};

// Ví dụ 2: Khi nhận tin nhắn từ socket
useEffect(() => {
  socket.on('receive_message', (data) => {
    const { message, sender, conversation } = data;
    
    // Kiểm tra có phải conversation hiện tại không
    if (currentConversationId !== conversation.id) {
      showMessageToast({
        senderName: sender.name,
        senderAvatar: sender.avatar_url,
        message: message.content,
        onClick: () => {
          // Chuyển đến conversation
          setCurrentConversation(conversation.id);
        }
      });
    }
  });
}, [currentConversationId]);

return (
  <div>
    <button onClick={handleTestToast}>
      Test Toast Notification
    </button>
  </div>
);
```

### 2. Thêm ToastContainer vào App.js (CHỈ MỘT LẦN)

```javascript
import React from 'react';
import ToastContainer from './components/Notifications/ToastContainer';

function App() {
  return (
    <div className="App">
      {/* Các component khác */}
      
      {/* Toast container - đặt ở cuối */}
      <ToastContainer 
        position="bottom-right"
        duration={7000}
        maxToasts={5}
      />
    </div>
  );
}
```

### 3. Import CSS trong App.js hoặc index.js

```javascript
import './styles/Toast.css';
```

### 4. Test từ Browser Console

```javascript
// Mở browser console (F12) và chạy:
import { showMessageToast } from './services/notifications';

showMessageToast({
  senderName: 'Test User',
  message: 'This is a test notification!'
});
```

### 5. Test nhiều toast cùng lúc

```javascript
// Trong component
const testMultipleToasts = () => {
  const users = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
  const messages = [
    'Hello there!',
    'How are you?',
    'Check this out!',
    'Important message!',
    'Don\'t forget!'
  ];
  
  users.forEach((user, index) => {
    setTimeout(() => {
      showMessageToast({
        senderName: user,
        senderAvatar: \`https://i.pravatar.cc/150?img=\${index + 1}\`,
        message: messages[index],
        onClick: () => console.log(\`Clicked \${user}'s message\`)
      });
    }, index * 1500); // Delay 1.5s giữa mỗi toast
  });
};

<button onClick={testMultipleToasts}>
  Test Multiple Toasts
</button>
```

## Cài đặt thông báo

Vào **Settings > Notifications > Thông Báo Popup** để tùy chỉnh:

- ✅ Bật/tắt thông báo popup
- ✅ Chọn vị trí (4 góc màn hình)
- ✅ Thời gian hiển thị (3s - 10s)
- ✅ Âm thanh thông báo
- ✅ Số lượng popup tối đa

## Checklist triển khai

- [ ] Import `Toast.css` vào App
- [ ] Thêm `<ToastContainer />` vào App.js
- [ ] Cập nhật socket listener để gọi `showMessageToast()`
- [ ] Test với nút button
- [ ] Test với tin nhắn thật từ socket
- [ ] Kiểm tra responsive trên mobile
- [ ] Kiểm tra dark mode
- [ ] Test cài đặt trong Settings

## Troubleshooting nhanh

**Toast không hiển thị?**
```javascript
// Kiểm tra:
console.log('Toast enabled:', localStorage.getItem('toastEnabled'));
// Nếu là 'false', đổi thành 'true':
localStorage.setItem('toastEnabled', 'true');
```

**Không có âm thanh?**
```javascript
import { isSoundEnabled, setSoundEnabled } from './services/notifications';
console.log(isSoundEnabled());
setSoundEnabled(true);
```

**Vị trí sai?**
```javascript
localStorage.setItem('toastPosition', 'bottom-right');
// Reload lại page
```
