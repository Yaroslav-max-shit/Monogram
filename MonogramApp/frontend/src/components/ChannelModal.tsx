import React from 'react';

interface ChannelModalProps {
  onClose: () => void;
  onChatSelect: (id: number, name: string) => void;
}

const ChannelModal: React.FC<ChannelModalProps> = ({ onClose, onChatSelect }) => {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    const { default: apiClient } = await import('../services/api');
    try {
      const res = await apiClient.post('/chats/create', { name, description, type: 'channel' });
      onChatSelect(res.data.id, res.data.name);
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Ошибка создания канала');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать канал</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input placeholder="Название канала" value={name} onChange={e => setName(e.target.value)} />
          <textarea placeholder="Описание (необязательно)" value={description} onChange={e => setDescription(e.target.value)} />
          <button className="btn btn-primary" onClick={handleCreate}>Создать канал</button>
        </div>
      </div>
    </div>
  );
};

export default ChannelModal;
