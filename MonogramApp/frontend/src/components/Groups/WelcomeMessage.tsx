import React, { useState } from 'react';
import Icon from '../Icon';
import apiClient from '../../services/api';

interface WelcomeMessageProps {
  chatId: number;
  isAdmin: boolean;
  currentWelcomeMessage?: string;
  onSave?: (message: string, enabled: boolean) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ chatId, isAdmin, currentWelcomeMessage = '', onSave }) => {
  const [message, setMessage] = useState(currentWelcomeMessage);
  const [isEnabled, setIsEnabled] = useState(!!currentWelcomeMessage);
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    try {
      await apiClient.post(`/chats/${chatId}/welcome-message`, { message, enabled: isEnabled });
      onSave?.(message, isEnabled);
      setEditing(false);
    } catch (error) {
      alert('Не удалось сохранить приветственное сообщение');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="welcome-settings">
      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-label"><Icon name="greeting" size={18} /> Приветственное сообщение</div>
          <div className="setting-desc">Новые участники увидят это сообщение при входе в группу (только для них)</div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>
      {isEnabled && (
        <div className="welcome-message-editor" style={{ marginTop: '12px' }}>
          {editing ? (
            <>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Например: Добро пожаловать! Пожалуйста, представьтесь" rows={3} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-small" onClick={() => setEditing(false)}>Отмена</button>
                <button className="btn-small primary" onClick={handleSave}>Сохранить</button>
              </div>
            </>
          ) : (
            <div onClick={() => setEditing(true)} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: message ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              <Icon name="edit" size={16} /> <span>{message || 'Нажмите, чтобы добавить приветственное сообщение'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WelcomeMessage;