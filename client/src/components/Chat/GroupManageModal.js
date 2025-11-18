import React, { useEffect, useState } from 'react';
import { groupAPI, userAPI } from '../../services/api';
import { showToast, showSystemNotification } from '../../services/notifications';

const GroupManageModal = ({ isOpen, onClose, group, onUpdated }) => {
  const [members, setMembers] = useState([]);
  const [showTransferOwner, setShowTransferOwner] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState(null);
  const [available, setAvailable] = useState([]);
  const [selectedToAdd, setSelectedToAdd] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [groupOwnerId, setGroupOwnerId] = useState(null);
  const isOwner = String(currentUserId) === String(groupOwnerId);

  useEffect(() => {
    if (!isOpen || !group) return;
    setLoading(true);
    (async () => {
      try {
        const resp = await groupAPI.getGroupMembers(group.id);
        const mems = resp.data || [];
        setMembers(mems);
        // get current user id and extract group owner_id from first member response
        try {
          const me = await userAPI.getCurrent();
          setCurrentUserId(me.data?.id || null);
          // extract owner_id from member data (same for all)
          const ownerFromResp = mems.length > 0 ? mems[0].owner_id : null;
          setGroupOwnerId(ownerFromResp);
        } catch (e) {
          // ignore
        }
        try {
          const avail = await userAPI.getUsers();
          const existingIds = new Set(mems.map(m => String(m.id)));
          const filtered = (avail.data || []).filter(u => !existingIds.has(String(u.id)));
          setAvailable(filtered);
        } catch (e) {
          try { const avail = await userAPI.getUsers(); setAvailable(avail.data || []); } catch (e2) {}
        }
      } catch (e) {
        console.error('Failed to load group members', e);
        showToast('Lỗi', 'Không tải được thành viên nhóm');
      }
      setLoading(false);
    })();
    // reset selection when opened
    setSelectedToAdd([]);
  }, [isOpen, group]);

  if (!isOpen || !group) return null;

  const toggleSelect = (id) => {
    setSelectedToAdd(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAdd = async () => {
    if (!selectedToAdd.length) {
      showToast('Nhóm', 'Chọn thành viên để thêm');
      return;
    }
    setSaving(true);
    try {
      await groupAPI.addMembersToGroup(group.id, selectedToAdd);
      showToast('Nhóm', 'Đã thêm thành viên');
      showSystemNotification('Nhóm', 'Đã thêm thành viên');
      // refresh members
      const resp = await groupAPI.getGroupMembers(group.id);
      setMembers(resp.data || []);
      setSelectedToAdd([]);
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error('Add members failed', e);
      showToast('Lỗi', 'Thêm thành viên thất bại');
      showSystemNotification('Lỗi', 'Thêm thành viên thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (userId) => {
    const isSelf = String(userId) === String(currentUserId);
    if (isSelf && isOwner && members.length > 1) {
      // Nếu là owner và còn thành viên khác, hiển thị modal chuyển owner
      setShowTransferOwner(true);
      return;
    }
    const confirmText = isSelf ? 'Bạn chắc chắn muốn rời khỏi nhóm này?' : 'Bạn chắc chắn muốn gỡ thành viên này khỏi nhóm?';
    if (!window.confirm(confirmText)) return;
    setSaving(true);
    try {
      await groupAPI.removeMemberFromGroup(group.id, userId);
      if (isSelf) {
        showToast('Nhóm', 'Bạn đã rời nhóm');
        if (onUpdated) onUpdated({ left: true, groupId: group.id });
        if (onClose) onClose();
        return;
      }
      showToast('Nhóm', 'Đã gỡ thành viên');
      const resp = await groupAPI.getGroupMembers(group.id);
      setMembers(resp.data || []);
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error('Remove member failed', e);
      showToast('Lỗi', e.response?.data?.error || 'Gỡ thành viên thất bại');
    } finally {
      setSaving(false);
    }
  };

  // Chuyển owner và rời nhóm
  const handleTransferOwnerAndLeave = async () => {
    if (!selectedNewOwner) {
      showToast('Lỗi', 'Chọn thành viên mới làm chủ nhóm');
      return;
    }
    setSaving(true);
    try {
      await groupAPI.transferOwner(group.id, selectedNewOwner);
      showToast('Nhóm', 'Đã chuyển quyền chủ nhóm');
      await groupAPI.removeMemberFromGroup(group.id, currentUserId);
      showToast('Nhóm', 'Bạn đã rời nhóm');
      setShowTransferOwner(false);
      setSelectedNewOwner(null);
      if (onUpdated) onUpdated({ left: true, groupId: group.id });
      if (onClose) onClose();
    } catch (e) {
      console.error('Transfer owner or leave failed', e);
      showToast('Lỗi', 'Chuyển quyền hoặc rời nhóm thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal medium-modal group-manage-modal">
        <div className="modal-header">
          <h3>Quản lý nhóm</h3>
          <button className="close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <strong>{group.name || group.group_name || `Nhóm ${group.id}`}</strong>
            <div style={{ color: '#6b7280', fontSize: 13 }}>ID: {group.id}</div>
          </div>

          {/* Modal chuyển owner khi owner rời nhóm */}
          {showTransferOwner && (
            <div style={{ marginBottom: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fffbe6' }}>
              <h4>Chọn thành viên mới làm chủ nhóm</h4>
              <div style={{ margin: '8px 0' }}>
                {members.filter(m => String(m.id) !== String(currentUserId)).map(m => (
                  <label key={m.id} style={{ display: 'block', marginBottom: 8 }}>
                    <input
                      type="radio"
                      name="newOwner"
                      value={m.id}
                      checked={String(selectedNewOwner) === String(m.id)}
                      onChange={() => setSelectedNewOwner(m.id)}
                      disabled={saving}
                    />{' '}
                    {m.display_name || m.username}
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={handleTransferOwnerAndLeave} disabled={saving || !selectedNewOwner}>Chuyển quyền & rời nhóm</button>
                <button className="btn btn-ghost" onClick={() => { setShowTransferOwner(false); setSelectedNewOwner(null); }} disabled={saving}>Hủy</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '6px 0' }}>Thành viên</h4>
              {loading ? <p>Đang tải...</p> : (
                <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
                  {members.length === 0 ? <p style={{ color: '#9ca3af' }}>Chưa có thành viên</p> : members.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username||'U')}&background=667eea&color=fff`} style={{ width: 34, height: 34, borderRadius: 17 }} alt={m.username} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div>{m.username}</div>
                          {m.role === 'owner' && <div style={{ fontSize: 11, color: '#9ca3af' }}>Chủ nhóm</div>}
                        </div>
                      </div>
                      <div>
                        {String(m.id) === String(currentUserId) ? (
                          // Current user can leave
                          <button className="btn btn-ghost" onClick={() => handleRemove(m.id)} disabled={saving}>Rời</button>
                        ) : (
                          // Only owner can remove others
                          isOwner && <button className="btn btn-ghost" onClick={() => handleRemove(m.id)} disabled={saving}>Gỡ</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isOwner && (
            <div style={{ width: 320 }}>
              <h4 style={{ margin: '6px 0' }}>Thêm thành viên</h4>
              <div style={{ maxHeight: 220, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 6, padding: 8 }}>
                {available.length === 0 ? <p style={{ color: '#9ca3af' }}>Không có người dùng để thêm</p> : available.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px' }}>
                    <input type="checkbox" checked={selectedToAdd.includes(u.id)} onChange={() => toggleSelect(u.id)} />
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username||'U')}&background=667eea&color=fff`} style={{ width: 28, height: 28, borderRadius: 14 }} alt={u.username} />
                    <span>{u.display_name || u.username}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={handleAdd} disabled={saving || selectedToAdd.length === 0}>{saving ? 'Đang...' : `Thêm (${selectedToAdd.length})`}</button>
                <button className="btn btn-ghost" onClick={() => { setSelectedToAdd([]); }} disabled={saving}>Bỏ chọn</button>
              </div>
            </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupManageModal;
