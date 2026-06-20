// frontend/src/services/notifications.ts

// Запрос разрешения
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.debug('Браузер не поддерживает уведомления');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

// Показать уведомление
export const showNotification = (title: string, body: string, icon?: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/assets/images/icon.ico',
      badge: '/assets/images/icon.ico',
      tag: 'monogram-message',
      requireInteraction: false,
      silent: false,
    });
  }
};

// Показать desktop-уведомление (с иконкой и кликом для фокуса)
export function showDesktopNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/assets/images/icon-192.png',
      badge: '/assets/images/icon-192.png',
      ...options,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
}

// Обработчик клика по уведомлению
export const onNotificationClick = (callback: () => void) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        callback();
      }
    });
  }
};