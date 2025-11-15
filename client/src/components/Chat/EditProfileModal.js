import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import api from '../../services/api';

const EditProfileModal = ({ isOpen, onClose, user, onSaved, onBack }) => {
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [birthdate, setBirthdate] = useState(user?.birthdate || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [file, setFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  useEffect(() => {
    setDisplayName(user?.display_name || user?.username || '');
    setGender(user?.gender || '');
    setBirthdate(user?.birthdate || '');
    setPhoneNumber(user?.phone_number || '');
    setAvatarPreview(user?.avatar_url || '');
    setFile(null);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const onFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSave = async () => {
    try {
      let avatar_url = avatarPreview;
      if (file) {
        const form = new FormData();
        form.append('avatar', file);
        const upResp = await api.post('/uploads/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        avatar_url = upResp.data.avatar_url;
      }
      const payload = { display_name: displayName };
      if (avatar_url) payload.avatar_url = avatar_url;
      if (gender) payload.gender = gender;
      if (birthdate) payload.birthdate = birthdate;
      if (phoneNumber) payload.phone_number = phoneNumber;
      const resp = await userAPI.updateMe(payload);
      onSaved && onSaved(resp.data);
      onClose();
    } catch (err) {
      console.error('Save profile failed', err);
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message;
      alert(serverMsg ? `Lưu thất bại: ${serverMsg}` : 'Lưu thất bại');
    }
  };

  // Render as a right-side panel (drawer) to match requested UI
  return (
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:420,background:'#fff',zIndex:1200,boxShadow:'-8px 0 24px rgba(0,0,0,0.12)',display:'flex',flexDirection:'column'}}>
      {/* left blue strip */}
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:12,background:'#0b5ed7'}} />

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #eee'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="btn" onClick={() => { if (onBack) onBack(); else onClose(); }} style={{marginLeft:4}}>◀</button>
          <h3 style={{margin:0,fontSize:18}}>Cập nhật thông tin cá nhân</h3>
        </div>
        <button onClick={onClose} style={{border:'none',background:'transparent',fontSize:18}}>✕</button>
      </div>

      <div style={{overflowY:'auto',padding:20,flex:1,background:'#f7f7f7'}}>
        <div style={{display:'flex',gap:20}}>
          <div style={{width:200,display:'flex',flexDirection:'column',alignItems:'center'}}>
            <div style={{width:160,height:160,borderRadius:80,overflow:'hidden',background:'#f0f0f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'#333'}}>
              {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (displayName ? displayName.split(' ').map(s=>s[0]).join('').toUpperCase() : (user?.username||'U')[0].toUpperCase())}
            </div>
            <div style={{marginTop:12}}>
              <label className="btn">Chọn ảnh<input type="file" accept="image/*" onChange={onFileChange} style={{display:'none'}} /></label>
            </div>
          </div>

          <div style={{flex:1}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr',gap:14}}>
              <div className="form-group">
                <label>Tên hiển thị</label>
                <input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Giới tính</label>
                <div style={{display:'flex',gap:20,alignItems:'center'}}>
                  <label style={{display:'flex',alignItems:'center',gap:6}}><input type="radio" name="g" value="male" checked={gender==='male'} onChange={()=>setGender('male')} /> Nam</label>
                  <label style={{display:'flex',alignItems:'center',gap:6}}><input type="radio" name="g" value="female" checked={gender==='female'} onChange={()=>setGender('female')} /> Nữ</label>
                </div>
              </div>

              <div className="form-group">
                <label>Ngày sinh</label>
                <input type="date" value={birthdate||''} onChange={(e)=>setBirthdate(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input value={phoneNumber||''} onChange={(e)=>setPhoneNumber(e.target.value)} />
              </div>

              <div style={{marginTop:6,display:'flex',gap:12}}>
                <button className="btn btn-primary" onClick={async () => {
                  await handleSave();
                  if (onBack) onBack();
                }}>Lưu</button>
                <button className="btn" style={{marginLeft:8}} onClick={() => { if (onBack) onBack(); else onClose(); }}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
