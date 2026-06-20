import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';
import './ChatInfoModal.css';

interface ChatInfoModalProps {
  onClose: () => void;
  chat: { id: number; name: string; type?: string };
  currentUserId?: number;
}

const ChatInfoModal: React.FC<ChatInfoModalProps> = ({ onClose, chat, currentUserId }) => {
  const [activeTab, setActiveTab] = useState<'members' | 'media' | 'files' | 'links'>('members');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [chat.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const membersRes = await apiClient.get(`/chats/${chat.id}/members`);
      setMembers(membersRes.data || []);
      
      // Загружаем сообщения для вкладок
      try {
        const msgsRes = await apiClient.get(`/messages/chat/${chat.id}`);
        const msgs = msgsRes.data || [];
        setAllMessages(msgs);
        
        // Фильтруем медиа
        const media = msgs.filter((m: any) => {
          try {
            const parsed = JSON.parse(m.content);
            return parsed.type === 'photo' || parsed.type === 'video' || parsed.type === 'file';
          } catch { return false; }
        });
        setMediaFiles(media);
      } catch {}
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const isPrivate = chat.type === 'private' || chat.type === 'personal';
  const isGroup = chat.type === 'group';
  const isChannel = chat.type === 'channel';

  // Для личного чата — показываем профиль собеседника
  const otherMember = isPrivate ? members.find(m => m.user_id !== currentUserId) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-info-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {isPrivate && otherMember ? (
          // ПРОФИЛЬ ЛИЧНОГО ЧАТА
          <div className="profile-full">
            <div className="profile-avatar-large">
              {otherMember.avatar_url ? (
                <img src={otherMember.avatar_url} alt="" />
              ) : (
                <span>{otherMember.first_name?.charAt(0)?.toUpperCase() || otherMember.username?.charAt(0)?.toUpperCase() || '?'}</span>
              )}
            </div>
            <h2>{otherMember.first_name} {otherMember.last_name}</h2>
            <p className="profile-username">@{otherMember.username}</p>
            {otherMember.birth_date && (
              <p className="profile-birthdate">Дата рождения: {otherMember.birth_date}</p>
            )}
            
            <div className="profile-section">
              <div className="profile-row">
                <span className="profile-label">Имя</span>
                <span className="profile-value">{otherMember.first_name || 'Не указано'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Фамилия</span>
                <span className="profile-value">{otherMember.last_name || 'Не указано'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Username</span>
                <span className="profile-value">@{otherMember.username}</span>
              </div>
              {otherMember.birth_date && (
                <div className="profile-row">
                  <span className="profile-label">Дата рождения</span>
                  <span className="profile-value">{otherMember.birth_date}</span>
                </div>
              )}
              <div className="profile-row">
                <span className="profile-label">Статус</span>
                <span className="profile-value">В сети</span>
              </div>
            </div>
          </div>
        ) : (
          // ПРОФИЛЬ ГРУППЫ/КАНАЛА
          <>
            <div className="chat-info-avatar">
              {chat.name.charAt(0).toUpperCase()}
            </div>
            <h2>{chat.name}</h2>
            <p className="chat-info-username">
              {isGroup ? 'Группа' : isChannel ? 'Канал' : 'Чат'} • {members.length} {isGroup ? 'участников' : isChannel ? 'подписчиков' : 'участник'}
            </p>
          </>
        )}

        {/* Вкладки — для всех типов */}
        <div className="chat-info-tabs">
          <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            <Icon name="profile" size={14} /> Участники ({members.length})
          </button>
          <button className={`tab ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
            <Icon name="picture" size={14} /> Фото
          </button>
          <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            <Icon name="folder" size={14} /> Файлы
          </button>
          <button className={`tab ${activeTab === 'links' ? 'active' : ''}`} onClick={() => setActiveTab('links')}>
            <Icon name="link" size={14} /> Ссылки
          </button>
        </div>

        <div className="chat-info-body">
          {activeTab === 'members' && (
            loading ? (
              <div className="loading-members">Загрузка...</div>
            ) : (
              <div className="members-list">
                {members.map(member => (
                  <div key={member.user_id} className="member-item">
                    <div className="member-avatar">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" />
                      ) : (
                        <span>{member.username?.charAt(0)?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <div className="member-info">
                      <div className="member-name">
                        {member.first_name} {member.last_name}
                        {member.user_id === currentUserId && <span className="member-badge">Вы</span>}
                      </div>
                      <div className="member-username">@{member.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'media' && (
            <div className="media-grid">
              {mediaFiles.length > 0 ? (
                mediaFiles.map((msg: any) => {
                  try {
                    const parsed = JSON.parse(msg.content);
                    return (
                      <div key={msg.id} className="media-item" onClick={() => {/* открыть в чате */}}>
                        {parsed.type === 'photo' && <img src={parsed.url} alt="" />}
                        {parsed.type === 'video' && <div className="media-video">Видео</div>}
                      </div>
                    );
                  } catch { return null; }
                })
              ) : (
                <div className="media-empty">
                  <Icon name="picture" size={48} />
                  <p>Нет медиафайлов</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="media-empty">
              <Icon name="folder" size={48} />
              <p>Нет файлов</p>
            </div>
          )}

          {activeTab === 'links' && (
            <div className="media-empty">
              <Icon name="link" size={48} />
              <p>Нет ссылок</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInfoModal;
