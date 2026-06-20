import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';

interface MultiStepRegistrationProps {
  onComplete: (token: string) => void;
}

const MultiStepRegistration: React.FC<MultiStepRegistrationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  
  // Шаг 2: личные данные
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [birthDate, setBirthDate] = useState({ day: 1, month: 0, year: 2000 });
  
  // Шаг 3: username
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  
  // Шаг 4: пароль
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Даты для рождения
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  // Проверка username
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      setSuggestions([]);
      return;
    }
    
    const delay = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await apiClient.get(`/auth/check-username?username=${username}`);
        setUsernameAvailable(!res.data.exists);
        
        if (res.data.exists) {
          // Генерируем предложения
          let counter = 1;
          const newSuggestions = [];
          while (newSuggestions.length < 3) {
            const candidate = `${username}${counter}`;
            const checkRes = await apiClient.get(`/auth/check-username?username=${candidate}`);
            if (!checkRes.data.exists) {
              newSuggestions.push(candidate);
            }
            counter++;
          }
          setSuggestions(newSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch {
        setUsernameAvailable(false);
      }
      setChecking(false);
    }, 500);
    
    return () => clearTimeout(delay);
  }, [username]);

  // Проверка пароля
  useEffect(() => {
    const hasMinLength = password.length >= 8;
    const hasDigit = /[0-9]/.test(password);
    const hasLatin = /[a-zA-Z]/.test(password);
    const match = password === passwordConfirm && password !== '';
    
    setPasswordValid(hasMinLength && hasDigit && hasLatin && match);
  }, [password, passwordConfirm]);

  // Шаг 1: отправка email
  const sendVerificationEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Введите корректный email');
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.post('/auth/register/init', { email });
      setEmailSent(true);
      setError('');
      
      // Запускаем проверку подтверждения
      const interval = setInterval(async () => {
        try {
          // Проверяем, подтверждён ли email
          const res = await apiClient.get(`/auth/check-verification/${email}`);
          if (res.data.confirmed) {
            clearInterval(interval);
            setVerificationToken(res.data.token);
            setStep(2);
            setEmailSent(false);
          }
        } catch (err) {
          // игнорируем
        }
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: сохранение личных данных
  const savePersonalData = () => {
    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }
    setStep(3);
    setError('');
  };

  // Шаг 3: проверка username
  const saveUsername = () => {
    if (usernameAvailable !== true) {
      setError('Выберите доступное имя пользователя');
      return;
    }
    setStep(4);
    setError('');
  };

  // Шаг 4: создание аккаунта
  const createAccount = async () => {
    if (!passwordValid) {
      setError('Пароль должен содержать минимум 8 символов, цифры и латиницу');
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('birth_date', `${birthDate.year}-${birthDate.month + 1}-${birthDate.day}`);
    if (avatar) formData.append('avatar', avatar);
    
    try {
      const res = await apiClient.post('/auth/register/complete', formData);
      onComplete(res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка создания аккаунта');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (event) => setAvatarPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="multistep-registration">
      <div className="steps-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>4</div>
      </div>
      
      {step === 1 && (
        <div className="step-email">
          <h2>Регистрация</h2>
          <p>Введите ваш email для подтверждения</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={emailSent}
          />
          {!emailSent ? (
            <button onClick={sendVerificationEmail} disabled={loading}>
              {loading ? 'Отправка...' : 'Подтвердить email'}
            </button>
          ) : (
            <div className="waiting-message">
              <div className="spinner"></div>
              <p>Ждём пока вы подтвердите email, и отправим вас дальше</p>
            </div>
          )}
        </div>
      )}
      
      {step === 2 && (
        <div className="step-personal">
          <h2>Расскажите о себе</h2>
          
          <div className="avatar-upload" onClick={() => document.getElementById('avatar-input')?.click()}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" />
            ) : (
              <div className="avatar-placeholder">
                <Icon name="upload" size={32} />
              </div>
            )}
          </div>
          <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          
          <input
            type="text"
            placeholder="Имя *"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Фамилия (необязательно)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          
          <div className="birthdate-picker">
            <span>Дата рождения</span>
            <div className="selects">
              <select value={birthDate.day} onChange={(e) => setBirthDate({ ...birthDate, day: parseInt(e.target.value) })}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={birthDate.month} onChange={(e) => setBirthDate({ ...birthDate, month: parseInt(e.target.value) })}>
                {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={birthDate.year} onChange={(e) => setBirthDate({ ...birthDate, year: parseInt(e.target.value) })}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          
          <button onClick={savePersonalData}>Продолжить</button>
        </div>
      )}
      
      {step === 3 && (
        <div className="step-username">
          <h2>Выберите имя пользователя</h2>
          <p>Это имя будут видеть другие пользователи</p>
          
          <div className="username-input">
            <span className="at">@</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
          </div>
          
          {checking && <div className="checking">Проверка...</div>}
          
          {usernameAvailable === true && (
            <div className="available">✓ Имя доступно</div>
          )}
          
          {usernameAvailable === false && (
            <div className="taken">
              ✗ Имя занято
              {suggestions.length > 0 && (
                <div className="suggestions">
                  <span>Возможно, вам подойдёт:</span>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => setUsername(s)}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <button onClick={saveUsername} disabled={usernameAvailable !== true}>
            Продолжить
          </button>
        </div>
      )}
      
      {step === 4 && (
        <div className="step-password">
          <h2>Придумайте пароль</h2>
          <p>Минимум 8 символов, цифры и латиница</p>
          
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
          
          {password && (
            <div className="password-requirements">
              <div className={password.length >= 8 ? 'valid' : 'invalid'}>✓ Минимум 8 символов</div>
              <div className={/[0-9]/.test(password) ? 'valid' : 'invalid'}>✓ Хотя бы одна цифра</div>
              <div className={/[a-zA-Z]/.test(password) ? 'valid' : 'invalid'}>✓ Латинские буквы</div>
              <div className={password === passwordConfirm && password !== '' ? 'valid' : 'invalid'}>✓ Пароли совпадают</div>
            </div>
          )}
          
          <button onClick={createAccount} disabled={!passwordValid || loading}>
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      <style>{`
        .multistep-registration {
          max-width: 450px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .steps-indicator {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 40px;
        }
        .step {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-primary);
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: var(--text-tertiary);
        }
        .step.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }
        .waiting-message {
          text-align: center;
          margin-top: 20px;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-color);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        .birthdate-picker {
          margin: 16px 0;
        }
        .selects {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .selects select {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-primary);
        }
        .username-input {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0 12px;
        }
        .at {
          font-size: 18px;
          color: var(--text-tertiary);
        }
        .username-input input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 14px 0;
        }
        .suggestions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .suggestions button {
          padding: 6px 12px;
          border-radius: 20px;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          font-size: 0.85rem;
        }
        .password-requirements {
          margin-top: 12px;
          font-size: 0.8rem;
        }
        .valid { color: #10b981; }
        .invalid { color: #ef4444; opacity: 0.5; }
      `}</style>
    </div>
  );
};

export default MultiStepRegistration;