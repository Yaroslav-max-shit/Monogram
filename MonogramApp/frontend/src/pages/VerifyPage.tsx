import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import { saveSession } from '../services/cookies';

const VerifyPage: React.FC = () => {
  const token = window.location.pathname.split('/verify/')[1] || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'needs_username' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [jwtToken, setJwtToken] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await apiClient.get(`/auth/verify/${token}`);

        if (response.status === 200 && response.data?.token) {
          const data = response.data;

          if (data.needs_username) {
            setJwtToken(data.token);
            setStatus('needs_username');
            return;
          }

          await saveSession(data.token, { id: 0, username: '', firstName: '', lastName: '' });

          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'REGISTRATION_SUCCESS', token: data.token }, '*');
            window.close();
          } else {
            setStatus('success');
            setTimeout(() => { window.location.href = '/'; }, 2000);
          }
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.response?.data?.detail || 'Не удалось подтвердить регистрацию');

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'REGISTRATION_ERROR', error: errorMsg }, '*');
        }
      }
    };

    verify();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="verify-container">
        <div className="verify-card">
          <div className="spinner"></div>
          <h2>Подтверждение регистрации...</h2>
        </div>
      </div>
    );
  }

  if (status === 'needs_username') {
    return (
      <div className="verify-container">
        <div className="verify-card success">
          <div className="icon">&#10004;</div>
          <h2>Email подтверждён!</h2>
          <p>Теперь выберите имя пользователя</p>
          <button
            className="verify-btn"
            onClick={() => { window.location.href = `/register-username?token=${jwtToken}`; }}
          >
            Выбрать имя пользователя
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="verify-container">
        <div className="verify-card success">
          <div className="icon">&#10004;</div>
          <h2>Регистрация подтверждена!</h2>
          <p>Перенаправление в мессенджер...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-container">
      <div className="verify-card error">
        <div className="icon">&#10008;</div>
        <h2>Ошибка подтверждения</h2>
        <p>{errorMsg}</p>
        <button onClick={() => { window.location.href = '/'; }} className="verify-btn">
          Перейти в мессенджер
        </button>
      </div>
    </div>
  );
};

export default VerifyPage;
