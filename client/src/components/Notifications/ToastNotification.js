import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import '../../styles/ToastNotification.css';

/**
 * ToastNotification Component
 * 
 * Hiển thị một thông báo tin nhắn dạng toast ở góc dưới bên phải màn hình.
 * 
 * Props:
 * - id: ID duy nhất của toast
 * - senderName: Tên người gửi
 * - senderAvatar: URL avatar người gửi
 * - message: Nội dung tin nhắn (tối đa 100 ký tự)
 * - timestamp: Thời gian nhận tin nhắn
 * - onClose: Callback khi đóng toast
 * - onClick: Callback khi click vào toast để mở tin nhắn đầy đủ
 * - duration: Thời gian hiển thị (ms), mặc định 7000ms (7 giây)
 * - position: Vị trí hiển thị (bottom-right, bottom-left, top-right, top-left)
 * - playSound: Có phát âm thanh thông báo không
 */
const ToastNotification = ({
  id,
  senderName,
  senderAvatar,
  message,
  timestamp,
  onClose,
  onClick,
  duration = 7000,
  position = 'bottom-right',
  playSound = true
}) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger animation vào
    setTimeout(() => setIsVisible(true), 10);

    // Phát âm thanh nếu được bật
    if (playSound) {
      playNotificationSound();
    }

    // Tự động đóng sau duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, playSound]);

  const playNotificationSound = () => {
    try {
      // Sử dụng Web Audio API để phát âm thanh nhẹ nhàng
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Thời gian animation
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      handleClose();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Nếu trong vòng 1 phút
    if (diff < 60000) {
      return t('justNow') || 'Vừa xong';
    }
    
    // Nếu trong vòng 1 giờ
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${t('minutesAgo') || 'phút trước'}`;
    }
    
    // Hiển thị giờ:phút
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const truncateMessage = (msg) => {
    if (!msg) return '';
    if (msg.length <= 100) return msg;
    return msg.substring(0, 97) + '...';
  };

  return (
    <div 
      className={`toast-notification ${position} ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      <button 
        className="toast-close-btn"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="Close notification"
      >
        ×
      </button>

      <div className="toast-content">
        <div className="toast-avatar">
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName} />
          ) : (
            <div className="toast-avatar-placeholder">
              {senderName?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="toast-details">
          <div className="toast-header">
            <span className="toast-sender">{senderName}</span>
            <span className="toast-time">{formatTime(timestamp)}</span>
          </div>
          <div className="toast-message">
            {truncateMessage(message)}
          </div>
        </div>
      </div>

      <div className="toast-progress-bar">
        <div 
          className="toast-progress-fill" 
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export default ToastNotification;
