import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [recentTx, setRecentTx] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const accRes = await api.get('/accounts/')
      setAccounts(accRes.data)
      setTotalBalance(accRes.data.reduce((sum: number, a: any) => sum + a.balance, 0))
      const notifRes = await api.get('/notifications/')
      setNotifications(notifRes.data.slice(0, 5))
      const txRes = await api.get('/transfer/history')
      setRecentTx(txRes.data.slice(0, 5))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="qp-page">
      <div className="qp-dashboard-total">
        <span className="qp-total-label">Общий баланс</span>
        <span className="qp-total-amount">{totalBalance.toLocaleString('ru-RU')} <span className="qp-total-currency">₽</span></span>
      </div>

      <div className="qp-dashboard-actions">
        <Link to="/transfers" className="qp-action-card"><div className="qp-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div><span className="qp-action-label">Перевод</span></Link>
        <Link to="/accounts" className="qp-action-card"><div className="qp-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div><span className="qp-action-label">Счета</span></Link>
        <Link to="/history" className="qp-action-card"><div className="qp-action-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><span className="qp-action-label">История</span></Link>
      </div>

      <div className="qp-dashboard-accounts">
        <h2>Счета</h2>
        {accounts.map(acc => (
          <div key={acc.id} className={`qp-account-card ${acc.account_type}`}>
            <div className="qp-account-header"><span className="qp-account-type-badge">{acc.account_type === 'main' ? 'Основной' : 'Бизнес'}</span></div>
            <h3>{acc.name}</h3>
            <span className="qp-account-balance">{acc.balance.toLocaleString('ru-RU')} ₽</span>
          </div>
        ))}
      </div>

      {recentTx.length > 0 && (
        <div className="qp-dashboard-accounts"><h2>Последние операции</h2>
          {recentTx.map((tx: any) => (
            <div key={tx.id} className="qp-history-item">
              <div className="qp-history-info"><span className="qp-history-desc">{tx.description || tx.transaction_type}</span><span className="qp-history-date">{new Date(tx.created_at).toLocaleString('ru-RU')}</span></div>
              <span className={`qp-history-amount ${tx.from_account_id ? 'negative' : 'positive'}`}>{tx.from_account_id ? '-' : '+'}{tx.amount.toLocaleString('ru-RU')} ₽</span>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="qp-dashboard-accounts"><h2>Уведомления</h2>
          {notifications.map((n: any) => (<div key={n.id} className="qp-notif-item">{n.message}</div>))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
