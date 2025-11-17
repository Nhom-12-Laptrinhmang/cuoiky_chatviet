import React, { useEffect, useState } from 'react';
import { subscribeNotifications, closeToast as closeToastService, playSound, isSoundEnabled } from '../../services/notifications';
import Toast from './Toast';

const ToastContainer = ({ position = 'top-right', duration = 4500 }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribeNotifications((evt) => {
      if (evt.type === 'add') {
        const toast = evt.toast;
        setToasts((prev) => [toast, ...prev]);
        if (toast && duration > 0) {
          setTimeout(() => closeToast(toast.id), duration);
        }
        try {
          // Play sound for message category if enabled (use nicer 'receive' tone)
          if (toast && toast.category === 'message' && isSoundEnabled()) {
            playSound('receive');
          }
        } catch (e) {}
      } else if (evt.type === 'remove') {
        setToasts((prev) => prev.filter((t) => t.id !== evt.id));
      }
    });
    return unsub;
  }, [duration]);

  const closeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    closeToastService(id);
  };

  const containerStyle = {
    position: 'fixed',
    zIndex: 9999,
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: 12,
  };
  const pos = position === 'top-right' ? { top: 12, right: 12 } : position === 'top-left' ? { top: 12, left: 12 } : { bottom: 12, right: 12 };

  return (
    <div style={{ ...containerStyle, ...pos }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => {
          try {
            if (t.onClick && typeof t.onClick === 'function') t.onClick(t.payload);
          } catch (e) {}
          closeToast(t.id);
        }} style={{ cursor: t.onClick ? 'pointer' : 'default' }}>
          <Toast toast={t} onClose={closeToast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
