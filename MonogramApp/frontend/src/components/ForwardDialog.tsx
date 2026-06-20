import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface Props {
  messageId: number;
  onClose: () => void;
  onDone: () => void;
}

interface ChatMember {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role?: string;
}

const ForwardDialog: React.FC<Props> = ({ messageId, onClose, onDone }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<number, ChatMember[]>>({});
  const [memberSelections, setMemberSelections] = useState<Record<number, boolean>>({});
  const [selectEveryone, setSelectEveryone] = useState(true);

  useEffect(() => {
    apiClient.get('/chats').then(res => {
      setChats(res.data?.chats || res.data || []);
    }).catch(() => {});
  }, []);

  const loadGroupMembers = async (chatId: number) => {
    if (groupMembers[chatId]) return;
    try {
      const res = await apiClient.get(`/chats/${chatId}/members`);
      setGroupMembers(prev => ({ ...prev, [chatId]: res.data || [] }));
    } catch (err) { console.error('Failed to load members:', err); }
  };

  const toggleGroupExpand = (chatId: number) => {
    if (expandedGroup === chatId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(chatId);
      loadGroupMembers(chatId);
    }
  };

  const handleMemberToggle = (userId: number) => {
    setMemberSelections(prev => {
      const updated = { ...prev, [userId]: !prev[userId] };
      // If all members selected, also select "Everyone"
      const chatId = expandedGroup;
      if (chatId && groupMembers[chatId]) {
        const allSelected = groupMembers[chatId].every(m => updated[m.user_id]);
        setSelectEveryone(allSelected);
      }
      return updated;
    });
  };

  const handleEveryoneToggle = () => {
    const newVal = !selectEveryone;
    setSelectEveryone(newVal);
    if (expandedGroup && groupMembers[expandedGroup]) {
      const updates: Record<number, boolean> = {};
      groupMembers[expandedGroup].forEach(m => { updates[m.user_id] = newVal; });
      setMemberSelections(prev => ({ ...prev, ...updates }));
    }
  };

  const handleForward = async () => {
    setLoading(true);
    try {
      const targetIds = [...selected];

      // If group is expanded and members selected, add individual member chat IDs
      if (expandedGroup && groupMembers[expandedGroup]) {
        const selectedMembers = groupMembers[expandedGroup].filter(
          m => memberSelections[m.user_id]
        );
        if (!selectEveryone && selectedMembers.length > 0) {
          // Forward to individual members (generate private chat IDs)
          for (const member of selectedMembers) {
            const privateChatId = generatePrivateChatId(member.user_id);
            targetIds.push(privateChatId);
          }
          // Remove group ID from targets
          const groupIdx = targetIds.indexOf(expandedGroup);
          if (groupIdx > -1) targetIds.splice(groupIdx, 1);
        }
      }

      await apiClient.post('/messages/forward', {
        message_id: messageId,
        chat_ids: targetIds.length > 0 ? targetIds : selected
      });
      onDone();
    } catch (err) { console.error('Forward error:', err); }
    setLoading(false);
  };

  const generatePrivateChatId = (userId: number) => {
    return 100000 + userId;
  };

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const filtered = chats.filter(c =>
    (c.name || c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content forward-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Forward Message</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <input
          className="search-input"
          placeholder="Search chats..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
        <div className="forward-chat-list">
          {filtered.map(chat => {
            const isGroup = chat.type === 'group';
            const isExpanded = expandedGroup === chat.id;
            const members = groupMembers[chat.id] || [];

            return (
              <div key={chat.id}>
                <div
                  className={`forward-chat-item ${selected.includes(chat.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (isGroup) toggleGroupExpand(chat.id);
                    toggle(chat.id);
                  }}
                >
                  <div className="forward-chat-avatar">
                    {(chat.name || chat.title || '?').charAt(0).toUpperCase()}
                  </div>
                  <span>{chat.name || chat.title || 'Chat'}</span>
                  {isGroup && <span className="forward-expand">{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>}
                  {selected.includes(chat.id) && <span className="forward-check">OK</span>}
                </div>

                {isExpanded && members.length > 0 && (
                  <div className="forward-member-list">
                    <div className="forward-member-item" onClick={handleEveryoneToggle}>
                      <div className="member-avatar">ALL</div>
                      <span>Everyone</span>
                      <span className="member-check">{selectEveryone ? 'OK' : ''}</span>
                    </div>
                    {members.map(m => (
                      <div
                        key={m.user_id}
                        className="forward-member-item"
                        onClick={(e) => { e.stopPropagation(); handleMemberToggle(m.user_id); }}
                      >
                        <div className="member-avatar">
                          {(m.first_name || m.username).charAt(0).toUpperCase()}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{m.first_name} {m.last_name}</span>
                          <span className="member-username">@{m.username}</span>
                        </div>
                        <span className="member-check">{memberSelections[m.user_id] ? 'OK' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="empty-state">Nothing found</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleForward}
            disabled={(selected.length === 0 && Object.keys(memberSelections).length === 0) || loading}
          >
            {loading ? 'Sending...' : `Forward (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardDialog;