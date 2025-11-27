import React from 'react';

const GroupSecuritySettings = ({ settings = {}, onLeaveGroup, onDeleteHistory, onReport }) => {
  return (
    <div style={{padding:'12px 16px'}}>
      <div style={{fontWeight:700, marginBottom:8}}>Thiết lập bảo mật</div>
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:8, borderRadius:6, background:'#fff', border:'1px solid #f1f5f9'}}>
          <div>
            <div style={{fontWeight:600}}>Tin nhắn tự hủy</div>
            <div style={{fontSize:12,color:'#6b7280'}}>Thiết lập thời gian tự hủy cho tin nhắn</div>
          </div>
          <input type="checkbox" checked={!!settings.self_destruct} readOnly />
        </label>

        <label style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:8, borderRadius:6, background:'#fff', border:'1px solid #f1f5f9'}}>
          <div>
            <div style={{fontWeight:600}}>Ẩn cuộc trò chuyện</div>
            <div style={{fontSize:12,color:'#6b7280'}}>Ẩn cuộc trò chuyện khỏi danh sách</div>
          </div>
          <input type="checkbox" checked={!!settings.hidden} readOnly />
        </label>

        <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:8}}>
          <button
            className="btn btn-ghost"
            onClick={onReport}
            style={{width: '100%', display:'flex', alignItems:'center', gap:10, justifyContent:'flex-start', padding:'10px 12px'}}
          >
            <span style={{fontSize:16}}>⚠️</span>
            <span style={{flex:1, textAlign:'left'}}>Báo xấu</span>
          </button>

          <button
            className="btn btn-danger"
            onClick={onDeleteHistory}
            style={{width: '100%', display:'flex', alignItems:'center', gap:10, justifyContent:'flex-start', padding:'10px 12px'}}
          >
            <span style={{fontSize:16}}>🗑️</span>
            <span style={{flex:1, textAlign:'left'}}>Xóa lịch sử trò chuyện</span>
          </button>

          <button
            className="btn btn-danger"
            onClick={onLeaveGroup}
            style={{width: '100%', display:'flex', alignItems:'center', gap:10, justifyContent:'flex-start', padding:'10px 12px'}}
          >
            <span style={{fontSize:16}}>⤴️</span>
            <span style={{flex:1, textAlign:'left'}}>Rời nhóm</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSecuritySettings;
