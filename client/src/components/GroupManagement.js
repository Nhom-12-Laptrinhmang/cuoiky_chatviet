import React, { useState, useEffect } from 'react';
import AddMemberPopup from './AddMemberPopup';
import GroupHeaderBar from './GroupHeaderBar';
import './GroupManagement.css';

const GroupManagement = ({ initialGroupId = 1 }) => {
  const groupId = initialGroupId;

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const [searchUser, setSearchUser] = useState('');
  const [userList, setUserList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const gResp = await fetch(`/groups/${groupId}`);
        if (gResp.ok) {
          const gdata = await gResp.json();
          setGroup(gdata);
          setEditName(gdata.name || '');
          setEditAvatar(gdata.avatar_url || '');
        }
      } catch (e) {
        console.error('Failed to load group', e);
      }
      try {
        const mResp = await fetch(`/groups/${groupId}/members`);
        if (mResp.ok) {
          const mdata = await mResp.json();
          setMembers(mdata || []);
        }
      } catch (e) {
        console.error('Failed to load members', e);
      }
    })();
  }, [groupId]);

  useEffect(() => {
    let mounted = true;
    if (!showAddMember) return;
    if (!searchUser) {
      setUserList([]);
      return;
    }
    (async () => {
      try {
        const resp = await fetch(`/users?search=${encodeURIComponent(searchUser)}`);
        if (!mounted) return;
        if (resp.ok) {
          const data = await resp.json();
          setUserList(data || []);
        }
      } catch (e) {
        console.error('user search failed', e);
      }
    })();
    return () => { mounted = false; };
  }, [searchUser, showAddMember]);

  const handleOpenInfoPopup = () => setShowInfoPopup(true);
  const handleCloseInfoPopup = () => setShowInfoPopup(false);

  const handleEditName = () => setIsEditingName(true);
  const handleSaveName = async () => {
    try {
      const resp = await fetch(`/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName })
      });
      const data = await resp.json();
      if (resp.ok) setGroup(data);
    } catch (e) {
      console.error('save name failed', e);
    } finally {
      setIsEditingName(false);
    }
  };

  const handleEditAvatar = () => setIsEditingAvatar(true);
  const handleSaveAvatar = async () => {
    try {
      const resp = await fetch(`/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: editAvatar })
      });
      const data = await resp.json();
      if (resp.ok) setGroup(data);
    } catch (e) {
      console.error('save avatar failed', e);
    } finally {
      setIsEditingAvatar(false);
    }
  };

  const toggleDropdown = () => setDropdownOpen(v => !v);

  const handleOpenAddMember = () => {
    setSelectedUsers([]);
    setSearchUser('');
    setUserList([]);
    setShowAddMember(true);
  };
  const handleCloseAddMember = () => setShowAddMember(false);
  const handleSelectUser = (id) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleConfirmAddMember = async () => {
    if (!selectedUsers.length) return;
    try {
      const resp = await fetch(`/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_ids: selectedUsers })
      });
      if (resp.ok) {
        const mResp = await fetch(`/groups/${groupId}/members`);
        if (mResp.ok) setMembers(await mResp.json());
      }
    } catch (e) {
      console.error('add members failed', e);
    } finally {
      setShowAddMember(false);
    }
  };

  if (!group) return <div>Loading...</div>;

  return (
    <>
      <GroupHeaderBar group={group} memberCount={members.length} onInfoClick={handleOpenInfoPopup} />

      {showInfoPopup && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: '#fff', zIndex: 1100, boxShadow: '-3px 0 12px rgba(0,0,0,0.12)' }}>
          <div style={{ padding: 20, height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleCloseInfoPopup}>Đóng</button>
            </div>
            <h2 style={{ textAlign: 'center' }}>Thông tin nhóm</h2>

            <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 12 }}>
              <img src={group.avatar_url || 'default-avatar.png'} alt="group avatar" style={{ width: 96, height: 96, borderRadius: '50%' }} />
              <div style={{ marginTop: 8 }}>
                {isEditingAvatar ? (
                  <div>
                    <input value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="Avatar URL" />
                    <div>
                      <button onClick={handleSaveAvatar}>Lưu</button>
                      <button onClick={() => setIsEditingAvatar(false)}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  group.allow_edit_name_avatar ? <button onClick={handleEditAvatar}>Đổi ảnh</button> : null
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                {isEditingName ? (
                  <div>
                    <input value={editName} onChange={e => setEditName(e.target.value)} />
                    <div>
                      <button onClick={handleSaveName}>Lưu</button>
                      <button onClick={() => setIsEditingName(false)}>Hủy</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ margin: 6 }}>{group.name}</h3>
                    {group.allow_edit_name_avatar ? <button onClick={handleEditName}>Đổi tên nhóm</button> : null}
                  </div>
                )}
              </div>
            </div>

            <hr />

            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Thành viên nhóm</strong>
                <span>{members.length} thành viên</span>
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ cursor: 'pointer' }} onClick={toggleDropdown}>
                  {isDropdownOpen ? 'Thu gọn ▲' : 'Mở ▼'}
                </div>
                {isDropdownOpen && (
                  <ul style={{ listStyle: 'none', padding: 0, marginTop: 8 }}>
                    {members.map(m => (
                      <li key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
                        <img src={m.avatar_url || 'default-avatar.png'} alt='' style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 8 }} />
                        <div>
                          <div>{m.username}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{m.role}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button>🔔 Tắt/Bật thông báo</button>
                <button>📌 Ghim hội thoại</button>
                <button onClick={handleOpenAddMember}>➕ Thêm thành viên</button>
                <button>⚙️ Quản lý nhóm</button>
              </div>
            </section>

          </div>
        </div>
      )}

      <AddMemberPopup
        open={showAddMember}
        userList={userList}
        selectedUsers={selectedUsers}
        onSelectUser={handleSelectUser}
        onClose={handleCloseAddMember}
        onConfirm={handleConfirmAddMember}
        searchUser={searchUser}
        setSearchUser={setSearchUser}
      />
    </>
  );
};

export default GroupManagement;