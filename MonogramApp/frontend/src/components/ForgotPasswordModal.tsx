import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';

interface ForgotPasswordModalProps {
  onClose: () => void;
  userEmail?: string;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, userEmail }) => {
  const [hasEmail, setHasEmail] = useState(!!userEmail);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailReset = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { email: userEmail });
      setEmailSent(true);
    } catch (error) {
      alert('Ошибка отправки письма');
    } finally {
      setLoading(false);
    }
  };

  const handleSupport = () => {
    window.open('https://max.ru/u/f9LHodD0cOLBu9XJwUA3lsY3qu5u_pWyVqDoSo8HSSZzzaMGeIXIM3T0EjM');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="forgot-password-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Восстановление доступа</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          {!emailSent ? (
            <>
              <p className="forgot-description">Выберите способ восстановления доступа к аккаунту</p>
              
              <div className="recovery-options">
                {hasEmail && (
                  <button className="recovery-btn" onClick={handleEmailReset} disabled={loading}>
                    <Icon name="mail" size={24} />
                    <div className="recovery-btn-info">
                      <span className="recovery-btn-title">Восстановить через email</span>
                      <span className="recovery-btn-desc">Отправим ссылку для сброса пароля на {userEmail}</span>
                    </div>
                    <Icon name="arrow-right" size={18} />
                  </button>
                )}
                
                <button className="recovery-btn" onClick={handleSupport}>
                  <Icon name="message" size={24} />
                  <div className="recovery-btn-info">
                    <span className="recovery-btn-title">Написать в поддержку</span>
                    <span className="recovery-btn-desc">Свяжитесь с нами для решения проблемы</span>
                  </div>
                  <Icon name="arrow-right" size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="email-sent">
              <div className="email-sent-icon">📧</div>
              <h3>Письмо отправлено!</h3>
              <p>Проверьте почту {userEmail} и перейдите по ссылке для сброса пароля</p>
              <button className="close-btn" onClick={onClose}>Закрыть</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
