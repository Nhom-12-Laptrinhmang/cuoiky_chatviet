import React from 'react';

const Toast = ({ toast, onClose }) => {
  const { title, message } = toast;
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
