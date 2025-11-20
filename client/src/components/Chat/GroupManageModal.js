import React, { useEffect, useState } from 'react';
import { groupAPI, userAPI } from '../../services/api';
import { showToast, showSystemNotification } from '../../services/notifications';
import './group-manage.css';

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
      // Capture list of IDs to add so we can use them after clearing selection
      const idsToAdd = selectedToAdd.slice();
      // Optimistic update: add selected users to members list immediately
      const toAdd = idsToAdd.map((id) => {
        const u = available.find(a => String(a.id) === String(id));
        return {
          id,
          username: u?.username || `User ${id}`,
          display_name: u?.display_name || u?.username || `User ${id}`,
          avatar_url: u?.avatar_url || null,
          role: 'member',
        };
      });
      setMembers((m) => [...m, ...toAdd]);
      // Remove newly added users from available list optimistically to avoid dupes
      setAvailable((prev) => (prev || []).filter(u => !idsToAdd.includes(u.id)));
      // Clear selection and show optimistic success to user
      setSelectedToAdd([]);
      showToast('Nhóm', 'Đã thêm thành viên');
      showSystemNotification('Nhóm', 'Đã thêm thành viên');

      console.debug('[GroupManageModal] Adding members payload (background):', { group_id: group.id, member_ids: idsToAdd });
      const resp = await groupAPI.addMembersToGroup(group.id, idsToAdd);
      console.debug('[GroupManageModal] addMembersToGroup response:', resp);
      // On success, refresh members from server to get canonical data
      try {
        const membersResp = await groupAPI.getGroupMembers(group.id);
        const latestMembers = membersResp.data || [];
        setMembers(latestMembers);
        // Refresh available users and remove any that are now members
        try {
          const availResp = await userAPI.getUsers();
          const allUsers = availResp.data || [];
          const memberIds = new Set((latestMembers || []).map(m => String(m.id)));
          const filtered = allUsers.filter(u => !memberIds.has(String(u.id)));
          setAvailable(filtered);
        } catch (availErr) {
          // If we cannot refresh users, attempt to filter existing available list
          const memberIds = new Set((latestMembers || []).map(m => String(m.id)));
          setAvailable((prev) => (prev || []).filter(u => !memberIds.has(String(u.id))));
        }
      } catch (refreshErr) {
        // If refresh fails, keep optimistic members but log
        console.warn('[GroupManageModal] Failed to refresh members after add:', refreshErr);
      }
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error('Add members failed', e);
      console.error('[GroupManageModal] server response:', e?.response?.status, e?.response?.data);
      // revert optimistic update
      try {
        const latest = await groupAPI.getGroupMembers(group.id);
        setMembers(latest.data || []);
        // refresh available list as well
        try {
          const availResp = await userAPI.getUsers();
          const allUsers = availResp.data || [];
          const memberIds = new Set((latest.data || []).map(m => String(m.id)));
          setAvailable(allUsers.filter(u => !memberIds.has(String(u.id))));
        } catch (availErr) {
          // fallback: re-add previously-removed users back to available if we have them
          setAvailable((prev) => {
            const prevArr = prev || [];
            const toRestore = (Array.isArray(selectedToAdd) ? selectedToAdd : []).map(id => {
              const u = available.find(a => String(a.id) === String(id));
              return u;
            }).filter(Boolean);
            return [...prevArr, ...toRestore];
          });
        }
      } catch (refreshErr) {
        // fallback: remove the optimistic entries we added
        setMembers((prev) => prev.filter(m => !selectedToAdd.includes(m.id)));
      }
      // Log error but do not show a blocking toast (avoids confusing popup after optimistic success)
      const serverMsg = e?.response?.data?.error || e?.response?.data?.detail || e?.response?.data?.message || e?.message;
      console.warn('[GroupManageModal] addMembers error (non-blocking):', serverMsg);
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
    <div className="modal-backdrop gm-backdrop">
      <div className="modal medium-modal group-manage-modal">
        <div className="gm-header modal-header">
          <div className="gm-header-left">
            <h3 className="gm-title">Quản lý nhóm</h3>
            <div className="gm-group-meta">
              <strong className="gm-group-name">{group.name || group.group_name || `Nhóm ${group.id}`}</strong>
              <div className="gm-group-id">ID: {group.id}</div>
            </div>
          </div>
          <div className="gm-header-right">
            <button className="close gm-close" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="modal-body gm-body">

          {/* Modal chuyển owner khi owner rời nhóm */}
          {showTransferOwner && (
            <div className="gm-transfer">
              <h4>Chọn thành viên mới làm chủ nhóm</h4>
              <div className="gm-transfer-list">
                {members.filter(m => String(m.id) !== String(currentUserId)).map(m => (
                  <label key={m.id} className="gm-radio-row">
                    <input
                      type="radio"
                      name="newOwner"
                      value={m.id}
                      checked={String(selectedNewOwner) === String(m.id)}
                      onChange={() => setSelectedNewOwner(m.id)}
                      disabled={saving}
                    />
                    <span className="gm-radio-label">{m.display_name || m.username}</span>
                  </label>
                ))}
              </div>
              <div className="gm-transfer-actions">
                <button className="btn" onClick={handleTransferOwnerAndLeave} disabled={saving || !selectedNewOwner}>Chuyển quyền & rời nhóm</button>
                <button className="btn btn-ghost" onClick={() => { setShowTransferOwner(false); setSelectedNewOwner(null); }} disabled={saving}>Hủy</button>
              </div>
            </div>
          )}

          <div className="gm-columns">
            <div className="gm-column gm-members">
              <h4 className="gm-section-title">Thành viên</h4>
              {loading ? <p className="gm-loading">Đang tải...</p> : (
                <div className="gm-list gm-members-list">
                  {members.length === 0 ? <p className="gm-empty">Chưa có thành viên</p> : members.map(m => (
                    <div key={m.id} className="gm-member-item">
                      <div className="gm-member-left">
                        <img className="gm-avatar" src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username||'U')}&background=667eea&color=fff`} alt={m.username} />
                        <div className="gm-member-info">
                          <div className="gm-member-name">{m.display_name || m.username}</div>
                          {m.role === 'owner' && <div className="gm-member-role">Chủ nhóm</div>}
                        </div>
                      </div>
                      <div className="gm-member-actions">
                        {String(m.id) === String(currentUserId) ? (
                          <button className="btn btn-ghost" onClick={() => handleRemove(m.id)} disabled={saving}>Rời</button>
                        ) : (
                          isOwner && <button className="btn btn-ghost" onClick={() => handleRemove(m.id)} disabled={saving}>Gỡ</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isOwner && (
            <div className="gm-column gm-add">
              <h4 className="gm-section-title">Thêm thành viên</h4>
              <div className="gm-list gm-available-list">
                {available.length === 0 ? <p className="gm-empty">Không có người dùng để thêm</p> : available.map(u => (
                  <label key={u.id} className="gm-available-row">
                    <input type="checkbox" checked={selectedToAdd.includes(u.id)} onChange={() => toggleSelect(u.id)} />
                    <img className="gm-avatar-sm" src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username||'U')}&background=667eea&color=fff`} alt={u.username} />
                    <span className="gm-available-name">{u.display_name || u.username}</span>
                  </label>
                ))}
              </div>
              <div className="gm-actions">
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
