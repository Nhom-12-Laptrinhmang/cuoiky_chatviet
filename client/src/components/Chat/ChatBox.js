import React, { useEffect, useState } from 'react';
import { initializeSocket, sendMessage, onReceiveMessage, joinUserRoom, sendReaction, onReaction, sendTyping, onTyping } from '../../services/socket';
import { userAPI, messageAPI, groupAPI } from '../../services/api';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import LogoutButton from '../Auth/LogoutButton';
import ProfileModal from './ProfileModal';
import AvatarModal from './AvatarModal';
import EditProfileModal from './EditProfileModal';

/**
 * ChatBox - Giao diện chat chính
 * Kết nối Socket.IO, hiển thị danh sách messages, gửi tin nhắn
 */
const ChatBox = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [typing, setTyping] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');

  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [filterTab, setFilterTab] = useState('conversations');
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [otherProfileOpen, setOtherProfileOpen] = useState(false);
  const [otherProfileUser, setOtherProfileUser] = useState(null);
  
  // New states for reply/forward/reaction
  const [replyTo, setReplyTo] = useState(null);
  const [reactions, setReactions] = useState({});
  const [remotePeerIsTyping, setRemotePeerIsTyping] = useState(false);

  // Khởi tạo Socket.IO khi component mount
  useEffect(() => {
    // Initialize socket first so we can emit join after we fetch the user
    const socket = initializeSocket();

    const loadCurrent = async () => {
      try {
        const resp = await userAPI.getCurrent();
        const user = resp.data;
        setCurrentUsername(user.username);
        setCurrentUserId(user.id);
  setCurrentUserProfile(user);
  localStorage.setItem('username', user.username);
        // Join the user's personal socket room by id for reliable delivery
        if (user && user.id) {
          joinUserRoom(user.id);
        } else if (user && user.username) {
          // fallback to legacy room by username if id isn't present
          socket.emit('join', { username: user.username, room: 'chat_room' });
        }
      } catch (err) {
        // fallback to localStorage if /me fails
        const stored = localStorage.getItem('username');
        setCurrentUsername(stored);
        if (stored) {
          socket.emit('join', { username: stored, room: 'chat_room' });
        }
      }
    };

    loadCurrent();

    return () => {
      // Cleanup khi unmount
    };
  }, []);

  // Setup receive message listener after currentUserId is set
  useEffect(() => {
    if (!currentUserId) return;
    
    onReceiveMessage((data) => {
      console.log('[CHAT] Received message:', data);
      const isSent = data.sender_id === currentUserId;
      setMessages((prev) => {
        // If message with same id already exists, ignore
        if (prev.some((m) => m.id === data.id)) return prev;

        // If there is an optimistic message (sent by current user) with same content,
        // replace it with the server-saved message (to normalize id/timestamp).
        const optimisticIndex = prev.findIndex(
          (m) => m.isSent && m.content === data.content
        );
        if (optimisticIndex !== -1) {
          const copy = [...prev];
          copy[optimisticIndex] = { ...data, isSent };
          return copy;
        }

        return [...prev, { ...data, isSent }];
      });
    });

    // Setup reaction listener
    onReaction((data) => {
      console.log('[REACTION]', data);
      setReactions((prev) => ({
        ...prev,
        [data.message_id]: { reaction: data.reaction, user_id: data.user_id }
      }));
    });

    // Setup typing listener
    onTyping((data) => {
      console.log('[TYPING]', data);
      setRemotePeerIsTyping(data.is_typing);
    });
  }, [currentUserId]);

  // Tải dữ liệu phụ thuộc tab (conversations / contacts / all)
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const resp = await groupAPI.getMyGroups();
        setGroups(resp.data || []);
      } catch (err) {
        console.error('Lỗi tải nhóm:', err);
      }
    };

    const fetchFriendRequests = async () => {
      try {
        const resp = await userAPI.getFriendRequests();
        setFriendRequests(resp.data || []);
      } catch (err) {
        console.error('Lỗi tải lời mời kết bạn:', err);
      }
    };

    const fetchSuggestions = async () => {
      try {
        const resp = await userAPI.getSuggestions(6);
        setSuggestions(resp.data || []);
      } catch (err) {
        console.error('Lỗi tải gợi ý kết bạn:', err);
      }
    };

    const loadListForTab = async () => {
      try {
        if (filterTab === 'conversations') {
          // fetch conversation summaries for current user
          const resp = await messageAPI.getConversations();
          // map conversations to items for the list
          const convs = (resp.data || []).map((c) => {
            if (c.type === 'user') {
              return {
                id: c.id,
                username: c.username,
                display_name: c.display_name || c.username,
                last_message: c.last_message,
                is_group: false,
              };
            }
            return {
              id: c.id,
              username: null,
              display_name: c.group_name || `Group ${c.id}`,
              last_message: c.last_message,
              is_group: true,
            };
          });
          setUsers(convs);
        } else if (filterTab === 'contacts') {
          const resp = await userAPI.getFriends();
          // friends endpoint returns users
          setUsers(resp.data || []);
        } else {
          const resp = await userAPI.getUsers();
          setUsers(resp.data || []);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách cho tab:', err);
        // fallback to all users
        try {
          const resp = await userAPI.getUsers();
          setUsers(resp.data || []);
        } catch (e) {
          console.error('Fallback users failed', e);
        }
      }
    };

    // Load common data and the tab-specific list
    fetchGroups();
    fetchFriendRequests();
    fetchSuggestions();
    loadListForTab();
  }, [filterTab]);

  // Search box debounce: when searchQuery changes, call /users/search or reload all users
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (searchQuery.trim()) {
          const resp = await userAPI.searchUsers(searchQuery.trim());
          setUsers(resp.data || []);
        } else {
          // reload according to current tab
          if (filterTab === 'conversations') {
            const resp = await messageAPI.getConversations();
            const convs = (resp.data || []).map((c) => {
              if (c.type === 'user') {
                return {
                  id: c.id,
                  username: c.username,
                  display_name: c.display_name || c.username,
                  last_message: c.last_message,
                  is_group: false,
                };
              }
              return {
                id: c.id,
                username: null,
                display_name: c.group_name || `Group ${c.id}`,
                last_message: c.last_message,
                is_group: true,
              };
            });
            setUsers(convs);
          } else if (filterTab === 'contacts') {
            const resp = await userAPI.getFriends();
            setUsers(resp.data || []);
          } else {
            const resp = await userAPI.getUsers();
            setUsers(resp.data || []);
          }
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm users:', err);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Tải messages khi chọn user
  useEffect(() => {
    if (selectedUser && currentUserId) {
      const loadMessages = async () => {
        try {
          const response = await messageAPI.getMessages(currentUserId, selectedUser.id);
          // Normalize and dedupe messages by id, and mark sent vs received
          const raw = response.data || [];
          const seen = new Set();
          const normalized = raw.reduce((acc, m) => {
            if (seen.has(m.id)) return acc;
            seen.add(m.id);
            acc.push({ ...m, isSent: m.sender_id === currentUserId });
            return acc;
          }, []);
          setMessages(normalized);
        } catch (error) {
          console.error('Lỗi tải messages:', error);
        }
      };

      loadMessages();
    }
  }, [selectedUser, currentUserId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;

    // Gửi qua Socket.IO (với hỗ trợ reply_to)
    sendMessage(currentUserId, selectedUser.id, messageText, {
      reply_to_id: replyTo?.id || null,
    });

    // Thêm vào giao diện ngay lập tức
    const newMessage = {
      id: Date.now(),
      content: messageText,
      timestamp: new Date().toISOString(),
      isSent: true,
      sender_id: currentUserId,
      reply_to_id: replyTo?.id || null,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessageText('');
    setReplyTo(null);  // Reset reply state
    
    // Stop typing
    sendTyping(currentUserId, selectedUser.id, false);
  };

  // Handle input change and send typing indicator
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessageText(value);
    
    // Send typing indicator only if selectedUser exists
    if (selectedUser && currentUserId) {
      sendTyping(currentUserId, selectedUser.id, value.length > 0);
    }
  };

  // Open another user's public profile modal
  const openUserProfile = async (userId) => {
    try {
      const resp = await userAPI.getUserById(userId);
      setOtherProfileUser(resp.data);
      setOtherProfileOpen(true);
    } catch (err) {
      console.error('Lỗi tải profile người dùng:', err);
      alert('Không thể tải thông tin người dùng');
    }
  };

  return (
    <div className="chat-container">
      {/* Left navigation column */}
      <aside className="left-nav">
        <div className="profile" style={{position:'relative'}}>
          {/* placeholder profile image or icon */}
          <img alt="profile" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUsername||'U')}&background=ffffff&color=0b5ed7`} onClick={(e) => {
            // open avatar modal
            setAvatarMenuOpen((v)=>!v);
          }} style={{cursor:'pointer',borderRadius:8}} />
        </div>
        <div className="nav-icons">
          <button
            className="nav-btn"
            title="Tin nhắn"
            onClick={() => {
              // show conversations (people/groups you've messaged)
              setFilterTab('conversations');
            }}
          >💬</button>
          <button
            className="nav-btn"
            title="Danh bạ"
            onClick={() => {
              // show accepted friends/contacts
              setFilterTab('contacts');
            }}
          >👥</button>
          <button
            className="nav-btn"
            title="Cloud của tôi"
            onClick={() => {
              // quick action: open uploads folder in a new tab (not implemented server-side)
              alert('Mở Cloud (chưa triển khai)');
            }}
          >☁️</button>
          <button
            className="nav-btn"
            title="Cài đặt"
            onClick={async () => {
              // simple settings: change display name
              const newName = window.prompt('Nhập tên hiển thị mới:', '');
              if (!newName) return;
              try {
                await userAPI.updateMe({ display_name: newName });
                // refresh current user and users list
                const me = await userAPI.getCurrent();
                setCurrentUsername(me.data.username);
                setCurrentUserProfile(me.data);
                // update users list to reflect change
                const all = await userAPI.getUsers();
                setUsers(all.data || []);
                alert('Đã cập nhật tên hiển thị');
              } catch (err) {
                console.error('Lỗi cập nhật tên:', err);
                alert('Cập nhật thất bại');
              }
            }}
          >⚙️</button>
        </div>
      </aside>

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={currentUserProfile || { username: currentUsername, id: currentUserId }}
        onUpdated={async (u) => {
          // update local profile state and refresh lists after update
          if (u) setCurrentUserProfile(u);
          try {
            const all = await userAPI.getUsers();
            setUsers(all.data || []);
          } catch (e) {}
          // keep profile modal open (we return to view mode inside the modal)
        }}
        onOpenEdit={() => {
          // open edit screen as a separate view: close profile modal and open edit modal
          setProfileOpen(false);
          setAvatarMenuOpen(false);
          setEditProfileOpen(true);
        }}
      />

      {/* Profile modal for viewing other users' public profiles */}
      <ProfileModal
        isOpen={otherProfileOpen}
        onClose={() => { setOtherProfileOpen(false); setOtherProfileUser(null); }}
        user={otherProfileUser}
        isOwner={false}
        onUpdated={null}
        onStartChat={(u) => {
          // u is the full user object returned by GET /users/:id
          if (u) {
            setSelectedUser(u);
            setOtherProfileOpen(false);
            setOtherProfileUser(null);
          }
        }}
      />

      {avatarMenuOpen && (
        // When user selects 'Cập nhật thông tin' from the avatar menu we should show the profile modal first
        // so they see their info; they can then press Cập nhật inside the profile to open the edit panel.
        <AvatarModal
          isOpen={avatarMenuOpen}
          onClose={() => setAvatarMenuOpen(false)}
          onViewProfile={() => { setAvatarMenuOpen(false); setProfileOpen(true); }}
          onEditProfile={() => { setAvatarMenuOpen(false); setProfileOpen(true); /* user will press Cập nhật inside profile to edit */ }}
          onLogout={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
        />
      )}

      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={currentUserProfile || { username: currentUsername, id: currentUserId }}
        onSaved={(u)=>{
          if(u) setCurrentUserProfile(u);
        }}
        onBack={() => {
          // when returning from edit view, show profile modal again
          setEditProfileOpen(false);
          setProfileOpen(true);
        }}
      />

      {/* Conversation list (center column) */}
      <aside className="chat-sidebar conversation-list">
        <div className="sidebar-header">
          <h2>💬 Danh sách</h2>
        </div>
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm người hoặc cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="user-search-input"
          />
        </div>
        <div className="conv-banner">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:10,background:'#e6f0ff'}}>💻</div>
            <div style={{flex:1}}>Khi đăng nhập Zalo Web trên nhiều trình duyệt, một số trò chuyện sẽ không đủ tin nhắn cũ.</div>
            <button className="link-btn" onClick={() => { /* TODO: open download link */ }}>Tải ngay</button>
          </div>
        </div>
        <div className="filter-bar">
          <button className={`filter ${filterTab==='priority'?'active':''}`} onClick={() => setFilterTab('priority')}>Ưu tiên</button>
          <button className={`filter ${filterTab==='others'?'active':''}`} onClick={() => setFilterTab('others')}>Khác</button>
          <button className={`filter ${filterTab==='all'?'active':''}`} onClick={() => setFilterTab('all')}>Tất cả</button>
        </div>
        <div className="users-list">
          {friendRequests.length > 0 && (
            <div className="friend-requests">
              <h4>Lời mời kết bạn</h4>
              {friendRequests.map((r) => (
                <div key={r.rel_id} className="friend-request-item">
                  <span>{r.username}</span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await userAPI.acceptFriend(r.user_id);
                        alert('Đã chấp nhận');
                        // refresh lists
                        const resp = await userAPI.getFriendRequests();
                        setFriendRequests(resp.data || []);
                        const usersResp = await userAPI.getUsers();
                        setUsers(usersResp.data || []);
                      } catch (err) {
                        alert('Lỗi chấp nhận');
                      }
                    }}
                  >
                    Chấp nhận
                  </button>
                </div>
              ))}
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="suggestions">
              <h4>Gợi ý kết bạn</h4>
              {suggestions.map((u) => (
                <div key={u.id} className="suggestion-item">
                  <span>{u.username}</span>
                  {currentUserId && currentUserId !== u.id && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await userAPI.addFriend(u.id);
                          alert('Đã gửi lời mời kết bạn');
                          const resp = await userAPI.getSuggestions(6);
                          setSuggestions(resp.data || []);
                        } catch (err) {
                          alert('Lỗi gửi lời mời');
                        }
                      }}
                    >
                      Thêm
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {users.map((user) => (
            <div
              key={user.id}
              className={`conversation-item ${selectedUser?.id === user.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="conv-avatar" onClick={(e) => { e.stopPropagation(); openUserProfile(user.id); }} style={{cursor:'pointer'}}>{user.username[0]?.toUpperCase()}</div>
              <div className="conv-body">
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div className="conv-title" onClick={(e) => { e.stopPropagation(); if (!user.is_group) openUserProfile(user.id); }} style={{cursor: user.is_group ? 'default' : 'pointer'}}>{user.display_name || user.username}</div>
                  <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:6}}>
                    <div className="conv-meta">{user.status === 'online' ? '🟢' : ''}</div>
                    {/* placeholder time */}
                    <div className="conv-meta"> </div>
                  </div>
                </div>
                <div className="conv-preview">{user.status === 'online' ? 'Đang online' : 'Chưa có tin nhắn'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="groups-section">
          <div className="groups-header">
            <h3>Nhóm</h3>
            <button
              className="btn-create-group"
              onClick={async () => {
                const name = window.prompt('Tên nhóm mới:');
                if (!name) return;
                try {
                  await groupAPI.createGroup(name);
                  const resp = await groupAPI.getMyGroups();
                  setGroups(resp.data || []);
                  alert('Đã tạo nhóm');
                } catch (err) {
                  alert('Lỗi tạo nhóm');
                }
              }}
            >
              Tạo
            </button>
          </div>
          <div className="groups-list">
            {groups.map((g) => (
              <div key={g.id} className="group-item">
                <span>{g.name}</span>
                <button
                  className="btn-group-members"
                  onClick={async () => {
                    try {
                      const resp = await groupAPI.getGroupMembers(g.id);
                      const names = resp.data.map((u) => u.username).join(', ');
                      alert(`Thành viên: ${names}`);
                    } catch (err) {
                      alert('Lỗi lấy thành viên');
                    }
                  }}
                >
                  Thành viên
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="chat-main">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div>
                <h3>{selectedUser.username}</h3>
                <p className="status">{selectedUser.status === 'online' ? '🟢 Online' : '⚪ Offline'}</p>
              </div>
              {/* Show typing indicator in header */}
              {remotePeerIsTyping && (
                <TypingIndicator userName={selectedUser.display_name || selectedUser.username} isTyping={true} />
              )}
            </div>

            {/* Messages Area */}
            <div className="messages-area">
              {messages.length === 0 ? (
                <p className="no-messages">Chưa có tin nhắn nào. Hãy bắt đầu cuộc hội thoại! 👋</p>
              ) : (
                messages.map((msg, idx) => (
                  <MessageBubble
                    key={idx}
                    message={msg}
                    isSent={msg.isSent}
                    onReply={(message) => {
                      setReplyTo(message);
                      // Auto-focus input
                      document.querySelector('.message-input')?.focus();
                    }}
                    onReaction={(messageId, emoji) => {
                      sendReaction(messageId, currentUserId, emoji);
                    }}
                  />
                ))
              )}
              <TypingIndicator userName={null} isTyping={false} />
            </div>

            {/* Reply Preview */}
            {replyTo && (
              <div style={{
                background: '#f0f0f0',
                padding: '8px 12px',
                borderLeft: '3px solid #0b5ed7',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Trả lời</div>
                  <div style={{ fontSize: '13px' }}>{replyTo.content}</div>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="message-input-form">
              <input
                type="text"
                value={messageText}
                onChange={handleInputChange}
                onFocus={() => setTyping(true)}
                onBlur={() => {
                  setTyping(false);
                  // Stop typing when focus lost
                  if (selectedUser && currentUserId) {
                    sendTyping(currentUserId, selectedUser.id, false);
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="message-input"
              />
              <button type="submit" className="btn-send">
                📤 Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <p>👈 Chọn một bạn để bắt đầu cuộc hội thoại</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatBox;
