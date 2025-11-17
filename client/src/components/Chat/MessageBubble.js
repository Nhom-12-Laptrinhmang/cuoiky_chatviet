import React, { useState } from 'react';
import { showToast, showSystemNotification } from '../../services/notifications';
import twemoji from 'twemoji';

// ---------------------------------------------------------------------------
// HẰNG SỐ KÍCH THƯỚC CHUNG CHO MESSAGE
// - MESSAGE_STICKER_SIZE: kích thước (px) cho sticker hiển thị trong khung tin
// - STATUS_ICON_FONT_SIZE: kích thước (px) cho icon trạng thái (✓, ✓✓, 👁, ...)
// - STATUS_ICON_MIN_WIDTH: min-width (px) để tránh layout nhảy khi đổi icon
// Thay các hằng số dưới đây để điều chỉnh nhanh giao diện.
// ---------------------------------------------------------------------------
const MESSAGE_STICKER_SIZE = 140; // px (increased so stickers render larger)
const STATUS_ICON_FONT_SIZE = 8; // px (thay nếu muốn nhỏ hơn)
const STATUS_ICON_MIN_WIDTH = 14; // px

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

/**
 * MessageBubble - Hiển thị một tin nhắn (sent hoặc received)
 * Props: { message, isSent, onReply, onReaction }
 */
const MessageBubble = ({ message, isSent, onReply, onReaction, onEmojiHover, onRetry }) => {
  const [showActions, setShowActions] = useState(false);

  // Parse server timestamp robustly and format to local time
  const formatMessageTime = (ts) => {
    if (!ts) return '';
    try {
      // If ts is already a number (ms since epoch), use it directly
      let d;
      if (typeof ts === 'number') {
        d = new Date(ts);
      } else if (typeof ts === 'string') {
        // If timestamp contains timezone info (Z or ±hh:mm), let Date parse it.
        // If it's a naive ISO (e.g. '2025-11-17T12:00:00'), some browsers treat it as local.
        // Our server stores UTC using datetime.utcnow().isoformat() which produces a naive ISO string.
        // To ensure correct local conversion, append 'Z' to force UTC parsing when missing.
  // Put the hyphen inside the character class without escaping to satisfy eslint
  const hasTZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(ts);
        d = new Date(hasTZ ? ts : (ts + 'Z'));
      } else {
        d = new Date(ts);
      }

      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const emoticons = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

  return (
    <div className={`message-bubble ${isSent ? 'sent' : 'received'} ${message.message_type === 'sticker' ? 'sticker-bubble' : ''}`}
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

  <div className={`message-content ${message.message_type === 'sticker' ? 'sticker-content' : ''}`}>
        {message.message_type === 'sticker' ? (
          // Hiển thị sticker: không còn nền bọc, chỉ show ảnh lớn hơn
          <div style={{ display: 'inline-block' }}>
            <img
              src={message.sticker_url}
              alt="sticker"
              // Dùng MESSAGE_STICKER_SIZE ở đầu file để dễ sửa
              style={{
                width: MESSAGE_STICKER_SIZE,
                height: MESSAGE_STICKER_SIZE,
                objectFit: 'contain',
                borderRadius: 0,
                display: 'block',
              }}
            />
          </div>
        ) : message.message_type === 'file' || message.file_url ? (
          // Enhanced file preview with image preview for images
          <div style={{ marginBottom: '8px', maxWidth: '300px' }}>
            {/* Show image preview for image files */}
            {message.file_type && message.file_type.startsWith('image/') && (
              <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={message.file_url}
                  alt={message.file_name || message.content}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'block',
                    cursor: 'pointer',
                  }}
                />
              </a>
            )}
            
            {/* File info card */}
            <div style={{
              background: isSent ? 'rgba(255,255,255,0.1)' : 'rgba(102,126,234,0.1)',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(0,0,0,0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* File icon */}
                <span style={{ fontSize: '24px' }}>
                  {message.file_type && message.file_type.startsWith('image/') ? '🖼️' :
                   message.file_type && message.file_type.startsWith('video/') ? '🎥' :
                   message.file_type && message.file_type.startsWith('audio/') ? '🎵' :
                   message.file_type && message.file_type.includes('pdf') ? '📄' :
                   '📎'}
                </span>
                
                {/* File name and size */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: isSent ? '#fff' : '#667eea',
                      textDecoration: 'none',
                      fontWeight: '500',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {message.file_name || message.content}
                  </a>
                  {message.file_size && (
                    <div style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      marginTop: '2px',
                    }}>
                      {formatFileSize(message.file_size)}
                    </div>
                  )}
                </div>
                
                {/* Download button */}
                <a
                  href={message.file_url}
                  download
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                    textDecoration: 'none',
                  }}
                  title="Tải xuống"
                >
                  ⬇️
                </a>
              </div>
            </div>
          </div>
        ) : (
          // Render text with Twemoji to make emoji consistent across platforms
          <div>
            {(() => {
              const content = message.content || '';
              // Detect if content is only emoji (and optional whitespace)
              let onlyEmojis = false;
              try {
                // Remove common separators and variation selectors
                const stripped = content.replace(/\uFE0F/g, '').replace(/\s+/g, '');
                // Check for any non-emoji characters using Unicode Extended Pictographic property
                const nonEmoji = stripped.replace(/\p{Extended_Pictographic}/gu, '');
                onlyEmojis = stripped.length > 0 && nonEmoji.length === 0;
              } catch (e) {
                onlyEmojis = false;
              }

              if (onlyEmojis) {
                // Count emoji clusters (approximate by matching Extended_Pictographic)
                const matches = (content.match(/\p{Extended_Pictographic}/gu) || []);
                const count = matches.length || 0;
                const single = count === 1;
                const fontSize = single ? 48 : Math.max(20, 48 - count * 6);
                const html = twemoji.parse(content, { folder: 'svg', ext: '.svg' });
                // Add a CSS class so we can size the generated <img> tags reliably
                const cssClass = single ? 'emoji-only single' : 'emoji-only multi';
                return (
                  <div
                    className={cssClass}
                    style={{ fontSize, lineHeight: 1, display: 'inline-block' }}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              }

              return <span dangerouslySetInnerHTML={{ __html: twemoji.parse(content, { folder: 'svg', ext: '.svg' }) }} />;
            })()}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <span className="message-time">
            {formatMessageTime(message.timestamp)}
          </span>
          {/* Show status icon if sent by current user */}
          {isSent && message.status && (
            // Kích thước icon trạng thái dùng hằng số để dễ chỉnh về sau
            <span style={{ fontSize: STATUS_ICON_FONT_SIZE, minWidth: STATUS_ICON_MIN_WIDTH }} title={`Status: ${message.status}`}>
              {message.status === 'sending' && '⏳'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'seen' && '👁'}
              {message.status === 'failed' && '❌'}
            </span>
          )}
          {/* Retry button for failed outgoing messages */}
          {isSent && message.status === 'failed' && onRetry && (
            <button
              onClick={() => onRetry(message)}
              style={{
                marginLeft: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              title="Thử gửi lại"
            >
              🔁
            </button>
          )}
        </div>
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
              onMouseEnter={() => {
                if (onEmojiHover) onEmojiHover(message.id, emoji);
              }}
              onMouseLeave={() => {
                if (onEmojiHover) onEmojiHover(message.id, null);
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
              try {
                const content = message.content || (message.message_type === 'sticker' ? 'Sticker' : 'Tin nhắn');
                showToast('Chuyển tiếp', content);
                showSystemNotification('Chuyển tiếp', content);
              } catch (e) {
                console.error('Notification error', e);
              }
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

