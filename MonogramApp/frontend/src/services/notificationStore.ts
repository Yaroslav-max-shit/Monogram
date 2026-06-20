// frontend/src/services/notificationStore.ts

interface Notification {
  id: number;
  title: string;
  body: string;
  time: string;
  icon: string;
  type: 'message' | 'system' | 'mention' | 'like';
  unread: boolean;
  chatId?: number;
}

const NOTIFICATIONS_KEY = 'monogram_notifications';

export const getStoredNotifications = (): Notification[] => {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveNotifications = (notifications: Notification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const addNotification = (notification: Notification) => {
  const notifications = getStoredNotifications();
  notifications.unshift(notification);
  // Храним только последние 100 уведомлений
  if (notifications.length > 100) {
    notifications.pop();
  }
  saveNotifications(notifications);
  
  // Отправляем событие для обновления UI
  window.dispatchEvent(new CustomEvent('notification-added', { 
    detail: notification 
  }));
};

export const markAsRead = (id: number) => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => 
    n.id === id ? { ...n, unread: false } : n
  );
  saveNotifications(updated);
};

export const markAllAsRead = () => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => ({ ...n, unread: false }));
  saveNotifications(updated);
};

export const getUnreadCount = (): number => {
  return getStoredNotifications().filter(n => n.unread).length;
};