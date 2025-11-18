# 📝 Hướng Dẫn Thay Đổi Cỡ Chữ (Font Size)

## 🎯 Tổng Quan

Tính năng thay đổi cỡ chữ cho phép người dùng điều chỉnh kích thước text trong toàn bộ ứng dụng theo sở thích cá nhân.

## ✨ Tính Năng

- ✅ 3 kích thước: **Nhỏ (Small)**, **Trung bình (Medium)**, **Lớn (Large)**
- ✅ Áp dụng toàn ứng dụng (Settings, Chat, Messages...)
- ✅ Preview ngay lập tức khi thay đổi
- ✅ Lưu vào localStorage, không cần server
- ✅ Tự động load khi khởi động app

---

## 🚀 Cách Sử Dụng

### 1. Thay Đổi Cỡ Chữ Trong Settings

```
1. Mở Settings (Cài đặt)
2. Chọn tab "General" (Chung)
3. Tìm mục "Display" → "Font Size"
4. Chọn kích thước mong muốn:
   - Small (Nhỏ)
   - Medium (Trung bình - mặc định)
   - Large (Lớn)
5. Cỡ chữ sẽ thay đổi ngay lập tức!
```

### 2. Xem Preview

Ngay dưới phần chọn Font Size sẽ có một box preview hiển thị:
- Text thông thường
- Text tiêu đề lớn hơn

---

## 💻 Sử Dụng Trong Code

### Import Utilities

```javascript
import { 
  applyFontSize, 
  getCurrentFontSize, 
  FONT_SIZES 
} from '../utils/fontSizeUtils';
```

### Lấy Font Size Hiện Tại

```javascript
const currentSize = getCurrentFontSize();
console.log(currentSize); // 'small' | 'medium' | 'large'
```

### Thay Đổi Font Size Programmatically

```javascript
// Chuyển sang Small
applyFontSize(FONT_SIZES.SMALL);

// Chuyển sang Medium
applyFontSize(FONT_SIZES.MEDIUM);

// Chuyển sang Large
applyFontSize(FONT_SIZES.LARGE);
```

### Sử Dụng CSS Variables

```css
/* Trong component của bạn */
.my-text {
  font-size: var(--font-size-base);
}

.my-heading {
  font-size: var(--font-size-h3);
}

.my-small-text {
  font-size: var(--font-size-sm);
}

.my-large-text {
  font-size: var(--font-size-lg);
}
```

### Available CSS Variables

```css
/* Các biến font size có sẵn */
--font-size-xs     /* Extra small: 10-12px */
--font-size-sm     /* Small: 12-14px */
--font-size-base   /* Base: 13-16px */
--font-size-md     /* Medium: 14-17px */
--font-size-lg     /* Large: 15-18px */
--font-size-xl     /* Extra large: 16-20px */
--font-size-2xl    /* 2XL: 18-22px */
--font-size-3xl    /* 3XL: 20-26px */
--font-size-h1     /* Heading 1: 24-32px */
--font-size-h2     /* Heading 2: 20-26px */
--font-size-h3     /* Heading 3: 16-20px */
--font-size-h4     /* Heading 4: 14-18px */
```

---

## 📊 Kích Thước Chi Tiết

### Small (Nhỏ)

```
--font-size-xs: 10px
--font-size-sm: 12px
--font-size-base: 13px
--font-size-md: 14px
--font-size-lg: 15px
--font-size-xl: 16px
--font-size-2xl: 18px
--font-size-3xl: 20px
--font-size-h1: 24px
--font-size-h2: 20px
--font-size-h3: 16px
--font-size-h4: 14px
```

### Medium (Trung bình - Mặc định)

```
--font-size-xs: 11px
--font-size-sm: 13px
--font-size-base: 14px
--font-size-md: 15px
--font-size-lg: 16px
--font-size-xl: 18px
--font-size-2xl: 20px
--font-size-3xl: 24px
--font-size-h1: 28px
--font-size-h2: 22px
--font-size-h3: 18px
--font-size-h4: 16px
```

### Large (Lớn)

```
--font-size-xs: 12px
--font-size-sm: 14px
--font-size-base: 16px
--font-size-md: 17px
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 22px
--font-size-3xl: 26px
--font-size-h1: 32px
--font-size-h2: 26px
--font-size-h3: 20px
--font-size-h4: 18px
```

---

## 🎨 Styling Component

### Ví Dụ 1: Chat Message

```jsx
function ChatMessage({ text, sender }) {
  return (
    <div className="message-bubble">
      <div className="message-sender" style={{ fontSize: 'var(--font-size-sm)' }}>
        {sender}
      </div>
      <div className="message-text" style={{ fontSize: 'var(--font-size-base)' }}>
        {text}
      </div>
      <div className="message-time" style={{ fontSize: 'var(--font-size-xs)' }}>
        {time}
      </div>
    </div>
  );
}
```

### Ví Dụ 2: Settings Item

```jsx
function SettingItem({ label, description }) {
  return (
    <div className="setting-item">
      <div className="setting-info">
        <div className="setting-label">
          {/* Font size tự động từ CSS: var(--font-size-md) */}
          {label}
        </div>
        <div className="setting-description">
          {/* Font size tự động từ CSS: var(--font-size-sm) */}
          {description}
        </div>
      </div>
    </div>
  );
}
```

### Ví Dụ 3: Custom Component

```css
/* styles.css */
.my-component {
  font-size: var(--font-size-base);
}

.my-component .title {
  font-size: var(--font-size-h3);
  font-weight: 600;
}

.my-component .subtitle {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
}

.my-component .description {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}
```

---

## 🔧 API Reference

### Functions

#### `getCurrentFontSize()`

Lấy font size hiện tại từ localStorage.

**Returns:** `'small' | 'medium' | 'large'`

**Example:**
```javascript
const size = getCurrentFontSize();
if (size === 'large') {
  console.log('User prefers large text');
}
```

---

#### `applyFontSize(size)`

Áp dụng font size mới vào toàn ứng dụng.

**Parameters:**
- `size` (string): `'small'` | `'medium'` | `'large'`

**Returns:** `void`

**Example:**
```javascript
applyFontSize('large');
// Font size thay đổi ngay lập tức
```

---

#### `initializeFontSize()`

Khởi tạo font size khi app load. Tự động được gọi trong `App.js`.

**Returns:** `void`

**Example:**
```javascript
// Trong App.js
useEffect(() => {
  initializeFontSize();
}, []);
```

---

#### `getFontSizeLabel(size)`

Lấy label hiển thị cho font size.

**Parameters:**
- `size` (string): Font size value

**Returns:** `string`

**Example:**
```javascript
getFontSizeLabel('small');  // 'Nhỏ (Small)'
getFontSizeLabel('medium'); // 'Trung bình (Medium)'
getFontSizeLabel('large');  // 'Lớn (Large)'
```

---

### Constants

#### `FONT_SIZES`

Object chứa các giá trị font size hợp lệ.

```javascript
{
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
}
```

**Example:**
```javascript
import { FONT_SIZES } from '../utils/fontSizeUtils';

// Sử dụng constants thay vì hardcode string
applyFontSize(FONT_SIZES.LARGE);
```

---

### Events

#### `fontSizeChanged`

Custom event được trigger khi font size thay đổi.

**Event Detail:**
```javascript
{
  size: 'small' | 'medium' | 'large'
}
```

**Example:**
```javascript
// Listen for font size changes
window.addEventListener('fontSizeChanged', (e) => {
  console.log('New font size:', e.detail.size);
  // Update your component if needed
});
```

---

## 🗂️ File Structure

```
client/
├── src/
│   ├── App.js                          # Initialize font size
│   ├── utils/
│   │   └── fontSizeUtils.js           # Font size utilities
│   ├── styles/
│   │   └── theme.css                  # Font size CSS variables
│   ├── components/
│   │   └── Settings/
│   │       ├── components/
│   │       │   └── GeneralSettings.js  # Font size UI
│   │       ├── styles/
│   │       │   └── settings.css       # Font size styles
│   │       └── services/
│   │           └── settingsService.js  # Save/load settings
```

---

## 💡 Best Practices

### 1. Luôn Sử Dụng CSS Variables

✅ **Đúng:**
```css
.my-text {
  font-size: var(--font-size-base);
}
```

❌ **Sai:**
```css
.my-text {
  font-size: 14px; /* Hard-coded, không thay đổi */
}
```

---

### 2. Chọn Variable Phù Hợp

- **Body text:** `--font-size-base`
- **Labels:** `--font-size-md`
- **Descriptions:** `--font-size-sm`
- **Timestamps:** `--font-size-xs`
- **Headings:** `--font-size-h1`, `--font-size-h2`, etc.

---

### 3. Test Với Tất Cả Kích Thước

Đảm bảo UI của bạn trông tốt với:
- Small (10-15px)
- Medium (11-16px)
- Large (12-18px)

---

### 4. Tránh Hard-code Font Sizes

```javascript
// ❌ Sai
<div style={{ fontSize: '14px' }}>Text</div>

// ✅ Đúng
<div style={{ fontSize: 'var(--font-size-base)' }}>Text</div>
```

---

## 🐛 Troubleshooting

### Vấn Đề 1: Font Size Không Thay Đổi

**Nguyên nhân:** CSS không sử dụng variables

**Giải pháp:**
```css
/* Thay thế hard-coded values */
.my-text {
  /* font-size: 14px; ❌ */
  font-size: var(--font-size-base); /* ✅ */
}
```

---

### Vấn Đề 2: Font Size Reset Sau Khi Reload

**Nguyên nhân:** `initializeFontSize()` chưa được gọi

**Giải pháp:**
```javascript
// Trong App.js
import { initializeFontSize } from './utils/fontSizeUtils';

useEffect(() => {
  initializeFontSize();
}, []);
```

---

### Vấn Đề 3: Settings Không Sync

**Nguyên nhân:** Font size không được save vào settings

**Giải pháp:**
```javascript
// Trong GeneralSettings.js
if (key === 'fontSize') {
  applyFontSize(value);
}
```

---

## 📱 Responsive Design

Font sizes tự động điều chỉnh theo viewport. Bạn có thể thêm media queries nếu cần:

```css
/* Desktop */
@media (min-width: 1024px) {
  body.font-size-large {
    --font-size-base: 18px;
  }
}

/* Mobile */
@media (max-width: 768px) {
  body.font-size-large {
    --font-size-base: 16px;
  }
}
```

---

## ✅ Checklist

Khi thêm component mới, đảm bảo:

- [ ] Sử dụng CSS variables thay vì hard-coded values
- [ ] Test với cả 3 font sizes (small, medium, large)
- [ ] Đảm bảo layout không bị vỡ với text lớn
- [ ] Đảm bảo text nhỏ vẫn đọc được
- [ ] Component responsive với font size khác nhau

---

## 🎓 Kết Luận

Tính năng thay đổi cỡ chữ giúp:
- ✅ Cải thiện accessibility
- ✅ Tăng trải nghiệm người dùng
- ✅ Hỗ trợ người dùng có vấn đề về thị lực
- ✅ Tùy chỉnh cá nhân hóa

**Version:** 1.0  
**Last Updated:** November 19, 2025
