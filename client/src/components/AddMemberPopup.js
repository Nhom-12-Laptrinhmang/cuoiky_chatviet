import React from 'react';
import ReactDOM from 'react-dom';

const AddMemberPopup = ({ open, userList = [], selectedUsers = [], onSelectUser, onClose, onConfirm, searchUser, setSearchUser, saving = false }) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-backdrop"
      style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
    >
      <div
        className="modal medium-modal add-member-modal"
        style={{ position: 'relative', width: '720px', maxWidth: '90%', maxHeight: '86%', overflow: 'auto', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', background: '#fff' }}
      >
        <div className="modal-header" style={{ position: 'relative', padding: '16px 48px 12px 16px' }}>
          <h3 style={{ margin: 0 }}>Thêm thành viên</h3>
          <button
            className="close"
            onClick={onClose}
            style={{ position: 'absolute', right: 12, top: 12, width: 32, height: 32, borderRadius: 6, border: 'none', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="modal-body" style={{ padding: '12px 16px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              style={{ width: '100%', padding: '8px' }}
            />
            <div style={{ width: 12 }} />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Kết quả</div>
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 360, overflowY: 'auto', border: '1px solid #eef2f6', borderRadius: 6 }}>
              {(!userList || userList.length === 0) && (
                <div className="muted" style={{ padding: 12 }}>Không có kết quả</div>
              )}
              {(userList || []).map((u, idx) => (
                <label key={u.id || u.username} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', gap: 12, borderBottom: idx < (userList || []).length - 1 ? '1px solid #eef2f6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => onSelectUser(u.id)}
                    />
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username||u.display_name||'U')}&background=667eea&color=fff`} alt={u.username} style={{ width: 36, height: 36, borderRadius: 10 }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{u.display_name || u.username}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{u.username || ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn" onClick={() => onSelectUser(u.id)}>{selectedUsers.includes(u.id) ? 'Bỏ chọn' : 'Chọn'}</button>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Hủy</button>
          <button className="btn" onClick={onConfirm} disabled={saving || !selectedUsers || selectedUsers.length === 0}>{saving ? 'Đang...' : `Thêm (${selectedUsers.length})`}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddMemberPopup;
