import React from 'react';

const GroupInfoDetails = ({ group, canEdit, onChangeAvatar, onChangeName }) => {
  if (!group) return null;
  return (
    <div style={{padding: 16}}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <img src={group.avatar_url || '/default-group.png'} alt="avatar" style={{width:72,height:72,borderRadius:12}} />
        <div style={{flex:1}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <h3 style={{margin:0}}>{group.group_name || group.display_name || `Nhóm ${group.id}`}</h3>
            {canEdit && <button className="btn btn-ghost" onClick={onChangeName}>Đổi tên</button>}
          </div>
          <div style={{color:'#6b7280', fontSize:13, marginTop:6}}>{group.description || ''}</div>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoDetails;
