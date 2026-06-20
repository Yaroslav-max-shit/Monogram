import React, { useState } from 'react';
import Icon from './Icon';
import apiClient from '../services/api';

const BotCreator: React.FC<{ onClose: () => void; onCreated: (bot: any) => void }> = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdBot, setCreatedBot] = useState<any>(null);

  const handleCreate = async () => {
    if (!username.endsWith('Bot') && !username.endsWith('_bot')) {
      setError('Р®Р·РµСЂРЅРµР№Рј РґРѕР»Р¶РµРЅ Р·Р°РєР°РЅС‡РёРІР°С‚СЊСЃСЏ РЅР° Bot РёР»Рё _bot');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/bots/create', null, {
        params: { name, username, description }
      });
      setCreatedBot(res.data);
      setApiKey(res.data.api_key);
      setStep(4);
      onCreated(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ Р±РѕС‚Р°');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>РЎРѕР·РґР°РЅРёРµ Р±РѕС‚Р°</h2>
          <button className="modal-close-btn" onClick={onClose}>вњ•</button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div>
              <div className="input-group">
                <label>РРјСЏ Р±РѕС‚Р°</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="РњРѕР№ Р±РѕС‚" />
              </div>
              <button className="modal-btn-primary" onClick={() => setStep(2)} disabled={!name}>
                Р”Р°Р»РµРµ
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="input-group">
                <label>Р®Р·РµСЂРЅРµР№Рј Р±РѕС‚Р°</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="my_bot" />
                <span className="input-hint">Р”РѕР»Р¶РµРЅ Р·Р°РєР°РЅС‡РёРІР°С‚СЊСЃСЏ РЅР° Bot РёР»Рё _bot</span>
              </div>
              <div className="input-group">
                <label>РћРїРёСЃР°РЅРёРµ</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Р§С‚Рѕ РґРµР»Р°РµС‚ Р±РѕС‚" />
              </div>
              {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
              <button className="modal-btn-primary" onClick={() => setStep(3)} disabled={!username}>
                Р”Р°Р»РµРµ
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <h3>Р’СЃС‘ РіРѕС‚РѕРІРѕ!</h3>
              <p>РќР°Р¶РјРёС‚Рµ СЃРѕР·РґР°С‚СЊ С‡С‚РѕР±С‹ РїРѕР»СѓС‡РёС‚СЊ API РєР»СЋС‡</p>
              <button className="modal-btn-primary" onClick={handleCreate} disabled={loading}>
                {loading ? 'РЎРѕР·РґР°РЅРёРµ...' : 'РЎРѕР·РґР°С‚СЊ Р±РѕС‚Р°'}
              </button>
            </div>
          )}

          {step === 4 && createdBot && (
            <div style={{ textAlign: 'center' }}>
              <h3>Р‘РѕС‚ СЃРѕР·РґР°РЅ!</h3>
              <p><strong>{createdBot.name}</strong> @{createdBot.username}</p>
              <div className="input-group">
                <label>API РљР»СЋС‡ (СЃРѕС…СЂР°РЅРёС‚Рµ РµРіРѕ!)</label>
                <input value={apiKey} readOnly onClick={e => e.currentTarget.select()} />
              </div>
              <button className="modal-btn-primary" onClick={onClose}>Р“РѕС‚РѕРІРѕ</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotCreator;
