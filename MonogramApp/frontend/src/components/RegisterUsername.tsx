import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';
import { saveSession } from '../services/cookies';

const RegisterUsername: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const [username, setUsername] = useState('');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const token = params.get('token') || '';
  const firstName = params.get('first_name') || '';

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      saveSession(token, { id: payload.user_id, username: '', firstName });
    }
  }, [token, firstName]);

  useEffect(() => {
    if (username.length >= 3) {
      setChecking(true);
      apiClient.get(`/auth/check-username?username=${username}`)
        .then(res => setAvailable(!res.data.exists))
        .catch(() => setAvailable(false))
        .finally(() => setChecking(false));
    } else {
      setAvailable(null);
    }
  }, [username]);

  const handleSubmit = async () => {
    if (!username || available !== true) {
      setError('Выберите доступное имя пользователя');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/register/set-username', { username });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Icon name="checkmark" size={64} />
          <h2>Регистрация завершена!</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>Добро пожаловать в Monogram</p>
          <button className="submit-btn" onClick={() => window.location.href = '/'}>
            Перейти в мессенджер
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <Icon name="send" size={48} />
        </div>
        <h2>Шаг 2: Имя пользователя</h2>
        <p className="auth-subtitle">Придумайте уникальное имя пользователя</p>

        {error && <div className="error-message">{error}</div>}

        <div className="username-input-wrapper" style={{ marginTop: '1rem' }}>
          <span className="at-symbol">@</span>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className="username-input"
            autoFocus
          />
        </div>

        {username.length >= 3 && (
          <div className="username-status" style={{ margin: '0.5rem 0' }}>
            {checking ? (
              <span style={{ color: 'var(--text-tertiary)' }}>Проверка...</span>
            ) : available === true ? (
              <span style={{ color: 'var(--success)' }}>✓ Доступно</span>
            ) : available === false ? (
              <span style={{ color: 'var(--danger)' }}>✗ Занято</span>
            ) : null}
          </div>
        )}

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading || available !== true}
          style={{ marginTop: '1rem' }}
        >
          {loading ? 'Загрузка...' : 'Завершить регистрацию'}
        </button>
      </div>
    </div>
  );
};

export default RegisterUsername;