import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import Icon from '../Icon';

interface GroupRolesManagerProps {
  chatId: number;
  currentUserId: number;
  isAdmin: boolean;
}

interface Member {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  role: string;
}

const GroupRolesManager: React.FC<GroupRolesManagerProps> = ({ chatId, currentUserId, isAdmin }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
  }, [chatId]);

  const loadMembers = async () => {
    try {
      const res = await apiClient.get(`/chats/${chatId}/members`);
      setMembers(res.data);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (userId: number, newRole: string) => {
    if (!isAdmin) return;
    try {
      await apiClient.post(`/chats/${chatId}/role`, { user_id: userId, role: newRole });
      loadMembers();
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const removeMember = async (userId: number) => {
    if (!isAdmin) return;
    if (confirm('Удалить участника из группы?')) {
      try {
        await apiClient.delete(`/chats/${chatId}/members/${userId}`);
        loadMembers();
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  };

  const filteredMembers = members.filter(m =>
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const admins = filteredMembers.filter(m => m.role === 'owner' || m.role === 'admin');
  const moderators = filteredMembers.filter(m => m.role === 'moderator');
  const regulars = filteredMembers.filter(m => m.role === 'member');

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Владелец';
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      default: return 'Участник';
    }
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="group-roles-manager">
      <div className="search-members">
        <Icon name="search" size={18} />
        <input
          type="text"
          placeholder="Поиск участников"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="members-sections">
        {admins.length > 0 && (
          <div className="members-section">
            <div className="section-title">Администраторы ({admins.length})</div>
            {admins.map(member => (
              <div key={member.user_id} className="member-item">
                <div className="member-avatar">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" />
                  ) : (
                    <span>{member.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.first_name} {member.last_name}</div>
                  <div className="member-username">@{member.username}</div>
                  <span className="member-role">{getRoleLabel(member.role)}</span>
                </div>
                {isAdmin && member.user_id !== currentUserId && (
                  <div className="member-actions">
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.user_id, e.target.value)}
                      className="role-select"
                    >
                      <option value="member">Участник</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Администратор</option>
                    </select>
                    <button className="remove-btn" onClick={() => removeMember(member.user_id)}>
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {moderators.length > 0 && (
          <div className="members-section">
            <div className="section-title">Модераторы ({moderators.length})</div>
            {moderators.map(member => (
              <div key={member.user_id} className="member-item">
                <div className="member-avatar">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" />
                  ) : (
                    <span>{member.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.first_name} {member.last_name}</div>
                  <div className="member-username">@{member.username}</div>
                  <span className="member-role">{getRoleLabel(member.role)}</span>
                </div>
                {isAdmin && member.user_id !== currentUserId && (
                  <div className="member-actions">
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.user_id, e.target.value)}
                      className="role-select"
                    >
                      <option value="member">Участник</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Администратор</option>
                    </select>
                    <button className="remove-btn" onClick={() => removeMember(member.user_id)}>
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {regulars.length > 0 && (
          <div className="members-section">
            <div className="section-title">Участники ({regulars.length})</div>
            {regulars.map(member => (
              <div key={member.user_id} className="member-item">
                <div className="member-avatar">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" />
                  ) : (
                    <span>{member.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.first_name} {member.last_name}</div>
                  <div className="member-username">@{member.username}</div>
                  <span className="member-role">{getRoleLabel(member.role)}</span>
                </div>
                {isAdmin && member.user_id !== currentUserId && (
                  <div className="member-actions">
                    <select
                      value={member.role}
                      onChange={(e) => changeRole(member.user_id, e.target.value)}
                      className="role-select"
                    >
                      <option value="member">Участник</option>
                      <option value="moderator">Модератор</option>
                      <option value="admin">Администратор</option>
                    </select>
                    <button className="remove-btn" onClick={() => removeMember(member.user_id)}>
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .group-roles-manager {
          padding: 16px;
        }
        .search-members {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .search-members input {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-primary);
          outline: none;
        }
        .members-section {
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .member-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-primary);
          border-radius: 12px;
          margin-bottom: 8px;
        }
        .member-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .member-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .member-info {
          flex: 1;
        }
        .member-name {
          font-weight: 600;
          font-size: 0.9rem;
        }
        .member-username {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
        .member-role {
          font-size: 0.7rem;
          color: var(--accent);
        }
        .member-actions {
          display: flex;
          gap: 8px;
        }
        .role-select {
          padding: 6px 10px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
        }
        .remove-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid var(--danger);
          color: var(--danger);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default GroupRolesManager;