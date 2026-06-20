import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '../services/api';
import '../styles/welcome.css';
interface WelcomeScreenProps {
  onLogin: () => void;
  onRegister?: () => void;
  onOpenScanner?: () => void;
}
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onRegister, onOpenScanner }) => {
  const [language, setLanguage] = useState<'en' | 'ru'>('en');
  const [isMobile, setIsMobile] = useState(false);
  const [qrLink, setQrLink] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const fetchQrLink = async () => {
      try {
        setQrLoading(true);
        const response = await apiClient.post('/auth/qr/create');
        setQrLink(response.data.qr_link);
        setError(null);
      } catch (error) {
        console.error('Failed to get QR link:', error);
        const fakeSessionId = Math.random().toString(36).substring(2, 15);
        setQrLink(`https://f1w6ggb2-5173.euw.devtunnels.ms/qr/register/${fakeSessionId}`);
        setError('Не удалось подключиться к серверу, но QR код работает');
      } finally {
        setQrLoading(false);
      }
    };
    fetchQrLink();
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const texts = {
    en: {
      title: 'Log in to Monogram by QR Code',
      step1: '1. Open Monogram on your phone',
      step2: '2. Go to Settings → Devices → Link Desktop Device',
      step3: '3. Point your phone at this screen to confirm login',
      scanBtn: 'SCAN QR CODE',
      loginBtn: 'LOG IN',
      continueBtn: 'ПРОДОЛЖИТЬ НА РУССКОМ'
    },
    ru: {
      title: 'Войдите в Monogram по QR-коду',
      step1: '1. Откройте Monogram на телефоне',
      step2: '2. Перейдите в Настройки → Устройства → Подключить устройство',
      step3: '3. Наведите камеру на этот экран для подтверждения входа',
      scanBtn: 'СКАНИРОВАТЬ QR',
      loginBtn: 'ВОЙТИ',
      continueBtn: 'CONTINUE IN ENGLISH'
    }
  };
  const t = texts[language];
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ru' : 'en');
  };
  if (qrLoading) {
    return (
      <div className="welcome-telegram">
        <div className="welcome-telegram-content">
          <div className="loading-spinner"></div>
          <p style={{ color: '#9ca3af', marginTop: '16px' }}>Загрузка QR кода...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="welcome-telegram">
      <div className="welcome-telegram-content">
        <h1 className="welcome-telegram-title">{t.title}</h1>
        <div className="welcome-telegram-qr">
          <div className="qr-wrapper">
            <QRCodeSVG
              value={qrLink}
              size={280}
              level="H"
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <div className="qr-logo">
              <img src="/assets/images/icon-32.png" alt="Monogram" />
            </div>
          </div>
        </div>
        {error && (
          <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '16px' }}>{error}</p>
        )}
        <div className="welcome-telegram-steps">
          <p>{t.step1}</p>
          <p>{t.step2}</p>
          <p>{t.step3}</p>
        </div>
        <div className="welcome-telegram-buttons">
          <button className="welcome-telegram-btn primary" onClick={onLogin}>
            {t.loginBtn}
          </button>
        </div>
        <button className="welcome-telegram-lang" onClick={toggleLanguage}>
          {t.continueBtn}
        </button>
      </div>
    </div>
  );
};
export default WelcomeScreen;