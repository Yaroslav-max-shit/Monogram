import React, { useState, useEffect } from 'react'
import api from '../services/api'

const History: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    const res = await api.get('/transfer/history')
    setTransactions(res.data)
  }

  const filtered = transactions.filter(t =>
    !search || t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    if (type === 'transfer') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
    if (type === 'payment') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
  }

  return (
    <div className="qp-page">
      <h1>История операций</h1>

      <input className="qp-search" type="text" placeholder="Поиск по описанию..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="qp-history-list">
        {filtered.map(tx => (
          <div key={tx.id} className="qp-history-item">
            <div className="qp-history-info">
              <div className={`qp-history-icon ${tx.transaction_type}`}>{getTypeIcon(tx.transaction_type)}</div>
              <div>
                <span className="qp-history-desc">{tx.description || tx.transaction_type}</span>
                <span className="qp-history-date">{new Date(tx.created_at).toLocaleString('ru-RU')}</span>
              </div>
            </div>
            <span className={`qp-history-amount ${tx.from_account_id ? 'negative' : 'positive'}`}>
              {tx.from_account_id ? '-' : '+'}{tx.amount.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default History
