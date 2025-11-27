import React from 'react';

const GroupMediaPanel = ({ media = [] }) => {
  return (
    <div style={{padding:'12px 16px'}}>
      <div style={{fontWeight:700, marginBottom:8}}>Ảnh/Video</div>
      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        {(media || []).slice(0,12).map((m, idx) => (
          <div key={idx} style={{width:72, height:72, borderRadius:8, overflow:'hidden', background:'#f8fafc'}}>
            <img src={m.url} alt={m.name || 'media'} style={{width:'100%', height:'100%', objectFit:'cover'}} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupMediaPanel;
