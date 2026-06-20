import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import Icon from '../Icon';
import './ScheduledMessages.css';

interface ScheduledMessage {
  id: number;
  content: string;
  chat_id: number;
  scheduled_for: string;
  chat_name?: string;
}

const ScheduledMessages: React.FC = () => {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [content, setContent] = useState('');
  const [chatId, setChatId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    loadScheduledMessages();
    loadChats();
  }, []);

  const loadScheduledMessages = async () => {
    try {
      const res = await apiClient.get('/messages/scheduled');
      const msgs = res.data;
      // Загружаем названия чатов
      const chatsRes = await apiClient.get('/chats/');
      const chatsMap = Object.fromEntries(chatsRes.data.map((c: any) => [c.id, c.name]));
      setMessages(msgs.map((m: any) => ({ ...m, chat_name: chatsMap[m.chat_id] || `Чат ${m.chat_id}` })));
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChats = async () => {
    const res = await apiClient.get('/chats/');
    setChats(res.data);
  };

  const handleCreate = async () => {
    if (!content || !chatId || !scheduledDate || !scheduledTime) {
      alert('Заполните все поля');
      return;
    }

    const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledFor <= new Date()) {
      alert('Дата должна быть в будущем');
      return;
    }

    try {
      await apiClient.post('/messages/schedule', {
        content,
        chat_id: parseInt(chatId),
        scheduled_for: scheduledFor.toISOString()
      });
      setShowCreator(false);
      setContent('');
      setChatId('');
      setScheduledDate('');
      setScheduledTime('');
      loadScheduledMessages();
    } catch (error) {
      console.error('Error scheduling message:', error);
      alert('Ошибка при создании отложенного сообщения');
    }
  };

  const handleCancel = async (id: number) => {
    if (confirm('Отменить отправку сообщения?')) {
      await apiClient.delete(`/messages/scheduled/${id}`);
      loadScheduledMessages();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="scheduled-messages">
      <div className="scheduled-header">
        <h3>Отложенные сообщения</h3>
        <button className="create-btn" onClick={() => setShowCreator(true)}>
          <Icon name="plus" size={16} /> Создать
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="empty-state">
          <Icon name="clock" size={48} />
          <p>Нет отложенных сообщений</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map(msg => (
            <div key={msg.id} className="scheduled-item">
              <div className="scheduled-content">{msg.content}</div>
              <div className="scheduled-meta">
                <span>Чат: {msg.chat_name}</span>
                <span>Отправить: {formatDate(msg.scheduled_for)}</span>
              </div>
              <button className="cancel-btn" onClick={() => handleCancel(msg.id)}>
                <Icon name="delete" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreator && (
        <div className="modal-overlay" onClick={() => setShowCreator(false)}>
          <div className="scheduler-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Новое отложенное сообщение</h3>
              <button className="close-btn" onClick={() => setShowCreator(false)}>✕</button>
            </div>
            <div className="modal-body">
              <select value={chatId} onChange={(e) => setChatId(e.target.value)}>
                <option value="">Выберите чат</option>
                {chats.map(chat => (
                  <option key={chat.id} value={chat.id}>{chat.name}</option>
                ))}
              </select>
              
              <textarea
                placeholder="Текст сообщения"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
              
              <div className="datetime-row">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel" onClick={() => setShowCreator(false)}>Отмена</button>
              <button className="create" onClick={handleCreate}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledMessages;