import React, { useState } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';

interface AddChatModalProps {
  onClose: () => void;
  onAddChat: (chat: any) => void;
}

const AddChatModal: React.FC<AddChatModalProps> = ({ onClose, onAddChat }) => {
  const [step, setStep] = useState<'select' | 'group' | 'channel'>('select');
  const [type, setType] = useState<'group' | 'channel'>('group');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [memberUsername, setMemberUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiClient.get(`/users/search?q=${query}`);
      setSearchResults(res.data);
    } catch (error) {
      console.error('Ошибка поиска:', error);
    }
  };

  const addMember = (username: string) => {
    if (!members.includes(username)) {
      setMembers([...members, username]);
    }
    setMemberUsername('');
    setSearchResults([]);
  };

  const removeMember = (username: string) => {
    setMembers(members.filter(m => m !== username));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (event) => setAvatarPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      let formData: any = { type, name, description };
      
      if (type === 'group' && members.length > 0) {
        formData.members = members;
      }
      
      const response = await apiClient.post('/chats/', formData);
      
      // Если есть аватар
      if (avatar) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatar);
        avatarFormData.append('chat_id', response.data.id);
        await apiClient.post('/chats/avatar', avatarFormData);
      }
      
      onAddChat(response.data);
      onClose();
    } catch (error) {
      console.error('Ошибка создания:', error);

    } finally {
      setLoading(false);
    }
  };

  // Шаг 1: выбор типа чата
  if (step === 'select') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="create-chat-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Создать чат</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="create-chat-options">
            <button className="create-chat-option" onClick={() => { setType('group'); setStep('group'); }}>
              <div className="option-icon">
                <Icon name="group" size={32} />
              </div>
              <div className="option-info">
                <h3>Группа</h3>
                <p>Общайтесь с несколькими людьми</p>
              </div>
              <Icon name="arrow-right" size={20} />
            </button>
            <button className="create-chat-option" onClick={() => { setType('channel'); setStep('channel'); }}>
              <div className="option-icon">
                <Icon name="channel" size={32} />
              </div>
              <div className="option-info">
                <h3>Канал</h3>
                <p>Для трансляций и публикаций</p>
              </div>
              <Icon name="arrow-right" size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Шаг 2: создание группы/канала
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-chat-modal wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-back-btn" onClick={() => setStep('select')}>
            <Icon name="arrow" size={20} />
          </button>
          <h2>Создать {type === 'group' ? 'группу' : 'канал'}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {/* Аватар */}
          <div className="create-chat-avatar">
            <div className="avatar-upload" onClick={() => document.getElementById('chat-avatar-input')?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  <Icon name="upload" size={24} />
                </div>
              )}
            </div>
            <input id="chat-avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} hidden />
            <p className="avatar-hint">Нажмите чтобы добавить фото</p>
          </div>
          
          {/* Название */}
          <div className="input-group">
            <label>Название {type === 'group' ? 'группы' : 'канала'} *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Например: ${type === 'group' ? 'Друзья' : 'Новости'}`}
            />
          </div>
          
          {/* Описание */}
          <div className="input-group">
            <label>Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о чём этот чат"
              rows={3}
            />
          </div>
          
          {/* Участники (только для группы) */}
          {type === 'group' && (
            <div className="input-group">
              <label>Участники</label>
              <div className="member-search">
                <input
                  value={memberUsername}
                  onChange={(e) => {
                    setMemberUsername(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="Поиск пользователей..."
                />
                <button className="search-btn" onClick={() => searchUsers(memberUsername)}>
                  <Icon name="search" size={18} />
                </button>
              </div>
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((user: any) => (
                    <div key={user.id} className="search-result" onClick={() => addMember(user.username)}>
                      <div className="result-avatar">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="result-info">
                        <div className="result-name">{user.first_name} {user.last_name}</div>
                        <div className="result-username">@{user.username}</div>
                      </div>
                      <Icon name="useradd" size={18} />
                    </div>
                  ))}
                </div>
              )}
              
              {members.length > 0 && (
                <div className="selected-members">
                  <div className="members-label">Добавлены ({members.length}):</div>
                  <div className="members-list">
                    {members.map(m => (
                      <div key={m} className="member-chip">
                        @{m}
                        <button onClick={() => removeMember(m)}>
                          <Icon name="close" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn-secondary" onClick={() => setStep('select')}>
            Назад
          </button>
          <button className="modal-btn-primary" onClick={handleCreate} disabled={!name || loading}>
            {loading ? 'Создание...' : `Создать ${type === 'group' ? 'группу' : 'канал'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddChatModal;