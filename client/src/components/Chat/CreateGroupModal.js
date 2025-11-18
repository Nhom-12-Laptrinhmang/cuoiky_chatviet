import React, { useState, useEffect } from 'react';
import { groupAPI, userAPI } from '../../services/api';
import { showToast, showSystemNotification } from '../../services/notifications';
import { getSocket } from '../../services/socket';

const CreateGroupModal = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
      const resp = await groupAPI.createGroup(name.trim(), selectedMembers);
      setMessage('Nhóm đã tạo');
      setName('');
      setSelectedMembers([]);
      setSearchQuery('');
      
      if (onCreated && resp && resp.data) {
        onCreated(resp.data);
        
        // Emit socket event to notify all members that a new group was created
        try {
          const sock = getSocket();
          const groupData = resp.data;
          sock.emit('group_created_notify', {
            group_id: groupData.id,
            group_name: groupData.name || groupData.group_name,
            members: groupData.members || selectedMembers,
            created_by: 'current_user'
          });
        } catch (socketErr) {
          console.warn('Socket emit failed, but group was created:', socketErr);
        }
      }
      
      // Close after 1 second
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error('Create group failed', err);
      // Show detailed error message from server if available
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Tạo thất bại';
      setMessage(`Lỗi: ${errorMsg}`);
    } finally {
      setCreating(false);
    }
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.display_name && u.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="modal-backdrop">
      <div className="modal small-modal create-group-modal">
        <div className="modal-header">
          <h3>Tạo nhóm mới</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleCreate} className="modal-body">
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Tên nhóm</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên nhóm"
              disabled={creating}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
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
