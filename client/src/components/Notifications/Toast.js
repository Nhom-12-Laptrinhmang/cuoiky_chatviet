import React, { useEffect, useState } from 'react';
import '../../styles/Toast.css';

const Toast = ({ toast, onClose }) => {
  const { 
    title, 
    message, 
    variant, 
    icon, 
    senderName: toastSenderName, 
    senderAvatar: toastSenderAvatar, 
    timestamp, 
    duration = 7000 
  } = toast;
  
  // Ưu tiên lấy từ toast props, fallback về title nếu là tin nhắn
  const senderName = toastSenderName || (variant === 'message' ? title : null);
  const senderAvatar = toastSenderAvatar;
  
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animation cho progress bar
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} phút trước`;
    }
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const truncateMessage = (msg) => {
    if (!msg) return '';
    if (msg.length <= 100) return msg;
    return msg.substring(0, 97) + '...';
  };

  // Toast cho tin nhắn (với avatar và thông tin người gửi)
  if (variant === 'message' || senderName) {
    return (
      <div className="toast toast-message">
        <button 
          className="toast-close" 
          onClick={() => onClose(toast.id)}
          aria-label="Đóng thông báo"
        >
          ×
        </button>

        <div className="toast-content">
          <div className="toast-avatar">
            {senderAvatar ? (
              <img src={senderAvatar} alt={senderName} />
            ) : (
              <div className="toast-avatar-placeholder">
                {senderName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          <div className="toast-details">
            <div className="toast-header">
              <span className="toast-sender">{senderName || 'Unknown'}</span>
              {timestamp && <span className="toast-time">{formatTime(timestamp)}</span>}
            </div>
            <div className="toast-message-text">
              {truncateMessage(message || title)}
            </div>
          </div>
        </div>

        <div className="toast-progress-bar">
          <div 
            className="toast-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'success') {
    return (
      <div style={{
        background: '#ecfdf5',
        color: '#065f46',
        padding: '12px 16px',
        borderRadius: 10,
        boxShadow: '0 8px 20px rgba(6,95,70,0.08)',
        marginBottom: 10,
        minWidth: 300,
        maxWidth: 480,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:22,background:'#10b981',color:'#fff',fontSize:18,fontWeight:700,boxShadow:'inset 0 -2px 0 rgba(0,0,0,0.06)'}}>{icon || '✓'}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700, marginBottom:4}}>{title || 'Thành công'}</div>
          {message ? <div style={{fontSize:13,color:'#064e3b'}}>{message}</div> : null}
        </div>
        <button onClick={() => onClose(toast.id)} style={{ marginLeft: 8, background: 'transparent', border: 'none', color: '#065f46', cursor: 'pointer', fontSize:16 }}>✕</button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(30,30,30,0.95)',
      color: 'white',
      padding: '10px 14px',
      borderRadius: 8,
      boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
      marginBottom: 10,
      minWidth: 260,
      maxWidth: 420,
      fontSize: 13,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 14 }}>{title}</strong>
        <button onClick={() => onClose(toast.id)} style={{ marginLeft: 8, background: 'transparent', border: 'none', color: '#ddd', cursor: 'pointer' }}>✕</button>
      </div>
      {message ? <div style={{ marginTop: 6 }}>{message}</div> : null}
    </div>
  );
};

export default Toast;
