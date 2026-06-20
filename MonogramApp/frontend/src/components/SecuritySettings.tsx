import React, { useState } from 'react';
import { enable2FA, verify2FA, disable2FA, changePassword, changeEmail } from '../utils/features';

const SecuritySettings: React.FC = () => {
  const [tab, setTab] = useState<'password' | 'email' | '2fa'>('password');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [has2FA, setHas2FA] = useState(false);

  const handlePassword = async () => {
    setErr(''); setMsg('');
    try {
      await changePassword(oldPass, newPass);
      setMsg('Пароль изменён');
      setOldPass(''); setNewPass('');
    } catch (e: any) { setErr(e.response?.data?.detail || 'Ошибка'); }
  };

  const handleEmail = async () => {
    setErr(''); setMsg('');
    try {
      await changeEmail(email);
      setMsg('Email изменён');
    } catch (e: any) { setErr(e.response?.data?.detail || 'Ошибка'); }
  };

  const handleEnable2FA = async () => {
    setErr(''); setMsg('');
    try {
      const data = await enable2FA();
      setSecret(data.secret);
      setShowQR(true);
      setMsg('Сканируйте QR-код в приложении аутентификации');
    } catch (e: any) { setErr(e.response?.data?.detail || 'Ошибка'); }
  };

  const handleVerify2FA = async () => {
    setErr(''); setMsg('');
    try {
      await verify2FA(code);
      setShowQR(false);
      setHas2FA(true);
      setMsg('2FA включена');
    } catch (e: any) { setErr(e.response?.data?.detail || 'Неверный код'); }
  };

  const handleDisable2FA = async () => {
    setErr(''); setMsg('');
    try {
      await disable2FA();
      setHas2FA(false);
      setSecret('');
      setMsg('2FA отключена');
    } catch (e: any) { setErr(e.response?.data?.detail || 'Ошибка'); }
  };

  return (
    <div className="security-settings">
      <div className="settings-tabs">
        <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}>Пароль</button>
        <button className={tab === 'email' ? 'active' : ''} onClick={() => setTab('email')}>Email</button>
        <button className={tab === '2fa' ? 'active' : ''} onClick={() => setTab('2fa')}>2FA</button>
      </div>

      {err && <div className="settings-error">{err}</div>}
      {msg && <div className="settings-success">{msg}</div>}

      {tab === 'password' && (
        <div className="settings-form">
          <input type="password" placeholder="Текущий пароль" value={oldPass} onChange={e => setOldPass(e.target.value)} />
          <input type="password" placeholder="Новый пароль (мин. 6 символов)" value={newPass} onChange={e => setNewPass(e.target.value)} />
          <button className="btn-primary" onClick={handlePassword} disabled={!oldPass || !newPass || newPass.length < 6}>Сменить пароль</button>
        </div>
      )}

      {tab === 'email' && (
        <div className="settings-form">
          <input type="email" placeholder="Новый email" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="btn-primary" onClick={handleEmail} disabled={!email || !email.includes('@')}>Сменить email</button>
        </div>
      )}

      {tab === '2fa' && (
        <div className="settings-form">
          {!has2FA && !showQR && (
            <button className="btn-primary" onClick={handleEnable2FA}>Включить 2FA</button>
          )}
          {showQR && (
            <div className="qr-setup">
              <p>Секретный ключ: <code>{secret}</code></p>
              <p>Или введите код из приложения:</p>
              <input type="text" placeholder="Код из приложения" value={code} onChange={e => setCode(e.target.value)} maxLength={6} />
              <button className="btn-primary" onClick={handleVerify2FA} disabled={code.length < 6}>Подтвердить</button>
            </div>
          )}
          {has2FA && !showQR && (
            <button className="btn-danger" onClick={handleDisable2FA}>Отключить 2FA</button>
          )}
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;
