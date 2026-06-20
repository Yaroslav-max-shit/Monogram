import React, { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';
import { useDebounce } from '../hooks/useDebounce';
import { useAccounts } from '../hooks/useAccounts';
import { FocusMode, isFocusModeActive } from './FocusMode';
import './Sidebar.css';

interface SidebarProps {
  chats: any[];
  activeChatId: number;
  onChatSelect: (id: number, name: string) => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onNotificationsClick: () => void;
  onLogout: () => void;
  onCreateGroup: () => void;
  onCreateChannel: () => void;
  onAddChat: () => void;
  userData: any;
  isAdmin: boolean;
  isPremium: boolean;
  onAdminClick: () => void;
  onPremiumClick: () => void;
  onPinChat: (id: number, isPinned: boolean) => void;
  onArchiveChat: (id: number) => void;
  onMuteChat: (id: number, duration: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const avatarColors = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
  '#43e97b', '#fa709a', '#a18cd1', '#fbc2eb', '#84fab0',
  '#fccb90', '#d57eeb', '#5ee7df', '#b7f8db', '#f093fb',
];

function getChatAvatar(chat: any): { letter: string; color: string } {
  const name = chat.name || chat.title || '?';
  const letter = name.charAt(0).toUpperCase();
  const colorIndex = (chat.id || name.length) % avatarColors.length;
  return { letter, color: avatarColors[colorIndex] };
}

const Sidebar: React.FC<SidebarProps> = ({
  chats, activeChatId, onChatSelect,
  onProfileClick, onSettingsClick, onNotificationsClick, onLogout,
  onCreateGroup, onCreateChannel, onAddChat,
  userData, isAdmin, isPremium,
  onAdminClick, onPremiumClick,
  onPinChat, onArchiveChat, onMuteChat,
  isOpen, onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { accounts, activeIndex, switchAccount, removeAccount } = useAccounts();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const focusModeActive = isFocusModeActive();
  const [orderedChats, setOrderedChats] = useState<any[]>([]);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const displayName = userData?.first_name
    ? `${userData.first_name} ${userData.last_name || ''}`.trim()
    : userData?.username || 'Пользователь';

  useEffect(() => {
    if (debouncedSearch) {
      console.debug('[Sidebar] Search triggered:', debouncedSearch);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    const storageKey = `chat_order_${userData?.id || 'default'}`;
    const savedOrder = localStorage.getItem(storageKey);
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder) as number[];
        const ordered = [...chats].sort((a, b) => {
          const ai = order.indexOf(a.id);
          const bi = order.indexOf(b.id);
          if (ai === -1 && bi === -1) return 0;
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        });
        setOrderedChats(ordered);
        return;
      } catch {}
    }
    setOrderedChats(chats);
  }, [chats, userData?.id]);

  const handleDragStart = (e: React.DragEvent, chatId: number) => {
    e.dataTransfer.setData('text/plain', String(chatId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, chatId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(chatId);
  };

  const handleDrop = useCallback((e: React.DragEvent, targetChatId: number) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (draggedId === targetChatId) return;

    const storageKey = `chat_order_${userData?.id || 'default'}`;
    const savedOrder: number[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const allIds = orderedChats.map(c => c.id);
    const newOrder = allIds.filter(id => id !== draggedId);
    const insertIdx = newOrder.indexOf(targetChatId);
    newOrder.splice(insertIdx, 0, draggedId);
    
    localStorage.setItem(storageKey, JSON.stringify(newOrder));
    
    const reordered = [...orderedChats].sort((a, b) => {
      const ai = newOrder.indexOf(a.id);
      const bi = newOrder.indexOf(b.id);
      return ai - bi;
    });
    setOrderedChats(reordered);
  }, [orderedChats, userData?.id]);

  const filteredChats = orderedChats.filter(chat =>
    !debouncedSearch || chat.name?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleAddClick = () => {
    setShowAddMenu(!showAddMenu);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-search">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="sidebar-add-wrap">
            <button className="add-chat-btn" onClick={handleAddClick} title="Добавить чат">
              <Icon name="plus" size={18} />
            </button>
            {showAddMenu && (
              <div className="add-chat-dropdown">
                <button onClick={() => { setShowAddMenu(false); onCreateGroup(); }}>Создать группу</button>
                <button onClick={() => { setShowAddMenu(false); onCreateChannel(); }}>Создать канал</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sidebar-chats">
        {filteredChats.map((chat: any, idx: number) => {
          const { letter, color } = getChatAvatar(chat);
          return (
            <div
              key={chat.id || `chat-${idx}`}
              className={`chat-item ${chat.id === activeChatId ? 'active' : ''} ${dragOverId === chat.id ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, chat.id)}
              onDragOver={(e) => handleDragOver(e, chat.id)}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(e, chat.id)}
              onClick={() => onChatSelect(chat.id, chat.name || chat.title || 'Чат')}
              onContextMenu={(e) => {
                e.preventDefault();
                const action = confirm('Архивировать чат?');
                if (action) onArchiveChat(chat.id);
              }}
            >
              <div className="chat-avatar" style={{ background: color }}>
                <span className="chat-avatar-letter">{letter}</span>
              </div>
              <div className="chat-info">
                <span className="chat-name">
                  {chat.name || chat.title || 'Чат'}
                  {chat.isPinned && <Icon name="pin" size={12} className="chat-pin-icon" />}
                </span>
                <span className="chat-last-message">
                  {chat.last_message?.content?.substring(0, 30) || chat.lastMessage?.substring(0, 30) || ''}
                </span>
              </div>
              {chat.unreadCount > 0 && (
                <span className="chat-unread">{chat.unreadCount}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={onProfileClick}>
          <div className="sidebar-avatar">
            {userData?.avatar_url ? <img src={userData.avatar_url} alt="" /> : <Icon name="user" size={20} />}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-username">{displayName}</span>
          </div>
        </div>
        <button className="sidebar-action-btn" onClick={onSettingsClick}><Icon name="settings" size={16} /> Настройки</button>
        {isPremium && <button className="sidebar-action-btn premium" onClick={onPremiumClick}><Icon name="crown" size={16} /> Premium</button>}
        {isAdmin && <button className="sidebar-action-btn" onClick={onAdminClick}><Icon name="shield" size={16} /> Админка</button>}
      </div>
      {showFocusMode && <FocusMode onClose={() => setShowFocusMode(false)} />}
    </div>
  );
};

export default Sidebar;
