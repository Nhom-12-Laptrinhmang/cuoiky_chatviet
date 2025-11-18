// Settings Service - LocalStorage-based (Offline-first, no server changes needed)

// ===== MOCK DATA & DEFAULTS =====
const DEFAULT_SETTINGS = {
  general: {
    language: 'en',
    timezone: 'UTC',
    theme: 'auto',
    autoDownloadMedia: true,
    saveToGallery: false,
    fontSize: 'medium'
  },
  privacy: {
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    about: 'everyone',
    status: 'everyone',
    readReceipts: true,
    groupsAddMe: 'everyone',
    blockedContacts: []
  },
  security: {
    twoFactorEnabled: false,
    endToEndEncryption: true,
    sessionTimeout: 30,
    loginAlerts: true,
    activeSessions: [
      {
        id: 'current',
        device: 'Chrome on Windows',
        location: 'Hanoi, Vietnam',
        lastActive: new Date().toISOString(),
        isCurrent: true
      }
    ]
  },
  notifications: {
    messageNotifications: true,
    messageSound: true,
    messageVibrate: true,
    groupNotifications: true,
    groupSound: true,
    callNotifications: true,
    callRingtone: 'default',
    showPreview: true,
    notificationLight: true,
    soundEnabled: true,
    vibrationEnabled: true,
    notificationPreview: 'name-message',
    customSounds: false,
    // Toast notification settings
    toastEnabled: true,
    toastPosition: 'bottom-right',
    toastDuration: 7000,
    toastSound: true,
    toastMaxCount: 5
  },
  calls: {
    audioInput: 'default',
    audioOutput: 'default',
    videoQuality: 'auto',
    dataSaving: false,
    callWaiting: true,
    videoByDefault: false
  },
  appearance: {
    darkMode: 'auto',
    chatWallpaper: 'default',
    bubbleStyle: 'rounded',
    fontSize: 'medium',
    compactMode: false
  }
};

// Helper to get settings from localStorage with defaults
const getLocalSettings = (category) => {
  const key = `settings_${category}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored settings:', e);
    }
  }
  return DEFAULT_SETTINGS[category];
};

// Helper to save settings to localStorage
const saveLocalSettings = (category, settings) => {
  const key = `settings_${category}`;
  localStorage.setItem(key, JSON.stringify(settings));
  return settings;
};


// ===== GENERAL SETTINGS =====
export const getGeneralSettings = async () => {
  console.log('✅ getGeneralSettings - Using localStorage (no server API)');
  await new Promise(resolve => setTimeout(resolve, 100));
  const data = getLocalSettings('general');
  console.log('📦 General settings:', data);
  return data;
};

export const updateGeneralSettings = async (settings) => {
  console.log('✅ updateGeneralSettings - Saving to localStorage:', settings);
  await new Promise(resolve => setTimeout(resolve, 100));
  const current = getLocalSettings('general');
  const updated = saveLocalSettings('general', { ...current, ...settings });
  console.log('💾 Settings saved successfully:', updated);
  return updated;
};

// ===== PRIVACY SETTINGS =====
export const getPrivacySettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getLocalSettings('privacy');
};

export const updatePrivacySettings = async (settings) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const current = getLocalSettings('privacy');
  return saveLocalSettings('privacy', { ...current, ...settings });
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  // Mock password change - in real app would validate and update
  return { success: true, message: 'Password updated successfully' };
};

export const enable2FA = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const current = getLocalSettings('security');
  return saveLocalSettings('security', { ...current, twoFactorEnabled: true });
};

export const disable2FA = async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const current = getLocalSettings('security');
  return saveLocalSettings('security', { ...current, twoFactorEnabled: false });
};

export const getSessions = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const security = getLocalSettings('security');
  return security.activeSessions || [];
};

// Compatibility helpers: provide getSecuritySettings / updateSecuritySettings
// because some UI imports expect those names.
export const getSecuritySettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 50));
  const security = getLocalSettings('security') || {};
  return {
    sessions: security.activeSessions || [],
    twoFactorEnabled: !!security.twoFactorEnabled,
    endToEndEncryption: !!security.endToEndEncryption
  };
};

export const updateSecuritySettings = async (settings) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  // Support toggling 2FA via existing helpers
  if (Object.prototype.hasOwnProperty.call(settings, 'twoFactorEnabled')) {
    if (settings.twoFactorEnabled) {
      await enable2FA();
    } else {
      await disable2FA();
    }
  }

  // Merge any other provided security settings into localStorage
  const current = getLocalSettings('security');
  const updated = saveLocalSettings('security', { ...current, ...settings });
  return {
    sessions: updated.activeSessions || [],
    twoFactorEnabled: !!updated.twoFactorEnabled,
    endToEndEncryption: !!updated.endToEndEncryption
  };
};

// ===== NOTIFICATION SETTINGS =====
export const getNotificationSettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getLocalSettings('notifications');
};

export const updateNotificationSettings = async (settings) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const current = getLocalSettings('notifications');
  return saveLocalSettings('notifications', { ...current, ...settings });
};

// ===== CALL SETTINGS =====
export const getCallSettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getLocalSettings('calls');
};

export const updateCallSettings = async (settings) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const current = getLocalSettings('calls');
  return saveLocalSettings('calls', { ...current, ...settings });
};

// ===== APPEARANCE SETTINGS =====
export const getAppearanceSettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getLocalSettings('appearance');
};

export const updateAppearanceSettings = async (settings) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const current = getLocalSettings('appearance');
  return saveLocalSettings('appearance', { ...current, ...settings });
};

// ===== HELPER: CHECK IF NOTIFICATIONS ARE ENABLED =====
export const isNotificationEnabled = (type = 'message') => {
  try {
    const settings = getLocalSettings('notifications');
    
    switch(type) {
      case 'message':
        return settings?.messageNotifications !== false && settings?.toastEnabled !== false;
      case 'group':
        return settings?.groupNotifications !== false;
      case 'call':
        return settings?.callNotifications !== false;
      case 'toast':
        return settings?.toastEnabled !== false;
      default:
        return true;
    }
  } catch (e) {
    console.error('Error checking notification settings:', e);
    return true; // Default to enabled if error
  }
};
