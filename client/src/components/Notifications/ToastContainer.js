import React, { useEffect, useState, useRef } from 'react';
import { 
  subscribeNotifications, 
  closeToast as closeToastService, 
  playSound, 
  isSoundEnabled,
  getNotificationMode,
  isGroupingEnabled,
  NOTIFICATION_MODES
} from '../../services/notifications';
import Toast from './Toast';

const ToastContainer = ({ position: defaultPosition = 'bottom-right', duration: defaultDuration = 7000, maxToasts: defaultMaxToasts = 5 }) => {
  const [currentToast, setCurrentToast] = useState(null); // Toast đang hiển thị
  const [toastQueue, setToastQueue] = useState([]); // Hàng đợi toast
  const [notificationMode, setNotificationMode] = useState(NOTIFICATION_MODES.SINGLE_LATEST);
  const [groupingEnabled, setGroupingEnabledState] = useState(true);
  const autoCloseTimerRef = useRef(null);
  
  const [settings, setSettings] = useState({
    position: defaultPosition,
    duration: defaultDuration,
    maxToasts: defaultMaxToasts,
    soundEnabled: true
  });

  // Load settings và notification mode từ localStorage
  useEffect(() => {
    try {
      const settingsStr = localStorage.getItem('settings_notifications');
      if (settingsStr) {
        const notifSettings = JSON.parse(settingsStr);
        setSettings({
          position: notifSettings.toastPosition || defaultPosition,
          duration: notifSettings.toastDuration || defaultDuration,
          maxToasts: notifSettings.toastMaxCount || defaultMaxToasts,
          soundEnabled: notifSettings.toastSound !== false
        });
      }
      
      // Load notification mode
      setNotificationMode(getNotificationMode());
      setGroupingEnabledState(isGroupingEnabled());
    } catch (e) {
      console.warn('[ToastContainer] Could not load settings:', e);
    }
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'settings_notifications') {
        try {
          const notifSettings = JSON.parse(e.newValue || '{}');
          setSettings({
            position: notifSettings.toastPosition || defaultPosition,
            duration: notifSettings.toastDuration || defaultDuration,
            maxToasts: notifSettings.toastMaxCount || defaultMaxToasts,
            soundEnabled: notifSettings.toastSound !== false
          });
        } catch (err) {
          console.warn('[ToastContainer] Error parsing settings:', err);
        }
      }
    };

    const handleSettingsChanged = () => {
      try {
        const settingsStr = localStorage.getItem('settings_notifications');
        if (settingsStr) {
          const notifSettings = JSON.parse(settingsStr);
          setSettings({
            position: notifSettings.toastPosition || defaultPosition,
            duration: notifSettings.toastDuration || defaultDuration,
            maxToasts: notifSettings.toastMaxCount || defaultMaxToasts,
            soundEnabled: notifSettings.toastSound !== false
          });
        }
      } catch (err) {
        console.warn('[ToastContainer] Error loading settings:', err);
      }
    };

    const handleModeChanged = () => {
      setNotificationMode(getNotificationMode());
      setGroupingEnabledState(isGroupingEnabled());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsChanged', handleSettingsChanged);
    window.addEventListener('notificationModeChanged', handleModeChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsChanged', handleSettingsChanged);
      window.removeEventListener('notificationModeChanged', handleModeChanged);
    };
  }, []);

  // Helper function để hiển thị toast và play sound
  const displayToast = (toast) => {
    // Play sound nếu enabled
    try {
      if (toast && toast.category === 'message' && settings.soundEnabled && isSoundEnabled()) {
        playSound('receive');
      }
    } catch (e) {}
    
    // Clear timer cũ nếu có
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    
    // Set toast hiện tại
    setCurrentToast(toast);
    
    // Tự động đóng sau duration
    if (settings.duration > 0) {
      autoCloseTimerRef.current = setTimeout(() => {
        closeToast(toast.id);
      }, settings.duration);
    }
  };

  // Subscribe to notifications
  useEffect(() => {
    const unsub = subscribeNotifications((evt) => {
      if (evt.type === 'add') {
        const toast = evt.toast;
        
        // Xử lý theo mode
        if (notificationMode === NOTIFICATION_MODES.SINGLE_LATEST) {
          // ===== CHỨC NĂNG MỚI: Chỉ hiển thị 1 thông báo mới nhất =====
          // Kiểm tra có nên nhóm thông báo theo người gửi không
          if (groupingEnabled && currentToast && currentToast.groupKey === toast.groupKey) {
            // Cùng người gửi -> thay thế toast cũ bằng toast mới
            displayToast(toast);
          } else {
            // Khác người gửi hoặc không nhóm -> đóng toast cũ và hiển thị toast mới
            if (currentToast) {
              // Đóng toast cũ ngay lập tức
              setCurrentToast(null);
              // Sau 100ms hiển thị toast mới (để có animation mượt)
              setTimeout(() => {
                displayToast(toast);
              }, 100);
            } else {
              // Không có toast cũ -> hiển thị ngay
              displayToast(toast);
            }
          }
        } else if (notificationMode === NOTIFICATION_MODES.QUEUE) {
          // Chế độ hàng đợi: hiển thị từng toast lần lượt
          setCurrentToast((current) => {
            if (current) {
              // Có toast đang hiển thị, thêm vào queue
              setToastQueue((prev) => [...prev, toast]);
              return current;
            } else {
              // Không có toast, hiển thị ngay
              displayToast(toast);
              return toast;
            }
          });
        } else if (notificationMode === NOTIFICATION_MODES.MULTIPLE) {
          // Chế độ nhiều toast: cho phép hiển thị nhiều cùng lúc
          setToastQueue((prev) => [...prev, toast]);
          if (!currentToast) {
            displayToast(toast);
          }
        }
      } else if (evt.type === 'remove') {
        setCurrentToast((current) => {
          if (current && current.id === evt.id) {
            return null;
          }
          return current;
        });
        // Xóa khỏi queue nếu có
        setToastQueue((prev) => prev.filter((t) => t.id !== evt.id));
      }
    });
    return unsub;
  }, [settings, notificationMode, groupingEnabled, currentToast]);

  // Hiển thị toast tiếp theo từ queue khi toast hiện tại đóng (chỉ cho QUEUE mode)
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0 && notificationMode === NOTIFICATION_MODES.QUEUE) {
      // Lấy toast mới nhất (cuối cùng trong queue)
      const nextToast = toastQueue[toastQueue.length - 1];
      
      // Xóa toast này khỏi queue
      setToastQueue((prev) => prev.slice(0, -1));
      
      // Hiển thị toast
      displayToast(nextToast);
    }
  }, [currentToast, toastQueue, notificationMode]);

  // Cleanup timer khi unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  const closeToast = (id) => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    
    setCurrentToast((current) => {
      if (current && current.id === id) {
        return null;
      }
      return current;
    });
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
    closeToastService(id);
  };

  const containerStyle = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
    gap: '12px', // Khoảng cách giữa các toast
  };
  
  // Hỗ trợ nhiều vị trí hiển thị
  const getPositionStyle = () => {
    switch(settings.position) {
      case 'top-right':
        return { top: 12, right: 12 };
      case 'top-left':
        return { top: 12, left: 12 };
      case 'bottom-left':
        return { bottom: 12, left: 12 };
      case 'bottom-right':
      default:
        return { bottom: 12, right: 12 };
    }
  };

  return (
    <div style={{ ...containerStyle, ...getPositionStyle() }}>
      {(() => {
        if (notificationMode === NOTIFICATION_MODES.SINGLE_LATEST) {
          // Chế độ single: chỉ hiển thị 1 toast
          return currentToast ? (
            <div 
              key={currentToast.id} 
              onClick={() => {
                try {
                  if (currentToast.onClick && typeof currentToast.onClick === 'function') {
                    currentToast.onClick(currentToast.payload);
                  }
                } catch (e) {}
                closeToast(currentToast.id);
              }} 
              style={{ cursor: currentToast.onClick ? 'pointer' : 'default' }}
            >
              <Toast toast={currentToast} onClose={closeToast} />
            </div>
          ) : null;
        } else if (notificationMode === NOTIFICATION_MODES.QUEUE) {
          // Chế độ queue: hiển thị toast hiện tại
          return currentToast ? (
            <div 
              key={currentToast.id} 
              onClick={() => {
                try {
                  if (currentToast.onClick && typeof currentToast.onClick === 'function') {
                    currentToast.onClick(currentToast.payload);
                  }
                } catch (e) {}
                closeToast(currentToast.id);
              }} 
              style={{ cursor: currentToast.onClick ? 'pointer' : 'default' }}
            >
              <Toast toast={currentToast} onClose={closeToast} />
            </div>
          ) : null;
        } else {
          // Chế độ multiple: hiển thị nhiều toast
          const display = [];
          if (currentToast) display.push(currentToast);
          if (toastQueue && toastQueue.length) {
            display.push(...toastQueue.slice().reverse());
          }
          const sliced = display.slice(0, settings.maxToasts || defaultMaxToasts);
          return sliced.map((t) => (
            <div 
              key={t.id} 
              onClick={() => {
                try {
                  if (t.onClick && typeof t.onClick === 'function') t.onClick(t.payload);
                } catch (e) {}
                closeToast(t.id);
              }} 
              style={{ cursor: t.onClick ? 'pointer' : 'default' }}
            >
              <Toast toast={t} onClose={closeToast} />
            </div>
          ));
        }
      })()}
    </div>
  );
};

export default ToastContainer;
