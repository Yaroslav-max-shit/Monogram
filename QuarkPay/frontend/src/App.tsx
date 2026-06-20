import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transfers from './pages/Transfers'
import History from './pages/History'
import Settings from './pages/Settings'
import Connect from './pages/Connect'
import Login from './pages/Login'
import Register from './pages/Register'
import PayPage from './pages/PayPage'
import PaySuccess from './pages/PaySuccess'
import api from './services/api'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('quarkpay_token')
    if (saved) {
      setIsLoggedIn(true)
      api.get('/auth/me').then(res => setUsername(res.data.username)).catch(() => {})
    }
  }, [])

  const handleLogin = (token: string) => {
    localStorage.setItem('quarkpay_token', token)
    setIsLoggedIn(true)
    api.get('/auth/me').then(res => setUsername(res.data.username)).catch(() => {})
  }

  const handleLogout = () => {
    localStorage.removeItem('quarkpay_token')
    setIsLoggedIn(false)
    setUsername('')
  }

  if (!isLoggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register onRegister={handleLogin} />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout} username={username}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/pay/:code" element={<PayPage />} />
          <Route path="/pay-success" element={<PaySuccess />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
