import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

const PayPage: React.FC = () => {
  const { code } = useParams<{ code: string }>()
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [amount, setAmount] = useState(49)
  const [description] = useState('Premium Monogram')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  React.useEffect(() => {
    api.get('/accounts/').then(res => {
      setAccounts(res.data)
      const defaultAcc = res.data.find((a: any) => a.is_transfer_default)
      if (defaultAcc) setSelectedAccount(String(defaultAcc.id))
    }).catch(() => {})
  }, [])

  const handlePay = async () => {
    if (!selectedAccount) { setError('Выберите счёт'); return }
    const pin = prompt('Введите PIN-код:')
    if (!pin) return
    setLoading(true)
    setError('')
    try {
      await api.post('/payment/test-premium', { plan: amount === 49 ? 'month' : 'year' })
      setShowSuccess(true)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Ошибка оплаты')
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="qp-pay-success">
        <div className="qp-pay-success-card">
          <div className="qp-pay-success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2>Оплата прошла успешно!</h2>
          <p>Premium активирован на {amount === 49 ? '1 месяц' : '12 месяцев'}</p>
          <button className="qp-btn-primary" onClick={() => window.location.href = '/'}>Продолжить</button>
        </div>
      </div>
    )
  }

  return (
    <div className="qp-pay-page">
      <div className="qp-pay-logo">QuarkPay</div>
      
      <div className="qp-pay-card">
        <div className="qp-pay-receiver">
          <div className="qp-pay-receiver-icon">M</div>
          <div>
            <div className="qp-pay-receiver-name">Monogram</div>
            <div className="qp-pay-receiver-desc">Premium подписка</div>
          </div>
        </div>

        <div className="qp-pay-amount">{amount} ₽</div>

        <div className="qp-pay-form">
          <div className="qp-form-group">
            <label>Счёт списания</label>
            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.balance} ₽)</option>
              ))}
            </select>
          </div>

          <div className="qp-form-group">
            <label>Описание</label>
            <input type="text" value={description} readOnly />
          </div>

          {error && <div className="qp-error">{error}</div>}

          <button className="qp-btn-primary" onClick={handlePay} disabled={loading}>
            {loading ? 'Оплата...' : 'Оплатить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PayPage
