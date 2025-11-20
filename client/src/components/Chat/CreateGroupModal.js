import React, { useState, useEffect } from 'react';
import { groupAPI, userAPI } from '../../services/api';
import { showToast, showSystemNotification } from '../../services/notifications';
import { getSocket } from '../../services/socket';

// Tiện ích preview ảnh
function AvatarPreview({ src, size = 48 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid #e5e7eb',
      marginRight: 12
    }}>
      {src ? (
        <img src={src} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <i className="fa-regular fa-image" style={{ fontSize: size/2, color: '#9ca3af' }} />
      )}
    </div>
  );
}

const CreateGroupModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  // Load available users when modal opens. Keep the hook unconditionally
  // declared (rules of hooks) and guard behavior inside the effect.
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const resp = await userAPI.getUsers();
        setAvailableUsers(resp.data || []);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };

    if (isOpen) {
      loadUsers();
        setAvatarFile(null);
        setAvatarPreview('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('Tên nhóm không được để trống');
      return;
    }
    setCreating(true);
    try {
      let avatarUrl = '';
      if (avatarFile) {
        // Giả lập upload file, bạn cần thay bằng API upload thực tế
        // Ví dụ: const resp = await uploadFile(avatarFile);
        // avatarUrl = resp.data.url;
        avatarUrl = avatarPreview; // demo: dùng preview
      }
      const resp = await groupAPI.createGroup(name.trim(), selectedMembers, avatarUrl);
      setMessage('Nhóm đã tạo');
      setName('');
      setSelectedMembers([]);
      setSearchQuery('');
      setAvatarFile(null);
      setAvatarPreview('');
      if (onCreated && resp && resp.data) {
        // Normalize the group object so callers (ChatBox) can rely on
        // `group_name` or `display_name` for header display.
        const raw = resp.data || {};
        const normalized = Object.assign({}, raw, {
          group_name: raw.group_name || raw.name || raw.display_name || name.trim(),
          display_name: raw.display_name || raw.group_name || raw.name || name.trim(),
        });
        onCreated(normalized);
        try {
          const sock = getSocket();
          const groupData = normalized;
          sock.emit('group_created_notify', {
            group_id: groupData.id,
            group_name: groupData.group_name,
            members: groupData.members || selectedMembers,
            created_by: 'current_user',
            avatar_url: avatarUrl
          });
        } catch (socketErr) {
          console.warn('Socket emit failed, but group was created:', socketErr);
        }
      }
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error('Create group failed', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Tạo thất bại';
      setMessage(`Lỗi: ${errorMsg}`);
    } finally {
      setCreating(false);
    }
  };
  // Xử lý chọn file avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new window.FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(user =>
    (user.display_name || user.username).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.18)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal create-group-modal" style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        minWidth: 400,
        maxWidth: 440,
        width: '100%',
        padding: 0,
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div className="modal-header" style={{
          padding: '20px 24px 8px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Tạo nhóm mới</h3>
          <button className="close" onClick={onClose} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        <form onSubmit={handleCreate} className="modal-body" style={{ padding: '18px 24px 12px 24px' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
            <button
              className="btn btn-icon"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                cursor: 'pointer'
              }}
              onClick={() => alert('Thêm bạn')}
            >
              <i className="fa-solid fa-user-plus" style={{ fontSize: '20px', color: '#6b7280' }}></i>
            </button>
            <button
              className="btn btn-icon"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                cursor: 'pointer'
              }}
              onClick={() => alert('Tạo nhóm')}
            >
              <i className="fa-solid fa-users" style={{ fontSize: '20px', color: '#6b7280' }}></i>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
            <label htmlFor="group-avatar-upload" style={{ cursor: 'pointer' }}>
              <AvatarPreview src={avatarPreview} size={48} />
              <input id="group-avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={creating} />
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              disabled={creating}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                boxSizing: 'border-box',
                marginLeft: 12
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Thêm thành viên (tùy chọn)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm người dùng..."
              disabled={creating}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '8px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px'
            }}>
              {filteredUsers.length === 0 ? (
                <p style={{ color: '#9ca3af', margin: '8px', fontSize: '14px' }}>
                  {searchQuery ? 'Không tìm thấy người dùng' : 'Không có người dùng'}
                </p>
              ) : (
                filteredUsers.map(user => (
                  <label
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      background: selectedMembers.includes(user.id) ? '#dbeafe' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { try { if (!selectedMembers.includes(user.id)) e.currentTarget.style.background = '#f3f4f6'; } catch (err) {} }}
                    onMouseLeave={(e) => { try { if (!selectedMembers.includes(user.id)) e.currentTarget.style.background = 'transparent'; } catch (err) {} }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(user.id)}
                      onChange={() => toggleMember(user.id)}
                      disabled={creating}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#1f2937' }}>
                      {user.display_name || user.username}
                    </span>
                  </label>
                ))
              )}
            </div>
            {selectedMembers.length > 0 && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                Đã chọn {selectedMembers.length} thành viên
              </p>
            )}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button
              className="btn"
              type="submit"
              disabled={creating}
              style={{ flex: 1 }}
            >
              {creating ? 'Đang tạo...' : 'Tạo'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onClose}
              disabled={creating}
              style={{ flex: 1 }}
            >
              Đóng
            </button>
          </div>
          {message && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: message.includes('thất bại') ? '#fee2e2' : '#dbeafe',
              color: message.includes('thất bại') ? '#991b1b' : '#0c4a6e',
              borderRadius: '6px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
