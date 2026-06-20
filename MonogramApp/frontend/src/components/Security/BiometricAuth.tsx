import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

interface BiometricAuthProps {
  onSuccess: () => void;
  onFailure?: () => void;
  reason?: string;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({ 
  onSuccess, 
  onFailure, 
  reason = 'Подтвердите личность' 
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      // На вебе биометрия не поддерживается полноценно
      // Для мобильных приложений нужен Capacitor, но пакет не существует
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      // Отключаем биометрию на вебе
      setIsSupported(false);
    };
    checkSupport();
  }, []);

  const authenticate = async () => {
    if (!isSupported) {
      onSuccess();
      return;
    }
    
    setIsAuthenticating(true);
    try {
      // Заглушка — просто запрашиваем PIN
      const pin = prompt('Введите PIN-код для входа:');
      const savedPin = localStorage.getItem('user_pin');
      
      if (pin === savedPin) {
        onSuccess();
      } else {
        onFailure?.();
      }
    } catch (error) {
      console.error('Auth error:', error);
      onFailure?.();
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button 
      onClick={authenticate} 
      disabled={isAuthenticating} 
      className="biometric-auth-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 24px',
        background: 'var(--accent)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        width: '100%',
        justifyContent: 'center'
      }}
    >
      <Icon name="fingerprint" size={24} style={{ filter: 'brightness(0) invert(1)' }} />
      <span>{isAuthenticating ? 'Проверка...' : 'Войти по PIN-коду'}</span>
    </button>
  );
};

export default BiometricAuth;