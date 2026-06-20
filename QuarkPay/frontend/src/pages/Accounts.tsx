import React, { useState, useEffect } from 'react'
import api from '../services/api'

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('main')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deletePin, setDeletePin] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [transferTo, setTransferTo] = useState('')

  useEffect(() => { loadAccounts() }, [])

  const loadAccounts = async () => {
    const res = await api.get('/accounts/')
    setAccounts(res.data)
  }

  const createAccount = async () => {
    if (!newName) return
    await api.post('/accounts/', { name: newName, account_type: newType })
    setNewName('')
    setShowCreate(false)
    loadAccounts()
  }

  const handleDelete = async () => {
    if (!deletePin || deletePin.length !== 6) {
      setDeleteError('Введите PIN-код (6 цифр)')
      return
    }
    try {
      await api.delete(`/accounts/${deleteTarget.id}`, { data: { pin_code: deletePin, transfer_to: transferTo || null } })
      setDeleteTarget(null)
      setDeletePin('')
      setDeleteError('')
      setTransferTo('')
      loadAccounts()
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || 'Ошибка удаления')
    }
  }

  const canDelete = (acc: any) => {
    if (acc.is_primary) return false
    if (acc.balance > 0) return false
    return true
  }

  const needsTransfer = (acc: any) => {
    return acc.is_primary || acc.is_transfer_default || acc.balance > 0
  }

  return (
    <div className="qp-page">
      <div className="qp-page-header">
        <h1>Счета</h1>
        {accounts.length < 10 && (
          <button className="qp-btn-primary" onClick={() => setShowCreate(true)}>+ Создать счёт</button>
        )}
      </div>

      {showCreate && (
        <div className="qp-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="qp-modal" onClick={e => e.stopPropagation()}>
            <h2>Новый счёт</h2>
            <div className="qp-form-group">
              <label>Название</label>
              <input placeholder="Название счёта" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="qp-form-group">
              <label>Тип</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="main">Основной</option>
                <option value="business">Бизнес</option>
              </select>
            </div>
            <div className="qp-modal-actions">
              <button className="qp-btn-secondary" onClick={() => setShowCreate(false)}>Отмена</button>
              <button className="qp-btn-primary" onClick={createAccount}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="qp-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="qp-delete-modal" onClick={e => e.stopPropagation()}>
            <h2>Удалить счёт</h2>
            {needsTransfer(deleteTarget) && (
              <div className="qp-delete-warning">
                На этом счёте есть средства или он используется как основной/для переводов.
                Выберите счёт для переноса настроек и баланса.
              </div>
            )}
            {needsTransfer(deleteTarget) && (
              <div className="qp-form-group">
                <label>Перенести на счёт</label>
                <select value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                  <option value="">-- Выберите счёт --</option>
                  {accounts.filter(a => a.id !== deleteTarget.id).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.balance} ₽)</option>
                  ))}
                </select>
              </div>
            )}
            <div className="qp-form-group">
              <label>PIN-код для подтверждения</label>
              <input type="password" placeholder="6 цифр" value={deletePin} onChange={e => setDeletePin(e.target.value.replace(/\D/g, ''))} maxLength={6} />
            </div>
            {deleteError && <div className="qp-error">{deleteError}</div>}
            <div className="qp-modal-actions">
              <button className="qp-btn-secondary" onClick={() => { setDeleteTarget(null); setDeletePin(''); setDeleteError(''); setTransferTo(''); }}>Отмена</button>
              <button className="qp-btn-danger" onClick={handleDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      <div className="qp-accounts-grid">
        {accounts.map(acc => (
          <div key={acc.id} className={`qp-account-card ${acc.account_type}`}>
            <div className="qp-account-header">
              <span className="qp-account-type-badge">{acc.account_type === 'main' ? 'Основной' : 'Бизнес'}</span>
              {acc.is_primary && <span className="qp-badge">Основной</span>}
              {acc.is_transfer_default && !acc.is_primary && <span className="qp-badge" style={{color: '#8b5cf6'}}>Для переводов</span>}
            </div>
            <h3>{acc.name}</h3>
            <span className="qp-account-balance">{acc.balance.toLocaleString('ru-RU')} ₽</span>
            {!acc.is_primary && (
              <button className="qp-btn-danger" style={{fontSize: '0.8rem', padding: '6px 12px'}} onClick={() => setDeleteTarget(acc)}>
                Удалить
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Accounts
