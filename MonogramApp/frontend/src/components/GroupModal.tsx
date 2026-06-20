import React, { useState } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';

const GroupModal: React.FC<{ onClose: () => void; onChatSelect: (id: number, name: string) => void }> = ({ onClose, onChatSelect }) => {
  const [name, setName] = useState('');
  
  const handleCreate = async () => {
    if (!name) return;
    try {
      const response = await apiClient.post('/chats/', { type: 'group', name });
      onChatSelect(response.data.id, response.data.name);
    } catch (e) {
      alert('Ошибка создания группы');
    }
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: '20px', padding: '2rem', minWidth: '380px',
          color: 'var(--text-primary)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}><Icon name="useradd" size={18} /> Создать группу</h3>
          <button onClick={onClose} style={{
            background: 'var(--bg-primary)', border: 'none', color: 'var(--text-secondary)',
            fontSize: '1.2rem', cursor: 'pointer', width: '36px', height: '36px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>
        
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Название группы"
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)', color: 'var(--text-primary)',
            fontSize: '1rem', outline: 'none', marginBottom: '1.5rem'
          }}
        />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '14px', borderRadius: '12px',
            border: 'none', background: 'var(--bg-primary)',
            color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, cursor: 'pointer'
          }}>Отмена</button>
          <button onClick={handleCreate} style={{
            flex: 1, padding: '14px', borderRadius: '12px',
            border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer'
          }}>Создать</button>
        </div>
      </div>
    </div>
  );
};
export default GroupModal;