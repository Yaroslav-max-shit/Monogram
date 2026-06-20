import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface RegisterProps {
  onRegister: (token: string) => void
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/register', { email, username, password, pin_code: pin })
      onRegister(res.data.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации')
      setLoading(false)
    }
  }

  return (
    <div className="qp-auth-page">
      <div className="qp-auth-card">
        <div className="qp-auth-logo">Q</div>
        <h1>QuarkPay</h1>
        <p>Создайте аккаунт</p>

        {error && <div className="qp-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
          <input type="text" placeholder="PIN-код (6 цифр)" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} maxLength={6} required />
          <button type="submit" disabled={loading}>{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
        </form>

        <div className="qp-auth-divider"><span>или</span></div>

        <button className="qp-btn-monogram" onClick={() => window.location.href = 'http://localhost:5173'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Войти через Monogram
        </button>

        <p className="qp-auth-link">Уже есть аккаунт? <Link to="/">Войти</Link></p>
      </div>
    </div>
  )
}

export default Register
