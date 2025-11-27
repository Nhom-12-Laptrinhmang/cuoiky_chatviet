import React from 'react';

const GroupMembersList = ({ members = [], ownerId, onAddMember, onRemoveMember }) => {
  return (
    <div style={{padding:'0 16px 12px'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div style={{fontWeight:700}}>Thành viên ({members.length})</div>
        <div>
          <button className="btn btn-ghost" onClick={onAddMember}>Thêm</button>
        </div>
      </div>
      <div style={{border: '1px solid #eef2f6', borderRadius:8, overflow:'hidden'}}>
        {(members || []).map((m, idx) => (
          <div key={m.id || idx} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:12, borderBottom: idx < members.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <img src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.username||m.display_name||'U')}&background=667eea&color=fff`} alt={m.username} style={{width:40,height:40,borderRadius:8}} />
              <div>
                <div style={{fontWeight:700}}>{m.display_name || m.username}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{m.username || ''}{String(m.id) === String(ownerId) ? ' · Chủ nhóm' : ''}</div>
              </div>
            </div>
            <div>
              <button className="btn btn-ghost" onClick={() => onRemoveMember && onRemoveMember(m.id)}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupMembersList;
