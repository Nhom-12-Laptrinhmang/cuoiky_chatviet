import React from 'react';

const AvatarMenu = ({ x=0, y=0, onClose, onViewProfile, onLogout }) => {
  // simple positioned menu
  const style = {
    position: 'absolute',
    left: x,
    top: y,
    background: '#fff',
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    borderRadius:6,
    padding:8,
    zIndex:2000,
    minWidth:180,
  };

  return (
    <div style={style} onMouseLeave={onClose}>
      <div style={{padding:'8px 12px',cursor:'pointer'}} onClick={()=>{onViewProfile(); onClose();}}>Hồ sơ của bạn</div>
      <div style={{padding:'8px 12px',cursor:'pointer'}} onClick={()=>{ /* settings placeholder */ alert('Cài đặt (chưa triển khai)'); onClose();}}>Cài đặt</div>
      <div style={{height:1,background:'#eee',margin:'6px 0'}} />
      <div style={{padding:'8px 12px',cursor:'pointer',color:'#c00'}} onClick={()=>{onLogout(); onClose();}}>Đăng xuất</div>
    </div>
  );
};

export default AvatarMenu;
