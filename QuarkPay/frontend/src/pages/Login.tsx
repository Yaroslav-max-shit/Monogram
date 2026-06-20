import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

interface LoginProps {
  onLogin: (token: string) => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { username, password })
      onLogin(res.data.access_token)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа')
      setLoading(false)
    }
  }

  return (
    <div className="qp-auth-page">
      <div className="qp-auth-card">
        <div className="qp-auth-logo">Q</div>
        <h1>QuarkPay</h1>
        <p>Войдите в свой аккаунт</p>

        {error && <div className="qp-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Имя пользователя" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
        </form>

        <div className="qp-auth-divider"><span>или</span></div>

        <button className="qp-btn-monogram" onClick={() => window.location.href = 'http://localhost:5173'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Войти через Monogram
        </button>

        <p className="qp-auth-link">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
      </div>
    </div>
  )
}

export default Login
