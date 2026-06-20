import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Connect: React.FC = () => {
  const [connected, setConnected] = useState(false)
  const [connectCode, setConnectCode] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { checkStatus() }, [])

  const checkStatus = async () => {
    const res = await api.get('/connect/status')
    setConnected(res.data.connected)
  }

  const generateCode = async () => {
    setLoading(true)
    try {
      const res = await api.post('/connect/generate')
      setConnectCode(res.data.connect_code)
    } finally { setLoading(false) }
  }

  const disconnect = async () => {
    await api.delete('/connect/')
    setConnected(false)
    setConnectCode('')
  }

  return (
    <div className="qp-page">
      <h1>Подключение к Monogram</h1>

      <div className="qp-connect-card">
        {connected ? (
          <div className="qp-connect-status">
            <div className="qp-connected-badge">
              <span className="qp-connected-dot"></span>
              Подключено к Monogram
            </div>
            <button className="qp-btn-danger" onClick={disconnect}>Отключить</button>
          </div>
        ) : (
          <div className="qp-connect-status">
            <p style={{color: 'var(--qp-text-secondary)', marginBottom: 24}}>
              Подключите QuarkPay к Monogram для отправки денег в чатах
            </p>
            <button className="qp-btn-primary" onClick={generateCode} disabled={loading}>
              {loading ? 'Генерация...' : 'Создать код подключения'}
            </button>
            {connectCode && (
              <div className="qp-connect-code-box">
                <p style={{color: 'var(--qp-text-secondary)', fontSize: '0.85rem'}}>Ваш код подключения:</p>
                <div className="qp-connect-code">{connectCode}</div>
                <p className="qp-hint">Перейдите в Monogram - Настройки - QuarkPay и введите этот код</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Connect
