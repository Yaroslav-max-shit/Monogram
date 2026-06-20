import React, { useState } from 'react';

interface StickerPackCreatorProps {
  onClose: () => void;
}

const StickerPackCreator: React.FC<StickerPackCreatorProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [stickers, setStickers] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const { default: api } = await import('../../services/api');
    try {
      await api.post('/stickers/create-pack', { name });
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Ошибка создания пака');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Создать стикерпак</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input placeholder="Название пака" value={name} onChange={e => setName(e.target.value)} />
          <button className="btn btn-primary" onClick={handleCreate}>Создать</button>
        </div>
      </div>
    </div>
  );
};

export default StickerPackCreator;
