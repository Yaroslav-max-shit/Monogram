import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Transfers: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [toUsername, setToUsername] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/accounts/').then(res => {
      setAccounts(res.data)
      const defaultAcc = res.data.find((a: any) => a.is_transfer_default)
      if (defaultAcc) setFromAccount(String(defaultAcc.id))
    })
  }, [])

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post('/transfer/', {
        from_account_id: Number(fromAccount),
        to_username: toUsername,
        amount: Number(amount),
        description,
        pin_code: pin
      })
      setSuccess(`Перевод ${res.data.amount}₽ выполнен! Ссылка: ${res.data.link}`)
      setAmount('')
      setDescription('')
      setPin('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка перевода')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="qp-page">
      <h1>Перевод</h1>
      
      {error && <div className="qp-error">{error}</div>}
      {success && <div className="qp-success">{success}</div>}
      
      <form onSubmit={handleTransfer} className="qp-transfer-form">
        <div className="qp-form-group">
          <label>Счёт списания</label>
          <select value={fromAccount} onChange={e => setFromAccount(e.target.value)}>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.balance} ₽)</option>
            ))}
          </select>
        </div>
        
        <div className="qp-form-group">
          <label>Получатель (username)</label>
          <input type="text" placeholder="username" value={toUsername} onChange={e => setToUsername(e.target.value)} required />
        </div>
        
        <div className="qp-form-group">
          <label>Сумма (₽)</label>
          <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01" required />
        </div>
        
        <div className="qp-form-group">
          <label>Описание</label>
          <input type="text" placeholder="За что перевод" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        
        <div className="qp-form-group">
          <label>PIN-код</label>
          <input type="password" placeholder="6 цифр" value={pin} onChange={e => setPin(e.target.value)} maxLength={6} required />
        </div>
        
        <button type="submit" className="qp-btn-primary" disabled={loading}>
          {loading ? 'Отправка...' : 'Отправить'}
        </button>
      </form>
    </div>
  )
}

export default Transfers
