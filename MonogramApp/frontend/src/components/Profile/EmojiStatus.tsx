import React, { useState } from 'react';
import apiClient from '../../services/api';
import Icon from '../Icon';

interface EmojiStatusProps {
  userId: number;
  currentStatus?: string;
  currentEmoji?: string;
  onUpdate: (status: string, emoji: string) => void;
}

const EmojiStatus: React.FC<EmojiStatusProps> = ({ userId, currentStatus, currentEmoji, onUpdate }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [statusText, setStatusText] = useState(currentStatus || '');
  const [statusEmoji, setStatusEmoji] = useState(currentEmoji || '😊');

  const emojis = ['😊', '😎', '🤔', '😴', '💪', '🎉', '❤️', '🔥', '👋', '👍', '🍕', '🎮', '📚', '💼', '🏠', '✈️'];

  const saveStatus = async () => {
    try {
      await apiClient.put('/users/profile', { custom_status: statusText, custom_status_emoji: statusEmoji });
      onUpdate(statusText, statusEmoji);
      setShowPicker(false);
    } catch (error) {
      console.error('Error saving status:', error);
    }
  };

  const removeStatus = async () => {
    try {
      await apiClient.put('/users/profile', { custom_status: '', custom_status_emoji: '' });
      onUpdate('', '');
      setStatusText('');
    } catch (error) {
      console.error('Error removing status:', error);
    }
  };

  return (
    <div className="emoji-status-settings">
      <div className="current-status" onClick={() => setShowPicker(!showPicker)}>
        <span className="status-emoji">{statusEmoji}</span>
        <span className="status-text">{statusText || 'Добавить статус'}</span>
        <Icon name="edit" size={16} />
      </div>

      {showPicker && (
        <div className="status-editor">
          <div className="emoji-picker-row">
            {emojis.map(emoji => (
              <button
                key={emoji}
                className={`emoji-option ${statusEmoji === emoji ? 'selected' : ''}`}
                onClick={() => setStatusEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Текст статуса"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            maxLength={50}
          />
          <div className="status-actions">
            <button className="save-btn" onClick={saveStatus}>Сохранить</button>
            <button className="remove-btn" onClick={removeStatus}>Удалить</button>
          </div>
        </div>
      )}

      <style>{`
        .emoji-status-settings {
          position: relative;
        }
        .current-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: var(--bg-primary);
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid var(--border-color);
        }
        .status-emoji {
          font-size: 1.2rem;
        }
        .status-text {
          flex: 1;
          color: var(--text-primary);
        }
        .status-editor {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 8px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        }
        .emoji-picker-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .emoji-option {
          width: 40px;
          height: 40px;
          font-size: 1.3rem;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .emoji-option.selected {
          border-color: var(--accent);
          background: rgba(102,126,234,0.1);
        }
        .status-editor input {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        .status-actions {
          display: flex;
          gap: 8px;
        }
        .status-actions button {
          flex: 1;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
        }
        .save-btn {
          background: var(--accent);
          color: white;
          border: none;
        }
        .remove-btn {
          background: transparent;
          color: var(--danger);
          border: 1px solid var(--danger);
        }
      `}</style>
    </div>
  );
};

export default EmojiStatus;