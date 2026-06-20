import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import apiClient from '../services/api';
import { saveSession } from '../services/cookies';
import Icon from './Icon';
import ForgotPasswordModal from './ForgotPasswordModal';
import './Login.css';

const Login: React.FC<{ onLogin?: () => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [registerStep, setRegisterStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Обработка сигналов от окна подтверждения
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REGISTRATION_SUCCESS') {
        setSuccessMessage('Регистрация подтверждена! Вход выполнен.');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else if (event.data?.type === 'REGISTRATION_ERROR') {
        setErrorMessage('Связь с сервером не удалась. Перейдите обратно на страницу регистрации и следуйте инструкциям.');
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const googleLogin = () => {
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || '',
      response_type: 'code',
      scope: 'email profile',
      access_type: 'offline',
      prompt: 'consent'
    });
  };

  const validateForm = (): string | null => {
    if (isLogin) {
      if (username.length < 3) return 'Имя пользователя должно содержать не менее 3 символов';
      if (password.length < 8) return 'Пароль должен содержать не менее 8 символов';
    } else {
      if (!email.includes('@')) return 'Введите корректный email';
      if (!firstName.trim()) return 'Введите имя';
      if (password.length < 8) return 'Пароль должен содержать не менее 8 символов';
    }
    return null;
  };

  const translateError = (status: number, detail: string): string => {
    const errorMap: Record<number, string> = {
      400: 'Пользователь с такими данными уже существует',
      401: 'Неверный логин или пароль',
      404: 'Пользователь не найден',
      422: 'Проверьте правильность заполнения полей',
      429: 'Слишком много попыток. Подождите немного',
      500: 'Ошибка сервера. Попробуйте позже',
    };
    return errorMap[status] || detail || 'Неизвестная ошибка';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    const validationError = validateForm();
    if (validationError) { 
      setError(validationError); 
      return; 
    }
    setLoading(true);

    try {
      if (isLogin) {
        const response = await apiClient.post('/auth/login', { username, password });
        const token = response.data.access_token;
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Fetch full user data from /auth/me
        let userAvatar = '';
        let userFirstName = '';
        let userLastName = '';
        try {
          const meRes = await apiClient.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
          userAvatar = meRes.data.avatar_url || '';
          userFirstName = meRes.data.first_name || '';
          userLastName = meRes.data.last_name || '';
        } catch {}
        
        await saveSession(token, {
          id: payload.user_id || payload.sub || 1,
          username: username,
          firstName: userFirstName || username,
          lastName: userLastName,
          avatar_url: userAvatar,
        });
        if (onLogin) onLogin();
      } else {
        await apiClient.post('/auth/register/init', {
          email,
          password,
          first_name: firstName,
          last_name: lastName || '',
          avatar_url: avatar || '',
        });
        
        setSuccessMessage(`Письмо с подтверждением отправлено на ${email}`);
        setRegisterStep(2);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      
      if (Array.isArray(detail)) {
        setError(detail.map((e: any) => e.msg).join(', '));
      } else if (detail) {
        setError(translateError(status, detail));
      } else if (!err.response) {
        setError('Сервер недоступен');
      } else {
        setError(translateError(status, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Icon name="send" size={48} />
        </div>
        <h2>{isLogin ? 'Вход в Monogram' : 'Регистрация'}</h2>
        <p className="auth-subtitle">{isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}</p>

        {error && (
          <div className="error-message">
            <Icon name="note" size={14} /> {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message" style={{
            background: '#10b981',
            color: 'white',
            padding: '12px',
            borderRadius: '12px',
            marginTop: '16px',
            textAlign: 'center'
          }}>
            ✅ {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="error-message" style={{
            background: '#ef4444',
            color: 'white',
            padding: '12px',
            borderRadius: '12px',
            marginTop: '16px',
            textAlign: 'center'
          }}>
            ❌ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin ? (
            registerStep === 1 ? (
              <>
                <div className="register-avatar" onClick={() => document.getElementById('reg-avatar-input')?.click()}>
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="register-avatar-preview" />
                  ) : (
                    <div className="register-avatar-placeholder">
                      <Icon name="upload" size={32} />
                    </div>
                  )}
                  <input id="reg-avatar-input" type="file" accept="image/*" hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        const reader = new FileReader();
                        reader.onload = (event) => setAvatar(event.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <p className="register-avatar-hint">Фото профиля</p>
                </div>
                <input type="text" placeholder="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-field" required />
                <input type="text" placeholder="Фамилия (необязательно)" value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-field" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
                <input type="password" placeholder="Пароль (от 8 символов)" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required minLength={8} />
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Загрузка...' : 'Отправить код подтверждения'}
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                <h3>Проверьте почту</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '1rem 0', fontSize: '0.9rem' }}>
                  Мы отправили письмо на <strong>{email}</strong>
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                  Перейдите по ссылке в письме, чтобы завершить регистрацию
                </p>
                <button type="button" className="toggle-btn" onClick={() => setIsLogin(true)} style={{ marginTop: '1rem' }}>
                  Вернуться ко входу
                </button>
              </div>
            )
          ) : (
            <>
              <input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" required minLength={3} />
              <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required minLength={8} />
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Загрузка...' : 'Войти'}
              </button>
            </>
          )}
        </form>

        {isLogin && (
          <>
            <button 
              className="forgot-password-btn" 
              onClick={() => setShowForgotPassword(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '8px',
                marginTop: '4px',
                width: '100%'
              }}
            >
              Забыли пароль?
            </button>
            
            <div className="auth-divider"><span>или</span></div>
            
            <button
              className="yandex-login-btn"
              onClick={() => {
                window.location.href = 'https://oauth.yandex.ru/authorize?response_type=code&client_id=2c2896c5007a4c77b0ba0e4236b47fb3&redirect_uri=https://f1w6ggb2-8000.euw.devtunnels.ms/auth/yandex/callback';
              }}
              style={{
                width: '100%', padding: '10px', background: '#fc3f1d', color: '#fff',
                border: 'none', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 600,
                cursor: 'pointer', marginTop: '8px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Я</span> Войти через Яндекс
            </button>
            
            <button
              className="google-login-btn"
              onClick={() => googleLogin()}
              style={{
                width: '100%', padding: '10px', background: '#4285f4', color: '#fff',
                border: 'none', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 600,
                cursor: 'pointer', marginTop: '8px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>G</span> Войти через Google
            </button>
          </>
        )}

        <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="toggle-btn">
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
      
      {showForgotPassword && (
        <ForgotPasswordModal 
          onClose={() => setShowForgotPassword(false)} 
          userEmail={email || undefined}
        />
      )}
    </div>
  );
};

export default Login;
