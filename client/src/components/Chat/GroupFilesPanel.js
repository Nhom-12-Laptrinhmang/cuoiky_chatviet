import React from 'react';

const GroupFilesPanel = ({ files = [] }) => {
  return (
    <div style={{padding:'12px 16px'}}>
      <div style={{fontWeight:700, marginBottom:8}}>Tệp chia sẻ</div>
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {(files || []).map((f, idx) => (
          <a key={idx} href={f.url} target="_blank" rel="noreferrer" style={{display:'flex', justifyContent:'space-between', padding:8, borderRadius:6, background:'#fff', border:'1px solid #f1f5f9'}}>
            <div>{f.name || f.filename}</div>
            <div style={{color:'#6b7280', fontSize:12}}>{f.size ? `${(f.size/1024).toFixed(1)} KB` : ''}</div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default GroupFilesPanel;
