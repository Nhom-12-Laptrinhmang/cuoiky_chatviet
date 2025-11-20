import React, { useState } from 'react';
import { showToast, showSystemNotification } from '../../services/notifications';
import api from '../../services/api';
import twemoji from 'twemoji';

const MESSAGE_STICKER_SIZE = 140;
const STATUS_ICON_FONT_SIZE = 8;
const STATUS_ICON_MIN_WIDTH = 14;

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const buildAvatarSrc = (avatar_url, fallbackName = 'U') => {
  try {
    if (!avatar_url || (typeof avatar_url === 'string' && !avatar_url.includes('/') && !avatar_url.includes('.'))) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=ffffff&color=0b5ed7`;
    }
    if (typeof avatar_url === 'string') {
      if (avatar_url.startsWith('data:')) return avatar_url;
      if (avatar_url.startsWith('http://') || avatar_url.startsWith('https://')) return avatar_url;
      const base = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL : '';
      if (String(avatar_url).startsWith('/')) {
        return `${String(base).replace(/\/$/, '')}${avatar_url}`;
      }
      return `${String(base).replace(/\/$/, '')}/${avatar_url}`;
    }
  } catch (e) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=ffffff&color=0b5ed7`;
  }
};

const cacheBustUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:')) return url;
    const ts = Date.now();
    const cleaned = url.replace(/([?&])t=\d+(&)?/, (m, p1, p2) => (p2 ? p1 : ''));
    return cleaned + (cleaned.includes('?') ? '&' : '?') + 't=' + ts;
  } catch (e) {
    return url;
  }
};

const formatMessageTime = (ts) => {
  if (!ts) return '';
  try {
    let d;
    if (typeof ts === 'number') d = new Date(ts);
    else if (typeof ts === 'string') {
      const hasTZ = /[zZ]|[+-]\d{2}:?\d{2}$/.test(ts);
      d = new Date(hasTZ ? ts : (ts + 'Z'));
    } else d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

const MessageBubbleFixed = ({ message = {}, isSent = false, isGroup = false, onReply, onReaction, onEmojiHover, onRetry }) => {
  const [showActions, setShowActions] = useState(false);
  const emoticons = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
      {!message.isSystem && (
        <div style={{ width: 36, flex: '0 0 36px' }}>
          {!isSent && (
            <img
              src={cacheBustUrl(buildAvatarSrc(message.sender_avatar_url || message.avatar_url, message.sender_name || message.sender_username || 'U'))}
              alt="avatar"
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {/* Determine if this message shows an image/sticker so we can remove the colored bubble */}
      {(() => {
        const url = message.file_url || message.sticker_url || '';
        const type = message.file_type || message.message_type || '';
        const isImageByType = typeof type === 'string' && type.startsWith && type.startsWith('image/');
        const isImageByExt = typeof url === 'string' && url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i);
        const isImage = isImageByType || isImageByExt || message.message_type === 'sticker';
        return (
          <div
            className={`message-bubble ${isSent ? 'sent' : 'received'} ${message.message_type === 'sticker' ? 'sticker-bubble' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            style={isImage ? { position: 'relative', maxWidth: '78%', background: 'transparent', padding: 0, borderRadius: 0, border: 'none' } : { position: 'relative', maxWidth: '78%' }}
          >
        );
      })()}
        {message.reply_to_id && (
          <div style={{ background: '#f0f0f0', padding: '6px 8px', borderLeft: '3px solid #0b5ed7', marginBottom: 6, fontSize: 12, color: '#666' }}>
            Trả lời tin nhắn
          </div>
        )}

        {/* Show sender nickname in group chats for received messages */}
        {isGroup && !isSent && (
          <div style={{ fontSize: 12, color: '#444', marginBottom: 6, fontWeight: 600 }}>
            {message.display_name || message.sender_name || message.sender_username || 'User'}
          </div>
        )}

        <div className={`message-content ${message.message_type === 'sticker' ? 'sticker-content' : ''}`}>
          {message.message_type === 'sticker' ? (
            <div style={{ display: 'inline-block' }}>
              <img src={message.sticker_url} alt="sticker" style={{ width: MESSAGE_STICKER_SIZE, height: MESSAGE_STICKER_SIZE, objectFit: 'contain' }} />
            </div>
          ) : message.message_type === 'file' || message.file_url ? (
            (() => {
              const url = message.file_url;
              const backendBase = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
              const linkUrl = (typeof url === 'string' && url.startsWith('/')) ? (backendBase || window.location.origin) + url : url;
              const type = message.file_type || '';
              const isImageByType = type.startsWith && type.startsWith('image/');
              const isImageByExt = typeof url === 'string' && url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i);
              const isImage = isImageByType || isImageByExt;
              if (isImage) {
                return (
                  <div style={{ marginBottom: 6, maxWidth: 360 }}>
                    <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                      <img src={linkUrl} alt={message.file_name || 'image'} style={{ maxWidth: '100%', maxHeight: 500 }} />
                    </a>
                  </div>
                );
              }
              return (
                <div style={{ marginBottom: 8, maxWidth: 300 }}>
                  <div style={{ background: isSent ? 'rgba(255,255,255,0.1)' : 'rgba(102,126,234,0.1)', padding: '8px 12px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{type.startsWith('video/') ? '🎥' : type.startsWith('audio/') ? '🎵' : type.includes('pdf') ? '📄' : '📎'}</span>
                      <div style={{ flex: 1 }}>
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: isSent ? '#fff' : '#667eea', textDecoration: 'none' }}>{message.file_name || message.content}</a>
                        {message.file_size && <div style={{ fontSize: 11, opacity: 0.7 }}>{formatFileSize(message.file_size)}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div dangerouslySetInnerHTML={{ __html: twemoji.parse(message.content || '') }} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
            <span className="message-time">{formatMessageTime(message.timestamp)}</span>
            {isSent && message.status && (
              <span style={{ fontSize: STATUS_ICON_FONT_SIZE, minWidth: STATUS_ICON_MIN_WIDTH }} title={`Status: ${message.status}`}>
                {message.status === 'sending' && '⏳'}{message.status === 'sent' && '✓'}{message.status === 'delivered' && '✓✓'}{message.status === 'seen' && '👁'}{message.status === 'failed' && '❌'}
              </span>
            )}
            {isSent && message.status === 'failed' && onRetry && (<button onClick={() => onRetry(message)} style={{ marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer' }}>🔁</button>)}
          </div>
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div style={{ marginTop: 4 }}>{Object.entries(message.reactions).map(([emoji]) => (<span key={emoji} style={{ marginRight: 4 }}>{emoji}</span>))}</div>
        )}

        {showActions && (
          <div style={{ position: 'absolute', top: -40, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 6, display: 'flex', gap: 4, padding: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.1)', zIndex: 100 }}>
            {emoticons.map((emoji) => (
              <button key={emoji} onMouseEnter={() => onEmojiHover && onEmojiHover(message.id, emoji)} onMouseLeave={() => onEmojiHover && onEmojiHover(message.id, null)} onClick={() => { onReaction && onReaction(message.id, emoji); setShowActions(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>{emoji}</button>
            ))}
            <button onClick={() => { onReply && onReply(message); setShowActions(false); }} style={{ background: '#0b5ed7', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>↩️</button>
            <button onClick={() => { try { const content = message.content || (message.message_type === 'sticker' ? 'Sticker' : 'Tin nhắn'); showToast('Chuyển tiếp', content); showSystemNotification('Chuyển tiếp', content); } catch (e) {} setShowActions(false); }} style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>⬆️</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubbleFixed;
