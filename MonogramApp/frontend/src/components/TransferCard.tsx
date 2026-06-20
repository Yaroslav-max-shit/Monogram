import React, { useState } from 'react';
import { ArrowRightLeft, Check, Clock, X, Copy } from 'lucide-react';

interface TransferCardProps {
  amount: number;
  toUsername: string;
  toAvatar?: string;
  status: 'completed' | 'processing' | 'error';
  time: string;
  txId?: string;
  comment?: string;
  isOwn: boolean;
}

const TransferCard: React.FC<TransferCardProps> = ({
  amount, toUsername, toAvatar, status, time, txId, comment, isOwn
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    completed: { icon: <Check size={14} />, color: '#10b981', text: 'Выполнен' },
    processing: { icon: <Clock size={14} />, color: '#f59e0b', text: 'В обработке' },
    error: { icon: <X size={14} />, color: '#ef4444', text: 'Ошибка' }
  };

  const s = statusConfig[status];

  return (
    <div className="transfer-card" onClick={() => setShowDetails(!showDetails)}>
      <div className="transfer-card-icon">
        <ArrowRightLeft size={20} />
      </div>
      
      <div className="transfer-card-body">
        <div className="transfer-card-amount">
          {isOwn ? '-' : '+'}{amount.toLocaleString('ru-RU')} ₽
        </div>
        <div className="transfer-card-user">
          {toAvatar && <img src={toAvatar} alt="" className="transfer-card-avatar" />}
          <span>{toUsername}</span>
        </div>
        {comment && <div className="transfer-card-comment">{comment}</div>}
      </div>
      
      <div className="transfer-card-meta">
        <span className="transfer-card-status" style={{color: s.color}}>
          {s.icon}
          <span>{s.text}</span>
        </span>
        <span className="transfer-card-time">{time}</span>
      </div>
      
      {showDetails && txId && (
        <div className="transfer-card-details">
          <span className="transfer-card-txid">#{txId}</span>
          <button className="transfer-card-copy" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(txId); }}>
            <Copy size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransferCard;
