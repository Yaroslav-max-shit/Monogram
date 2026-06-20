import apiClient from './api';

export const exportChatData = async (chatId: number): Promise<void> => {
  try {
    const res = await apiClient.get(`/chats/${chatId}/export`);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${chatId}_backup_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

export const importBackup = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        await apiClient.post('/user/import', data);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const autoBackup = async (): Promise<void> => {
  try {
    await apiClient.post('/user/auto-backup');
  } catch (error) {
    console.error('Auto backup failed:', error);
  }
};

export const scheduleAutoBackup = () => {
  const lastBackup = localStorage.getItem('last_backup');
  const now = Date.now();
  if (!lastBackup || now - parseInt(lastBackup) > 24 * 60 * 60 * 1000) {
    autoBackup();
    localStorage.setItem('last_backup', String(now));
  }
};