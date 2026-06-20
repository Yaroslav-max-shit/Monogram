import React, { useState, useEffect, useRef } from 'react';
import { getSession, saveSession } from '../services/cookies';
import apiClient from '../services/api';
import './ProfileModal.css';
import Icon from './Icon';
import UserStats from './UserStats';

interface ProfileModalProps {
  onClose: () => void;
  userData?: { id: number; username: string; avatar?: string; first_name?: string; last_name?: string } | null;
  onSave?: (data: { id: number; username: string; avatar?: string }) => void;
  onShowQR?: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, userData, onSave, onShowQR }) => {
  const [profile, setProfile] = useState({
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
  });
  const [avatar, setAvatar] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data) {
        setProfile({
          username: res.data.username || '',
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          bio: res.data.bio || '',
        });
        if (res.data.avatar_url) setAvatar(res.data.avatar_url);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      if (userData) {
        setProfile({
          username: userData.username || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          bio: '',
        });
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5 МБ');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Можно загружать только изображения');
      return;
    }
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newAvatarUrl = avatar;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const res = await apiClient.post('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.avatar_url) {
          newAvatarUrl = res.data.avatar_url;
          setAvatar(newAvatarUrl);
        }
      }
      
      await apiClient.put('/users/profile', null, {
        params: { 
          first_name: profile.first_name, 
          last_name: profile.last_name 
        }
      });
      
      const session = await getSession();
      if (session) {
        await saveSession(session.token, {
          ...session.user,
          id: session.user.id,
          username: profile.username,
          firstName: profile.first_name,
          lastName: profile.last_name,
          avatar: newAvatarUrl
        });
      }
      
      if (onSave) {
        onSave({ 
          id: userData?.id || 0, 
          username: profile.username, 
          avatar: newAvatarUrl 
        });
      }
      

      onClose();
    } catch (e: any) {
      console.error('Ошибка сохранения:', e);
      alert(e.response?.data?.detail || 'Ошибка при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${profile.username}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openQR = () => {
    onClose();
    setTimeout(() => {
      if (onShowQR) onShowQR();
      else window.dispatchEvent(new CustomEvent('open-qr-from-profile'));
    }, 100);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>Редактировать профиль</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="profile-avatar-section">
          <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
            {avatar ? (
              <img src={avatar} alt="Avatar" className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-large placeholder">
                {profile.first_name?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="avatar-upload-overlay">
              <Icon name="upload" size={16} />
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/*" 
            hidden 
          />
          <p className="avatar-hint">Нажмите чтобы изменить фото (макс. 5 МБ)</p>
        </div>

        <div className="profile-form">
          <div className="input-group">
            <label>Имя</label>
            <input 
              value={profile.first_name} 
              onChange={e => setProfile({ ...profile, first_name: e.target.value })} 
              placeholder="Имя"
            />
          </div>
          <div className="input-group">
            <label>Фамилия</label>
            <input 
              value={profile.last_name} 
              onChange={e => setProfile({ ...profile, last_name: e.target.value })} 
              placeholder="Фамилия"
            />
          </div>
          <div className="input-group">
            <label>Имя пользователя</label>
            <input 
              value={profile.username} 
              onChange={e => setProfile({ ...profile, username: e.target.value })} 
              placeholder="@username"
              disabled
            />
            <span className="input-hint">Имя пользователя нельзя изменить</span>
          </div>
          
          <div className="invite-link-section">
            <label>Ссылка-приглашение</label>
            <p className="invite-hint">Поделитесь чтобы другие могли найти вас</p>
            <div className="invite-link-box">
              <span className="invite-link-text">
                {window.location.origin}/invite/{profile.username}
              </span>
              <div className="invite-actions">
                <button className="copy-link-btn" onClick={copyInviteLink} title="Копировать ссылку">
                  <Icon name="copy" size={16} />
                </button>
                <button className="qr-link-btn" onClick={openQR} title="Показать QR-код">
                  <Icon name="qr" size={16} />
                </button>
              </div>
            </div>
            {copied && <span className="copy-success">Ссылка скопирована!</span>}
          </div>
        </div>

        <div className="profile-modal-footer">
          <button className="modal-btn-secondary" onClick={onClose} disabled={saving}>
            Отмена
          </button>
          <button className="modal-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
