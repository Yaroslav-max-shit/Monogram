import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import { saveSession } from '../../services/cookies';
import Icon from '../Icon';

interface QRLoginProps {
  onClose: () => void;
}

const QRLogin: React.FC<QRLoginProps> = ({ onClose }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string>('');
  const [status, setStatus] = useState<'waiting' | 'scanning' | 'confirmed' | 'expired'>('waiting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const res = await apiClient.post('/auth/qr/create');
      setSessionId(res.data.session_id);
      setQrLink(res.data.qr_link);
      setStatus('waiting');
      setLoading(false);
      checkStatus(res.data.session_id);
    } catch (err) {
      setError('Не удалось создать QR-сессию');
      setLoading(false);
    }
  };

  const checkStatus = async (sid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/auth/qr/status/${sid}`);
        setStatus(res.data.status);
        
        if (res.data.status === 'confirmed') {
          clearInterval(interval);
          const tokenRes = await apiClient.post('/auth/qr/confirm', { 
            session_id: sid, 
            device_name: 'Web' 
          });
          if (tokenRes.data.token) {
            await saveSession(tokenRes.data.token, tokenRes.data.user);
            onClose();
            window.location.href = '/';
          }
        } else if (res.data.status === 'expired') {
          clearInterval(interval);
          setError('Сессия истекла');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div');
    notification.className = `custom-toast ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#667eea'};
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      z-index: 100000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="qr-login-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>QR вход</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="qr-login-body">
            <div className="loading-spinner" />
            <p>Создание QR-кода...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="qr-login-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>QR вход</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="qr-login-body">
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={createSession}>Попробовать снова</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="qr-login-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>QR вход</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="qr-login-body">
          <div className="qr-code-container">
            <div className="qr-code-wrapper">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrLink)}`} 
                alt="QR Code" 
              />
            </div>
            <p className="qr-hint">
              Отсканируйте QR-код в разделе<br />
              <strong>Настройки → Устройства → Сканировать QR</strong>
            </p>
            <div className="qr-status">
              Статус: {status === 'waiting' && 'Ожидание сканирования...'}
              {status === 'scanning' && 'Сканирование...'}
              {status === 'confirmed' && '✅ Подтверждено!'}
              {status === 'expired' && '❌ Истекло'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRLogin;