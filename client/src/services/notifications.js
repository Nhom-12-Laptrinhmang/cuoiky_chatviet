let listeners = [];

// Cấu hình chế độ thông báo
const NOTIFICATION_MODE_KEY = 'notifications_mode';
const NOTIFICATION_GROUP_KEY = 'notifications_group_enabled';

// Các chế độ hiển thị thông báo
export const NOTIFICATION_MODES = {
  SINGLE_LATEST: 'single_latest',    // Chỉ hiển thị 1 thông báo mới nhất (Facebook/Zalo style)
  QUEUE: 'queue',                    // Hiển thị lần lượt từng thông báo
  MULTIPLE: 'multiple'               // Hiển thị nhiều thông báo cùng lúc
};

// Lấy chế độ thông báo hiện tại
export const getNotificationMode = () => {
  try {
    const mode = localStorage.getItem(NOTIFICATION_MODE_KEY);
    return mode || NOTIFICATION_MODES.SINGLE_LATEST; // Mặc định: chỉ hiển thị 1
  } catch (e) {
    return NOTIFICATION_MODES.SINGLE_LATEST;
  }
};

// Đặt chế độ thông báo
export const setNotificationMode = (mode) => {
  try {
    if (Object.values(NOTIFICATION_MODES).includes(mode)) {
      localStorage.setItem(NOTIFICATION_MODE_KEY, mode);
      // Trigger event để ToastContainer cập nhật
      window.dispatchEvent(new CustomEvent('notificationModeChanged', { detail: { mode } }));
    }
  } catch (e) {
    console.error('Cannot set notification mode:', e);
  }
};

// Kiểm tra có nhóm thông báo theo người gửi không
export const isGroupingEnabled = () => {
  try {
    const v = localStorage.getItem(NOTIFICATION_GROUP_KEY);
    if (v === null) return true; // Mặc định: có nhóm
    return v === '1';
  } catch (e) {
    return true;
  }
};

// Bật/tắt nhóm thông báo
export const setGroupingEnabled = (enabled) => {
  try {
    localStorage.setItem(NOTIFICATION_GROUP_KEY, enabled ? '1' : '0');
  } catch (e) {}
};

export const subscribeNotifications = (cb) => {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
};

export const showToast = (title, message, opts = {}) => {
  const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
  
  // Tạo groupKey để nhóm thông báo từ cùng người gửi
  const groupKey = opts.senderId 
    ? `sender_${opts.senderId}` 
    : (opts.groupKey || `generic_${opts.category || 'message'}`);
  
  const toast = { 
    id, 
    title, 
    message, 
    variant: opts.variant || 'message',
    category: opts.category || 'message',
    senderName: opts.senderName,
    senderAvatar: opts.senderAvatar,
    senderId: opts.senderId, // ID người gửi để nhóm
    groupKey,                 // Key để nhóm các thông báo
    timestamp: opts.timestamp || new Date(),
    onClick: opts.onClick,
    ...opts 
  };
  
  listeners.forEach((cb) => {
    try { cb({ type: 'add', toast }); } catch (e) { console.error(e); }
  });
  return id;
};

export const closeToast = (id) => {
  listeners.forEach((cb) => {
    try { cb({ type: 'remove', id }); } catch (e) { console.error(e); }
  });
};

// Show browser/system notification (falls back to no-op if permission denied)
export const showSystemNotification = async (title, body, opts = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') {
      const n = new Notification(title, { body, ...opts });
      return n;
    }
    if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission();
      if (p === 'granted') {
        const n = new Notification(title, { body, ...opts });
        return n;
      }
    }
  } catch (e) {
    console.error('System notification failed', e);
  }
};

// Notification sound handling
const SOUND_ENABLED_KEY = 'notifications_sound_enabled';
const SOUND_VOLUME_KEY = 'notifications_sound_volume';

// We synthesize short chime sounds via WebAudio for a pleasant tone.
// Fallback to a tiny base64 WAV if AudioContext isn't available.
const DEFAULT_BEEP_BASE64 = 'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

let _audioCtx = null;
const getAudioCtx = () => {
  try {
    if (!_audioCtx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) _audioCtx = new C();
    }
  } catch (e) {
    _audioCtx = null;
  }
  return _audioCtx;
};

export const isSoundEnabled = () => {
  try {
    const v = localStorage.getItem(SOUND_ENABLED_KEY);
    if (v === null) return true; // default on
    return v === '1';
  } catch (e) {
    return true;
  }
};

export const setSoundEnabled = (enabled) => {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? '1' : '0');
  } catch (e) {}
};

export const getSoundVolume = () => {
  try {
    const v = localStorage.getItem(SOUND_VOLUME_KEY);
    if (v === null) return 0.9;
    const n = parseFloat(v);
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n));
  } catch (e) {}
  return 0.9;
};

export const setSoundVolume = (v) => {
  try {
    const n = Math.min(1, Math.max(0, Number(v) || 0));
    localStorage.setItem(SOUND_VOLUME_KEY, String(n));
  } catch (e) {}
};
export const playSound = (type = 'receive', volume = 1) => {
  if (!isSoundEnabled()) return;
  const volPref = getSoundVolume();
  const finalVol = Math.min(1, Math.max(0, (volPref || 0.9) * (Number(volume) || 1)));

  try {
    const ctx = getAudioCtx();
    if (ctx) {
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.connect(ctx.destination);

      // Smooth attack to avoid clicks
      master.gain.exponentialRampToValueAtTime(Math.max(0.001, finalVol * 0.12), now + 0.01);

      // Two slightly detuned oscillators for a pleasant shimmer
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sine';
      o2.type = 'sine';

      if (type === 'send') {
        o1.frequency.setValueAtTime(620, now);
        o2.frequency.setValueAtTime(780, now);
      } else {
        // receive: rising gentle chime
        o1.frequency.setValueAtTime(760, now);
        o2.frequency.setValueAtTime(980, now);
      }

      // small detune for richness
      o2.detune.setValueAtTime(type === 'send' ? -6 : 6, now);

      o1.connect(master);
      o2.connect(master);
      o1.start(now);
      o2.start(now);

      // decay envelope
      master.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'send' ? 0.18 : 0.32));

      // stop oscillators shortly after decay
      setTimeout(() => {
        try { o1.stop(); } catch (e) {}
        try { o2.stop(); } catch (e) {}
      }, Math.round((type === 'send' ? 220 : 360)));
      return;
    }
  } catch (e) {
    // Fall through to audio fallback
  }

  // Fallback: use base64 Audio (play louder by setting volume if possible)
  try {
    const a = new Audio(DEFAULT_BEEP_BASE64);
    a.preload = 'auto';
    a.volume = Math.min(1, finalVol);
    a.play().catch(() => {});
  } catch (e) {
    // ignore
  }
};


export default {
  subscribeNotifications,
  showToast,
  closeToast,
  showSystemNotification,
  playSound,
  isSoundEnabled,
  setSoundEnabled,
  getSoundVolume,
  setSoundVolume,
  getNotificationMode,
  setNotificationMode,
  isGroupingEnabled,
  setGroupingEnabled,
  NOTIFICATION_MODES,
};

// Helper function để hiển thị toast tin nhắn mới
export const showMessageToast = ({ senderName, senderAvatar, senderId, message, onClick }) => {
  // Kiểm tra settings trước khi hiển thị
  try {
    const settingsStr = localStorage.getItem('settings_notifications');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      
      // Kiểm tra messageNotifications và toastEnabled
      if (settings.messageNotifications === false || settings.toastEnabled === false) {
        console.log('[Toast] Notifications disabled in settings');
        return null;
      }
    }
  } catch (e) {
    console.warn('[Toast] Could not check settings:', e);
  }
  
  return showToast(
    senderName,
    message,
    {
      variant: 'message',
      category: 'message',
      senderName,
      senderAvatar,
      senderId,              // Thêm senderId để nhóm thông báo
      timestamp: new Date(),
      onClick
    }
  );
};
