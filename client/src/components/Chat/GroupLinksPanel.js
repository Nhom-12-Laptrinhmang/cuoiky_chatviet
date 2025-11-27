import React from 'react';

const GroupLinksPanel = ({ links = [] }) => {
  return (
    <div style={{padding:'12px 16px'}}>
      <div style={{fontWeight:700, marginBottom:8}}>Links</div>
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {(links || []).map((l, idx) => (
          <a key={idx} href={l.url} target="_blank" rel="noreferrer" style={{padding:8, borderRadius:6, background:'#fff', border:'1px solid #f1f5f9'}}>{l.title || l.url}</a>
        ))}
      </div>
    </div>
  );
};

export default GroupLinksPanel;
