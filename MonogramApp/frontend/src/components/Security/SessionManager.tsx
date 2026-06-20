import React, { useEffect, useState } from 'react';
import Icon from '../Icon';

interface SessionManagerProps {
  onOpenScanner: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ onOpenScanner }) => {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { default: api } = await import('../../services/api');
      try {
        const res = await api.get('/auth/sessions');
        setSessions(res.data || []);
      } catch {}
    };
    load();
  }, []);

  const handleTerminate = async (deviceId: string) => {
    const { default: api } = await import('../../services/api');
    try {
      await api.delete('/auth/sessions/');
      setSessions(prev => prev.filter(s => s.device_id !== deviceId));
    } catch {}
  };

  return (
    <div className="session-manager">
      <h3>Активные сессии</h3>
      {sessions.map((s: any, i: number) => (
        <div key={i} className="session-item">
          <span>{s.device || s.device_name || 'Неизвестное устройство'}</span>
          <span>{s.is_current ? '(текущая)' : ''}</span>
          {!s.is_current && <button onClick={() => handleTerminate(s.device_id)}>Завершить</button>}
        </div>
      ))}
      <button className="settings-link-btn" onClick={onOpenScanner}>
        <Icon name="camera" size={16} /> Сканировать QR
      </button>
    </div>
  );
};

export default SessionManager;
