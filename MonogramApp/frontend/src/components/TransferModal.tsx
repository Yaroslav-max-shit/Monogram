import React, { useState } from 'react';
import { Check, X, CreditCard } from 'lucide-react';
import apiClient from '../services/api';

interface TransferModalProps {
  onClose: () => void;
  toUsername?: string;
  position?: { bottom: number; left: number };
}

const TransferModal: React.FC<TransferModalProps> = ({ onClose, toUsername, position }) => {
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleTransfer = async () => {
    if (!amount || !toUsername) {
      setError('Заполните сумму');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/transfer/', {
        to_username: toUsername,
        amount: Number(amount),
        comment: comment,
        pin_code: pin
      });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Ошибка перевода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{position: 'fixed', bottom: 80, right: 20, zIndex: 1000}}>
      <div style={{background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '20px', width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease'}}>
        {success ? (
          <div style={{textAlign: 'center', padding: '20px 0'}}>
            <div style={{width: 48, height: 48, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'}}>
              <Check size={24} color="white" />
            </div>
            <p style={{fontWeight: 600}}>Перевод выполнен!</p>
          </div>
        ) : (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <CreditCard size={18} color="#10b981" />
                <span style={{fontWeight: 600, fontSize: '0.95rem'}}>Перевод {toUsername}</span>
              </div>
              <button onClick={onClose} style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 4}}><X size={16} /></button>
            </div>
            
            <div style={{marginBottom: 12}}>
              <label style={{display: 'block', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: 4}}>Сумма (₽)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min="0.01" step="0.01" style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', outline: 'none', fontSize: '1.1rem', fontWeight: 600}} />
            </div>
            
            <div style={{marginBottom: 12}}>
              <input type="text" value={comment} onChange={e => setComment(e.target.value)} placeholder="Комментарий" style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem'}} />
            </div>
            
            <div style={{marginBottom: 12}}>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN-код" maxLength={6} style={{width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem'}} />
            </div>
            
            {error && <div style={{color: '#ef4444', fontSize: '0.85rem', marginBottom: 12}}>{error}</div>}
            
            <button onClick={handleTransfer} disabled={loading} style={{width: '100%', padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'}}>
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TransferModal;
