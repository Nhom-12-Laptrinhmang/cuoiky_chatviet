import React, { useState } from 'react';

/**
 * MessageBubble - Hiển thị một tin nhắn (sent hoặc received)
 * Props: { message, isSent, onReply, onReaction }
 */
const MessageBubble = ({ message, isSent, onReply, onReaction }) => {
  const [showActions, setShowActions] = useState(false);

  const emoticons = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

  return (
    <div className={`message-bubble ${isSent ? 'sent' : 'received'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Show quoted message if this is a reply */}
      {message.reply_to_id && (
        <div style={{
          background: '#f0f0f0',
          padding: '6px 8px',
          borderLeft: '3px solid #0b5ed7',
          marginBottom: '6px',
          fontSize: '12px',
          color: '#666',
        }}>
          Trả lời tin nhắn
        </div>
      )}

      <div className="message-content">
        <p>{message.content}</p>
        <span className="message-time">
          {new Date(message.timestamp).toLocaleTimeString('vi-VN')}
        </span>
      </div>

      {/* Show reactions if any */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div style={{ marginTop: '4px', fontSize: '14px' }}>
          {Object.entries(message.reactions).map(([emoji, users]) => (
            <span key={emoji} style={{ marginRight: '4px' }}>
              {emoji}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      {showActions && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '0',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '6px',
          display: 'flex',
          gap: '4px',
          padding: '4px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}>
          {/* Reaction picker */}
          {emoticons.map((emoji) => (
            <button
              key={emoji}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '2px 4px',
              }}
              onClick={() => {
                if (onReaction) onReaction(message.id, emoji);
                setShowActions(false);
              }}
            >
              {emoji}
            </button>
          ))}

          {/* Reply button */}
          <button
            style={{
              background: '#0b5ed7',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onClick={() => {
              if (onReply) onReply(message);
              setShowActions(false);
            }}
          >
            ↩️
          </button>

          {/* Forward button */}
          <button
            style={{
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
            onClick={() => {
              alert('Chuyển tiếp: ' + message.content);
              setShowActions(false);
            }}
          >
            ⬆️
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
