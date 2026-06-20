import React, { useState } from 'react';
import Icon from '../Icon';

interface SlowModeProps {
  chatId: number;
  isAdmin: boolean;
  currentDelay?: number;
  onSave?: (delay: number, enabled: boolean) => void;
}

const SlowMode: React.FC<SlowModeProps> = ({ chatId, isAdmin, currentDelay = 0, onSave }) => {
  const [enabled, setEnabled] = useState(currentDelay > 0);
  const [delay, setDelay] = useState(currentDelay || 30);

  if (!isAdmin) return null;

  const handleSave = () => {
    onSave?.(enabled ? delay : 0, enabled);
  };

  const delayOptions = [5, 10, 15, 30, 60, 120, 300];

  return (
    <div className="slow-mode-settings">
      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-label">
            <Icon name="clock" size={18} /> Медленный режим (Slow Mode)
          </div>
          <div className="setting-desc">
            Ограничивает частоту отправки сообщений в группе
          </div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>

      {enabled && (
        <>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Задержка между сообщениями</div>
              <div className="setting-desc">Сколько секунд нужно ждать между сообщениями</div>
            </div>
            <select value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
              {delayOptions.map(opt => (
                <option key={opt} value={opt}>{opt} секунд</option>
              ))}
            </select>
          </div>
          <button className="btn-small primary" onClick={handleSave}>Сохранить</button>
        </>
      )}
    </div>
  );
};

export default SlowMode;