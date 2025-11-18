/**
 * Font Size Utilities
 * Quản lý việc thay đổi cỡ chữ của ứng dụng
 */

const FONT_SIZE_KEY = 'app_font_size';

export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

/**
 * Lấy font size hiện tại từ localStorage
 */
export const getCurrentFontSize = () => {
  try {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    if (stored && Object.values(FONT_SIZES).includes(stored)) {
      return stored;
    }
  } catch (e) {
    console.error('Error reading font size:', e);
  }
  return FONT_SIZES.MEDIUM; // Default
};

/**
 * Apply font size class vào body element
 */
export const applyFontSize = (size) => {
  if (!Object.values(FONT_SIZES).includes(size)) {
    console.warn('Invalid font size:', size);
    return;
  }

  // Remove all font-size classes
  document.body.classList.remove(
    'font-size-small',
    'font-size-medium',
    'font-size-large'
  );

  // Add new font-size class
  document.body.classList.add(`font-size-${size}`);

  // Save to localStorage
  try {
    localStorage.setItem(FONT_SIZE_KEY, size);
  } catch (e) {
    console.error('Error saving font size:', e);
  }

  // Dispatch event để các component khác biết font size đã thay đổi
  window.dispatchEvent(new CustomEvent('fontSizeChanged', { detail: { size } }));
};

/**
 * Initialize font size khi app khởi động
 */
export const initializeFontSize = () => {
  const currentSize = getCurrentFontSize();
  applyFontSize(currentSize);
};

/**
 * Get font size label cho UI
 */
export const getFontSizeLabel = (size) => {
  const labels = {
    [FONT_SIZES.SMALL]: 'Nhỏ (Small)',
    [FONT_SIZES.MEDIUM]: 'Trung bình (Medium)',
    [FONT_SIZES.LARGE]: 'Lớn (Large)'
  };
  return labels[size] || size;
};

export default {
  FONT_SIZES,
  getCurrentFontSize,
  applyFontSize,
  initializeFontSize,
  getFontSizeLabel
};
