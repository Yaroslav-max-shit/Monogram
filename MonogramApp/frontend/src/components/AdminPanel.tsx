import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';
import './AdminPanel.css';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_active: boolean;
  is_bot: boolean;
  created_at: string;
}

interface ChatStats {
  id: number;
  type: string;
  name: string;
  members_count: number;
  messages_count: number;
  created_at: string;
}

interface SystemStats {
  total_users: number;
  total_chats: number;
  total_messages: number;
  active_today: number;
}

const AdminPanel: React.FC<{ onBack: () => void; onLogout: () => void }> = ({ onBack, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'chats' | 'admins' | 'settings'>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<ChatStats[]>([]);
  const [stats, setStats] = useState<SystemStats>({ total_users: 0, total_chats: 0, total_messages: 0, active_today: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: number } | null>(null);
  const [selectedAdmins, setSelectedAdmins] = useState<number[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    await Promise.all([
      loadStats(),
      loadUsers(),
      loadChats(),
    ]);
    
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/admin/stats');
      setStats(res.data);
    } catch (e: any) {
      console.error('Ошибка загрузки статистики:', e);
      setError('Ошибка загрузки статистики: ' + (e.response?.data?.detail || e.message));
    }
  };

  const loadUsers = async () => {
    try {
      const res = await apiClient.get('/admin/users');
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch (e: any) {
      console.error('Ошибка загрузки пользователей:', e);
    }
    
    try {
      const adminsRes = await apiClient.get('/admin/admins');
      if (Array.isArray(adminsRes.data)) {
        setSelectedAdmins(adminsRes.data.map((u: any) => u.id));
      }
    } catch (e: any) {
      console.error('Ошибка загрузки админов:', e);
    }
  };

  const loadChats = async () => {
    try {
      const res = await apiClient.get('/admin/chats');
      if (Array.isArray(res.data)) {
        setChats(res.data);
      }
    } catch (e: any) {
      console.error('Ошибка загрузки чатов:', e);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, userId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, userId });
  };

  const toggleAdmin = async (userId: number) => {
    try {
      if (selectedAdmins.includes(userId)) {
        await apiClient.delete(`/admin/admins/${userId}`);
        setSelectedAdmins(prev => prev.filter(id => id !== userId));
      } else {
        await apiClient.post(`/admin/admins/${userId}`);
        setSelectedAdmins(prev => [...prev, userId]);
      }
    } catch (e: any) {
      alert('Ошибка изменения прав: ' + (e.response?.data?.detail || ''));
    }
    setContextMenu(null);
  };

  const deleteUser = async (userId: number) => {
    if (!window.confirm('Удалить пользователя навсегда?')) return;
    try {
      await apiClient.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      loadStats();
    } catch (e: any) {
      alert('Ошибка: ' + (e.response?.data?.detail || ''));
    }
    setContextMenu(null);
  };

  const addAdmin = async () => {
    if (!newAdminUsername.trim()) return;
    try {
      const res = await apiClient.post('/admin/admins/by-username', { username: newAdminUsername.trim() });
      setSelectedAdmins(prev => [...prev, res.data.id]);
      setNewAdminUsername('');
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Ошибка');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-loading">
          <Icon name="settings" size={48} />
          <p>Загрузка панели управления...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <div className="admin-header-left">
            <button className="admin-back-btn" onClick={onBack}>
              <Icon name="arrow" size={20} />
            </button>
            <h1>Ошибка</h1>
          </div>
        </div>
        <div className="admin-content" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>
          <button className="btn-small" onClick={loadAllData}>Повторить</button>
          <button className="btn-small" onClick={onBack} style={{ marginLeft: '0.5rem' }}>Вернуться</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel" onClick={() => setContextMenu(null)}>
      <div className="admin-header">
        <div className="admin-header-left">
          <button className="admin-back-btn" onClick={onBack}>
            <Icon name="arrow" size={20} />
          </button>
          <h1>Панель управления</h1>
        </div>
        <button className="admin-logout-btn" onClick={onLogout}>
          <Icon name="logout" size={18} /> Выйти
        </button>
      </div>

      <div className="admin-tabs">
        {(['overview', 'users', 'chats', 'admins', 'settings'] as const).map(tab => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && <><Icon name="home" size={18} /> Обзор</>}
            {tab === 'users' && <><Icon name="profile" size={18} /> Пользователи</>}
            {tab === 'chats' && <><Icon name="send" size={18} /> Чаты</>}
            {tab === 'admins' && <><Icon name="usercheck" size={18} /> Админы</>}
            {tab === 'settings' && <><Icon name="settings" size={18} /> Настройки</>}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="admin-overview">
            <h2>Общая статистика</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon"><Icon name="profile" size={32} /></div>
                <div className="stat-info">
                  <div className="stat-value">{stats.total_users}</div>
                  <div className="stat-label">Пользователей</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Icon name="send" size={32} /></div>
                <div className="stat-info">
                  <div className="stat-value">{stats.total_chats}</div>
                  <div className="stat-label">Чатов</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon"><Icon name="note" size={32} /></div>
                <div className="stat-info">
                  <div className="stat-value">{stats.total_messages}</div>
                  <div className="stat-label">Сообщений</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-users">
            <h2>Пользователи ({filteredUsers.length})</h2>
            <div className="admin-search">
              <Icon name="search" size={18} />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="users-list">
              {filteredUsers.map(user => (
                <div key={user.id} className="user-item-wrapper">
                  <div
                    className={`user-item ${expandedUser === user.id ? 'expanded' : ''}`}
                    onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                    onContextMenu={(e) => handleContextMenu(e, user.id)}
                  >
                    <div className="user-avatar">
                      {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.first_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="user-info">
                      <div className="user-name">
                        {user.first_name} {user.last_name}
                        {selectedAdmins.includes(user.id) && <span className="admin-badge"><Icon name="checkmark" size={12} /></span>}
                      </div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                    <div className="user-meta">
                      <div className="user-email">{user.email}</div>
                    </div>
                    <Icon name="arrow" size={16} className={`expand-icon ${expandedUser === user.id ? 'rotated' : ''}`} />
                  </div>
                  {expandedUser === user.id && (
                    <div className="user-details">
                      <div className="detail-row"><span>ID:</span><span>{user.id}</span></div>
                      <div className="detail-row"><span>Email:</span><span>{user.email}</span></div>
                      <div className="detail-row"><span>Имя:</span><span>{user.first_name} {user.last_name}</span></div>
                      <div className="detail-row"><span>Админ:</span><span>{selectedAdmins.includes(user.id) ? 'Да' : 'Нет'}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div className="admin-chats">
            <h2>Чаты ({chats.length})</h2>
            <div className="chats-list">
              {chats.map(chat => (
                <div key={chat.id} className="chat-item">
                  <div className="chat-avatar">
                    {chat.type === 'channel' ? <Icon name="share" size={20} /> :
                     chat.type === 'group' ? <Icon name="useradd" size={20} /> :
                     <Icon name="profile" size={20} />}
                  </div>
                  <div className="chat-info">
                    <div className="chat-name">{chat.name || `Чат ${chat.id}`}</div>
                    <div className="chat-type">
                      {chat.type === 'channel' ? 'Канал' : chat.type === 'group' ? 'Группа' : 'Личный'}
                    </div>
                  </div>
                  <div className="chat-stats">
                    <div className="chat-stat"><Icon name="profile" size={14} /> {chat.members_count}</div>
                    <div className="chat-stat"><Icon name="send" size={14} /> {chat.messages_count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="admin-admins">
            <h2>Администраторы</h2>
            <div className="add-admin-form">
              <input
                type="text"
                placeholder="Имя пользователя..."
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAdmin()}
              />
              <button onClick={addAdmin} className="btn-small">
                <Icon name="useradd" size={16} /> Добавить
              </button>
            </div>
            <div className="admins-list">
              {users.filter(u => selectedAdmins.includes(u.id)).map(user => (
                <div key={user.id} className="admin-item">
                  <div className="user-avatar">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.first_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.first_name} {user.last_name}</div>
                    <div className="user-username">@{user.username}</div>
                  </div>
                  <button className="btn-small danger" onClick={() => toggleAdmin(user.id)}>
                    <Icon name="delete" size={14} /> Убрать
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-settings">
            <h2>Настройки мессенджера</h2>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Название</div>
                <div className="setting-description">Monogram Messenger</div>
              </div>
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Версия</div>
                <div className="setting-description">1.0.0</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {contextMenu && (
        <>
          <div className="context-menu-backdrop" onClick={() => setContextMenu(null)} />
          <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
            <div className="context-menu-item" onClick={() => toggleAdmin(contextMenu.userId)}>
              <Icon name={selectedAdmins.includes(contextMenu.userId) ? 'delete' : 'useradd'} size={16} />
              {selectedAdmins.includes(contextMenu.userId) ? 'Снять админа' : 'Сделать админом'}
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-item danger" onClick={() => deleteUser(contextMenu.userId)}>
              <Icon name="delete" size={16} /> Удалить
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;