import React from 'react';
import './GroupHeaderBar.css';

const GroupHeaderBar = ({ group, memberCount, onInfoClick }) => {
  return (
    <div className="group-header-bar" onClick={onInfoClick}>
      <img className="group-avatar" src={group.avatar_url || 'default-avatar.png'} alt="avatar" />
      <div className="group-header-info">
        <div className="group-header-name">{group.name}</div>
        <div className="group-header-members">
          <span className="group-header-member-icon">👥</span>
          <span>{memberCount} thành viên</span>
        </div>
      </div>
      <div className="group-header-actions">
        <button className="icon-btn" title="Tắt thông báo">🔔</button>
        <button className="icon-btn" title="Ghim hội thoại">📌</button>
        <button className="icon-btn" title="Thêm thành viên">➕</button>
        <button className="icon-btn" title="Quản lý nhóm">⚙️</button>
      </div>
    </div>
  );
};

export default GroupHeaderBar;
