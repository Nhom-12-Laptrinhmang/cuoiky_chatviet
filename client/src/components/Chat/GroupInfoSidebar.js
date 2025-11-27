import React, { useState } from 'react';
import './GroupInfoSidebar.css';
import GroupInfoDetails from './GroupInfoDetails';
import GroupMembersList from './GroupMembersList';
import GroupMediaPanel from './GroupMediaPanel';
import GroupFilesPanel from './GroupFilesPanel';
import GroupLinksPanel from './GroupLinksPanel';
import GroupSecuritySettings from './GroupSecuritySettings';

const GroupInfoSidebar = ({ group, currentUserId, onChangeAvatar, onChangeName, onToggleNotification, onPinGroup, onOpenAddMember, onOpenManageGroup }) => {
  // Quyền chỉnh sửa: chủ nhóm hoặc được phép
  const canEdit = group?.owner_id === currentUserId || group?.allow_all_edit;
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [showNameEdit, setShowNameEdit] = useState(false);

  return (
    <aside className="group-info-sidebar">
      <h2 className="group-info-header">Thông tin nhóm</h2>

      <GroupInfoDetails group={group} canEdit={canEdit} onChangeAvatar={onChangeAvatar} onChangeName={onChangeName} />

      <div style={{padding: '0 16px'}}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <button className="btn" onClick={onToggleNotification}>Tắt thông báo</button>
          <button className="btn" onClick={onPinGroup}>Ghim</button>
          <button className="btn" onClick={() => onOpenAddMember && onOpenAddMember()}>Thêm thành viên</button>
          <button className="btn btn-ghost" onClick={() => onOpenManageGroup && onOpenManageGroup()}>Quản lý nhóm</button>
        </div>
      </div>

      <GroupMembersList members={group?.members || []} ownerId={group?.owner_id} onAddMember={onOpenAddMember} onRemoveMember={(id) => { /* placeholder */ }} />

      <GroupMediaPanel media={group?.media || []} />
      <GroupFilesPanel files={group?.files || []} />
      <GroupLinksPanel links={group?.links || []} />

      <GroupSecuritySettings
        settings={group?.settings || {}}
        onLeaveGroup={() => console.log('leave')}
        onDeleteHistory={() => console.log('delete history')}
        onReport={() => console.log('report')}
      />
    </aside>
  );
};

export default GroupInfoSidebar;
