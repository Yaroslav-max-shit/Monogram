import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Settings: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [language, setLanguage] = useState('ru')
  const [newPin, setNewPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [showLogout, setShowLogout] = useState(false)
  const [logoutPin, setLogoutPin] = useState('')
  const [logoutError, setLogoutError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const settingsRes = await api.get('/settings/')
      setLanguage(settingsRes.data.language || 'ru')
      const userRes = await api.get('/auth/me')
      setUsername(userRes.data.username)
      setEmail(userRes.data.email)
      const accRes = await api.get('/accounts/')
      setAccounts(accRes.data)
    } catch (err) { console.error(err) }
  }

  const saveSettings = async () => {
    setError('')
    setSuccess('')
    try {
      const data: any = { language }
      if (newPin.length === 6 && currentPin) {
        data.pin_code = newPin
        data.current_pin = currentPin
      }
      await api.put('/settings/', data)
      setSuccess('Настройки сохранены')
      setNewPin('')
      setCurrentPin('')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сохранения')
    }
  }

  const setPrimary = async (id: number) => {
    await api.put(`/accounts/${id}/primary`)
    loadData()
    setSuccess('Основной счёт изменён')
    setTimeout(() => setSuccess(''), 2000)
  }

  const setTransferDefault = async (id: number) => {
    await api.put(`/accounts/${id}/transfer-default`)
    loadData()
    setSuccess('Счёт для переводов изменён')
    setTimeout(() => setSuccess(''), 2000)
  }

  const handleLogout = async () => {
    if (logoutPin.length !== 6) {
      setLogoutError('Введите PIN-код (6 цифр)')
      return
    }
    try {
      await api.post('/auth/verify-pin', { pin_code: logoutPin })
      onLogout()
    } catch (err: any) {
      setLogoutError(err.response?.data?.detail || 'Неверный PIN')
    }
  }

  return (
    <div className="qp-page">
      <h1>Настройки</h1>

      {success && <div className="qp-success">{success}</div>}
      {error && <div className="qp-error">{error}</div>}

      <div className="qp-account-settings">
        <h2>Аккаунт</h2>
        <div className="qp-setting-row">
          <span className="qp-setting-label">Имя пользователя</span>
          <span className="qp-setting-value">{username}</span>
        </div>
        <div className="qp-setting-row">
          <span className="qp-setting-label">Email</span>
          <span className="qp-setting-value">{email}</span>
        </div>
      </div>

      <div className="qp-account-settings" style={{marginTop: 16}}>
        <h2>Основной счёт</h2>
        <div className="qp-form-group">
          <select value={accounts.find(a => a.is_primary)?.id || ''} onChange={e => setPrimary(Number(e.target.value))}>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.balance} ₽)</option>
            ))}
          </select>
        </div>

        <h2 style={{marginTop: 24}}>Счёт по умолчанию для переводов</h2>
        <div className="qp-form-group">
          <select value={accounts.find(a => a.is_transfer_default)?.id || ''} onChange={e => setTransferDefault(Number(e.target.value))}>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.balance} ₽)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="qp-account-settings" style={{marginTop: 16}}>
        <h2>Язык</h2>
        <div className="qp-form-group">
          <select value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="qp-account-settings" style={{marginTop: 16}}>
        <h2>Смена PIN-кода</h2>
        <div className="qp-form-group">
          <label>Текущий PIN</label>
          <input type="password" placeholder="6 цифр" value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))} maxLength={6} />
        </div>
        <div className="qp-form-group">
          <label>Новый PIN</label>
          <input type="password" placeholder="6 цифр" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} maxLength={6} />
        </div>
      </div>

      <div style={{marginTop: 24}}>
        <button className="qp-btn-primary" onClick={saveSettings}>Сохранить настройки</button>
      </div>

      <div className="qp-account-settings" style={{marginTop: 24}}>
        <h2>Выход из аккаунта</h2>
        {!showLogout ? (
          <button className="qp-btn-danger" onClick={() => setShowLogout(true)}>Выйти из аккаунта</button>
        ) : (
          <div>
            <p style={{color: 'var(--qp-text-secondary)', marginBottom: 16}}>Введите PIN-код для подтверждения выхода</p>
            <div className="qp-form-group">
              <input type="password" placeholder="PIN-код (6 цифр)" value={logoutPin} onChange={e => setLogoutPin(e.target.value.replace(/\D/g, ''))} maxLength={6} />
            </div>
            {logoutError && <div className="qp-error">{logoutError}</div>}
            <div style={{display: 'flex', gap: 12}}>
              <button className="qp-btn-secondary" onClick={() => { setShowLogout(false); setLogoutPin(''); setLogoutError(''); }}>Отмена</button>
              <button className="qp-btn-danger" onClick={handleLogout}>Выйти</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings
