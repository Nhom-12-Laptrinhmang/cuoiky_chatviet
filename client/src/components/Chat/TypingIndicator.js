import React from 'react';

/**
 * TypingIndicator - Hiển thị "người dùng đang gõ..."
 * Props: { userName, isTyping }
 */
const TypingIndicator = ({ userName, isTyping }) => {
  if (!isTyping) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 0',
      color: '#999',
      fontSize: '13px',
      fontStyle: 'italic',
    }}>
      <div className="typing-dots" style={{
        display: 'flex',
        gap: '3px',
      }}>
        <span className="dot" style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: '#999',
          animation: 'typing 1.4s infinite',
        }}></span>
        <span className="dot" style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: '#999',
          animation: 'typing 1.4s infinite 0.2s',
        }}></span>
        <span className="dot" style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: '#999',
          animation: 'typing 1.4s infinite 0.4s',
        }}></span>
      </div>
      <span>{userName || 'Người dùng'} đang gõ...</span>

      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
