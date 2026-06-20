import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import './NotificationsModal.css';

interface Notification {
  id: number;
  title: string;
  body: string;
  time: string;
  icon: string;
  type: 'message' | 'system' | 'mention' | 'like';
  unread: boolean;
}

const STORAGE_KEY = 'monogram_notifications';

const NotificationsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  const markAsRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  const deleteNotification = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  const clearAll = () => setNotifications([]);

  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => n.unread) 
    : notifications;

  const getIconForType = (type: string) => {
    switch(type) {
      case 'message': return <Icon name="send" size={18} />;
      case 'system': return <Icon name="settings" size={18} />;
      case 'mention': return <Icon name="profile" size={18} />;
      case 'like': return <Icon name="favorite" size={18} />;
      default: return <Icon name="bell" size={18} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-modal-header">
          <div className="notifications-header-left">
            <Icon name="bell" size={24} />
            <h2>Уведомления</h2>
            {unreadCount > 0 && <span className="notifications-count-badge">{unreadCount}</span>}
          </div>
          <div className="notifications-header-right">
            {showSettings && (
              <div className="notifications-settings-panel">
                <button className="settings-action-btn" onClick={markAllRead}>
                  <Icon name="usercheck" size={14} /> Прочитано
                </button>
                <button className="settings-action-btn danger" onClick={clearAll}>
                  <Icon name="delete" size={14} /> Очистить
                </button>
              </div>
            )}
            <button className={`icon-btn ${showSettings ? 'active' : ''}`} onClick={() => setShowSettings(!showSettings)}>
              <Icon name="settings" size={18} />
            </button>
            <button className="icon-btn close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="notifications-filters">
          <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
            Все
          </button>
          <button className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`} onClick={() => setActiveFilter('unread')}>
            Непрочитанные {unreadCount > 0 && <span className="filter-badge">{unreadCount}</span>}
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div key={notification.id} className={`notification-item ${notification.unread ? 'unread' : ''}`} onClick={() => markAsRead(notification.id)}>
                <div className={`notification-icon-wrapper ${notification.type}`}>
                  {getIconForType(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-body">{notification.body}</div>
                  <div className="notification-time">{notification.time}</div>
                </div>
                <button className="notification-delete-btn" onClick={(e) => deleteNotification(notification.id, e)}>
                  <Icon name="delete" size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="notifications-empty">
              <div className="notifications-empty-icon">
                <Icon name="bell" size={48} />
              </div>
              <p>Нет уведомлений</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;