import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const AvatarModal = ({ isOpen, anchorRect = null, onClose, onViewProfile, onEditProfile, onLogout }) => {
  const modalRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      try {
        const m = modalRef.current;
        if (!m) return;
        const mRect = m.getBoundingClientRect();
        // Position modal so it sticks to the avatar horizontally (prefer to the right)
        const margin = 8;
        // If anchorRect not provided, try to find the avatar element in DOM as a fallback
        let ar = anchorRect;
        if (!ar) {
          try {
            const el = document.querySelector('.left-nav .profile img[alt="profile"]');
            if (el) ar = el.getBoundingClientRect();
          } catch (e) {
            ar = null;
          }
        }

        let left;
        if (ar) {
          const preferRight = ar.right + 8; // place just right of avatar
          const preferLeft = ar.left - mRect.width - 8; // place to the left of avatar if not enough space on right
          if (preferRight + mRect.width <= window.innerWidth - margin) {
            left = preferRight;
          } else if (preferLeft >= margin) {
            left = preferLeft;
          } else {
            // fallback: center relative to avatar
            left = ar.left + (ar.width - mRect.width) / 2;
          }
        } else {
          left = (window.innerWidth - mRect.width) / 2;
        }

        // Compute vertical position: prefer above the avatar if there's space, otherwise below
        let topAbove = ar ? (ar.top - mRect.height - 8) : ((window.innerHeight - mRect.height) / 2);
        let topBelow = ar ? (ar.bottom + 8) : ((window.innerHeight - mRect.height) / 2);
        let top;
        if (ar) {
          if (ar.top >= (mRect.height + 16)) {
            top = topAbove;
          } else {
            top = topBelow;
          }
        } else {
          top = topAbove;
        }

        // Debug log to help diagnose positioning issues
        // eslint-disable-next-line no-console
        console.debug('[AvatarModal] anchorRect=', ar, 'mRect=', mRect, 'posCandidate=', { left, top });
  // Clamp to viewport with small margin
  if (left + mRect.width > window.innerWidth - margin) left = window.innerWidth - mRect.width - margin;
  if (left < margin) left = margin;
  if (top + mRect.height > window.innerHeight - margin) top = window.innerHeight - mRect.height - margin;
  if (top < margin) top = margin;
        setPos({ left, top });
      } catch (e) {
        setPos(null);
      }
    };

    // measure after paint so modalRef exists
    const t = setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [isOpen, anchorRect]);

  if (!isOpen) return null;

  const modal = (
    <div className="avatar-modal-backdrop" onClick={onClose}>
      <div
        ref={modalRef}
        className="avatar-modal"
        onClick={(e) => e.stopPropagation()}
        style={Object.assign({
          width: 340,
          maxWidth: '90%',
          borderRadius: 8,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          background: '#fff',
          position: 'absolute',
          left: pos ? `${pos.left}px` : undefined,
          top: pos ? `${pos.top}px` : undefined,
          visibility: pos ? 'visible' : 'hidden'
        })}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #eee' }}>
          <h4 style={{ margin: 0 }}>Tùy chọn</h4>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 12 }}>
          <button className="btn" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => { onViewProfile(); onClose(); }}>Hồ sơ của bạn</button>
          <button className="btn" style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => { onEditProfile(); onClose(); }}>Cập nhật thông tin</button>
          <div style={{ height: 1, background: '#f0f0f0', margin: '8px 0' }} />
          <button className="btn btn-danger" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { onLogout(); onClose(); }}>Đăng xuất</button>
        </div>
      </div>
    </div>
  );

  // Render into body so overlay isn't constrained by parent containers
  if (typeof document !== 'undefined') {
    return createPortal(modal, document.body);
  }

  return null;
};

export default AvatarModal;
