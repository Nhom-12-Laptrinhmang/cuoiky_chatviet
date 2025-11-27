import React, { useState, useEffect } from 'react';
import { sendFriendRequest } from '../../services/socket';
import { userAPI } from '../../services/api';

const AddFriendModal = ({ isOpen, onClose }) => {
  const [target, setTarget] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState(null); // null = not searched yet

  useEffect(() => {
    if (!isOpen) return;
    // fetch suggestions (friends-of-friends) when modal opens
    (async () => {
      try {
        const resp = await userAPI.getSuggestions(6);
        setSuggestions(resp.data || []);
      } catch (e) {
        console.error('Failed to load suggestions', e);
        setSuggestions([]);
      }
      setResults(null);
      setTarget('');
      setMessage('');
    })();
  }, [isOpen]);

  // Live search while typing with debounce. If target is empty, show suggestions again.
  useEffect(() => {
    if (!isOpen) return;
    const q = (target || '').trim();
    if (!q) {
      // reset to suggestions view
      setResults(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const resp = await userAPI.searchUsers(q);
        if (!cancelled) setResults(resp.data || []);
      } catch (e) {
        if (!cancelled) {
          console.error('Search failed', e);
          setResults([]);
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [target, isOpen]);

  if (!isOpen) return null;

  const sendRequestTo = async (user) => {
    if (!user) return;
    setSending(true);
    try {
      if (user.id) {
        await userAPI.addFriend(user.id);
      } else if (user.username) {
        sendFriendRequest({ target_username: user.username });
      } else if (user.phone_number) {
        sendFriendRequest({ target_phone: user.phone_number });
      }
      setMessage(`Đã gửi lời mời tới ${user.display_name || user.username || user.id}`);
    } catch (e) {
      console.error('Failed to send friend request', e);
      setMessage('Gửi thất bại');
    } finally {
      setSending(false);
    }
  };

  const handleSearch = async () => {
    if (!target.trim()) return;
    try {
      const resp = await userAPI.searchUsers(target.trim());
      setResults(resp.data || []);
    } catch (e) {
      console.error('Search failed', e);
      setResults([]);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.18)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
      }}
    >
      <div
        className="modal medium-modal add-friend-modal"
        style={{
          position: 'relative',
          width: '680px',
          maxWidth: '32%',
          maxHeight: '86%',
          overflow: 'auto',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          background: '#fff',
        }}
      >
        <div className="modal-header" style={{position:'relative', padding:'16px 48px 12px 16px'}}>
          <h3 style={{margin:0}}>Thêm bạn</h3>
          <button
            className="close"
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              width: 32,
              height: 32,
              borderRadius: 6,
              border: 'none',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ×
          </button>
        </div>
        <div className="modal-body" style={{padding:'12px 16px 6px'}}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <input
              value={target}
              onChange={(e)=>setTarget(e.target.value)}
              placeholder="Số điện thoại hoặc username"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              style={{width:'80%', padding:'8px'}}
            />
            <div style={{flex:1}} />
          </div>

          {/* Suggestions area */}
          {results === null ? (
            <div style={{marginTop:12}}>
              <div style={{fontSize:12, fontWeight:700, color:'#6b7280', marginBottom:8}}>Có thể bạn quen</div>
                  <div style={{display:'flex', flexDirection:'column'}}>
                    {(!suggestions || suggestions.length === 0) && <div className="muted" style={{padding:12}}>Không có gợi ý</div>}
                    {(suggestions || []).map((s, idx) => (
                      <div
                        key={s.id || s.username}
                        style={{
                          display:'flex',
                          alignItems:'center',
                          justifyContent:'space-between',
                          padding:'12px',
                          background:'#fff',
                          borderBottom: idx < (suggestions || []).length - 1 ? '1px solid #eef2f6' : 'none'
                        }}
                      >
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <img src={s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.username||s.display_name||'U')}&background=667eea&color=fff`} alt={s.username} style={{width:40,height:40,borderRadius:20}} />
                          <div>
                            <div style={{fontWeight:700}}>{s.display_name || s.username}</div>
                            <div style={{fontSize:12,color:'#9ca3af'}}>{s.username || ''}</div>
                          </div>
                        </div>
                        <div>
                          <button className="btn" disabled={sending} onClick={() => sendRequestTo(s)}>Kết bạn</button>
                        </div>
                      </div>
                    ))}
                  </div>
            </div>
          ) : (
            <div style={{marginTop:12}}>
              <div style={{fontSize:12, fontWeight:700, color:'#6b7280', marginBottom:8}}>Kết quả tìm kiếm</div>
              {(results.length === 0) && <div className="muted" style={{padding:12}}>Không tìm thấy kết quả</div>}
              <div style={{display:'flex', flexDirection:'column'}}>
                {(results || []).map((r, idx) => (
                  <div
                    key={r.id || r.username}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      padding:'12px',
                      background:'#fff',
                      borderBottom: idx < (results || []).length - 1 ? '1px solid #eef2f6' : 'none'
                    }}
                  >
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                      <img src={r.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.username||r.display_name||'U')}&background=667eea&color=fff`} alt={r.username} style={{width:40,height:40,borderRadius:20}} />
                      <div>
                        <div style={{fontWeight:700}}>{r.display_name || r.username}</div>
                        <div style={{fontSize:12,color:'#9ca3af'}}>{r.username || ''}</div>
                      </div>
                    </div>
                    <div>
                      <button className="btn" disabled={sending} onClick={() => sendRequestTo(r)}>Kết bạn</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        <div className="modal-footer" style={{display:'flex', justifyContent:'flex-end', gap:8, padding:'12px 16px', borderTop: '1px solid #e5e7eb'}}>
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn" onClick={handleSearch} disabled={!target.trim()}>Tìm kiếm</button>
        </div>
        {message && <div style={{padding:'0 16px 12px'}} className="muted">{message}</div>}
      </div>
    </div>
  );
};

export default AddFriendModal;
