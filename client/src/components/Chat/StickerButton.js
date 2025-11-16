import React, { useState } from 'react';

// Sticker list
const STICKERS = [
  { id: 'cat1', url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif' },
  { id: 'dog1', url: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif' },
  { id: 'heart1', url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { id: 'laugh1', url: 'https://media.giphy.com/media/l3q2K5jinAlZ7iwFi/giphy.gif' },
  { id: 'angry1', url: 'https://media.giphy.com/media/3o7TKt3A7Sp6wnY2LK/giphy.gif' },
  { id: 'love1', url: 'https://media.giphy.com/media/3o7TKU9I2F9DxIa0gw/giphy.gif' },
];

// Emoji list theo categories
const EMOJIS = [
  { category: 'Gần đây', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂'] },
  { category: 'Cảm xúc', emojis: ['😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😌', '😔', '😑', '😐', '😶', '🤐', '🤨', '🤔', '🤞', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤮', '🤢', '🤮', '🤮', '🤮'] },
  { category: 'Tay', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🤜', '💅', '👂', '👃'] },
  { category: 'Động vật', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🐒', '🐶', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🦟', '🦗', '🕷️'] },
];

const StickerButton = ({ onSelectSticker, onAddEmoji }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('sticker'); // 'sticker' or 'emoji'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setOpen((v) => !v)} 
        title="Gửi sticker hoặc emoji" 
        style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}
      >
        🖼️
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 2000,
          width: '450px',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Tab Header */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #f0f0f0',
            padding: '12px 0',
          }}>
            <button
              onClick={() => setTab('sticker')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px',
                color: tab === 'sticker' ? '#0b5ed7' : '#999',
                borderBottom: tab === 'sticker' ? '3px solid #0b5ed7' : 'none',
                transition: 'all 0.3s',
              }}
            >
              STICKER
            </button>
            <button
              onClick={() => setTab('emoji')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px',
                color: tab === 'emoji' ? '#0b5ed7' : '#999',
                borderBottom: tab === 'emoji' ? '3px solid #0b5ed7' : 'none',
                transition: 'all 0.3s',
              }}
            >
              EMOJI
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                color: '#999',
                padding: '4px 8px',
              }}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
          }}>
            {tab === 'sticker' ? (
              // STICKER TAB
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
              }}>
                {STICKERS.map((sticker) => (
                  <img
                    key={sticker.id}
                    src={sticker.url}
                    alt="sticker"
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      cursor: 'pointer',
                      borderRadius: 6,
                      transition: 'transform 0.2s',
                    }}
                    onClick={() => {
                      onSelectSticker(sticker);
                      setOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            ) : (
              // EMOJI TAB
              <div>
                {EMOJIS.map((group) => (
                  <div key={group.category} style={{ marginBottom: 16 }}>
                    <h4 style={{ marginBottom: 8, color: '#333', fontSize: 12, fontWeight: 600 }}>
                      {group.category}
                    </h4>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gap: 4,
                    }}>
                      {group.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onAddEmoji(emoji);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: 24,
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 4,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#f0f0f0';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'none';
                          }}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerButton;
