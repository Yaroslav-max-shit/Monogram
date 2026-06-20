import React from 'react';
import Icon from './Icon';
import './InviteModal.css';

interface InviteModalProps {
  username: string;
  onStartChat: () => void;
  onClose: () => void;
  isLoggedIn: boolean;
  isSelf?: boolean;
  bio?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

const InviteModal: React.FC<InviteModalProps> = ({ 
  username, 
  onStartChat, 
  onClose, 
  isLoggedIn,
  isSelf = false,
  bio = '',
  firstName = '',
  lastName = '',
  avatarUrl = '',
}) => {
  const displayName = firstName || lastName ? `${firstName} ${lastName}`.trim() : username;
  return (
    <div className="invite-overlay" onClick={onClose}>
      <div className="invite-content" onClick={(e) => e.stopPropagation()}>
        <button className="invite-close-btn" onClick={onClose}>✕</button>
        
        <div className="invite-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        
        <h2 className="invite-name">{displayName}</h2>
        <p className="invite-username">@{username.toLowerCase()}</p>
        
        {bio && <p className="invite-bio">{bio.length > 100 ? bio.substring(0, 100) + '...' : bio}</p>}
        
        {isSelf ? (
          <div className="invite-self-hint">
            <Icon name="profile" size={18} /> Это ваш аккаунт
          </div>
        ) : isLoggedIn ? (
          <button className="invite-chat-btn" onClick={onStartChat}>
            <Icon name="send" size={18} /> Перейти в чат
          </button>
        ) : (
          <div className="invite-login-hint">
            <Icon name="profile" size={18} /> Войдите в аккаунт чтобы начать чат
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteModal;