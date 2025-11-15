import React from 'react';

const AvatarModal = ({ isOpen, onClose, onViewProfile, onEditProfile, onLogout }) => {
  if (!isOpen) return null;
  return (
    <div className="avatar-modal-backdrop" onClick={onClose}>
      <div className="avatar-modal" onClick={(e)=>e.stopPropagation()} style={{width:340,maxWidth:'90%',borderRadius:8,boxShadow:'0 10px 30px rgba(0,0,0,0.2)',background:'#fff'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:12,borderBottom:'1px solid #eee'}}>
          <h4 style={{margin:0}}>Tùy chọn</h4>
          <button onClick={onClose} style={{border:'none',background:'transparent',fontSize:18}}>✕</button>
        </div>
        <div style={{padding:12}}>
          <button className="btn" style={{display:'block',width:'100%',textAlign:'left',marginBottom:8}} onClick={() => { onViewProfile(); onClose(); }}>Hồ sơ của bạn</button>
          <button className="btn" style={{display:'block',width:'100%',textAlign:'left',marginBottom:8}} onClick={() => { onEditProfile(); onClose(); }}>Cập nhật thông tin</button>
          <div style={{height:1,background:'#f0f0f0',margin:'8px 0'}} />
          <button className="btn btn-danger" style={{display:'block',width:'100%',textAlign:'left'}} onClick={() => { onLogout(); onClose(); }}>Đăng xuất</button>
        </div>
      </div>
    </div>
  );
};

export default AvatarModal;
