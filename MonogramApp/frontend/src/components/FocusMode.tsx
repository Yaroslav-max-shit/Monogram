import React, { useState } from 'react';

export function isFocusModeActive(): boolean {
  const until = localStorage.getItem('focus_mode_until');
  if (!until) return false;
  if (Date.now() > parseInt(until)) {
    localStorage.removeItem('focus_mode_until');
    return false;
  }
  return true;
}

export function FocusMode({ onClose }: { onClose: () => void }) {
  const [hours, setHours] = useState(2);

  const activate = () => {
    const until = Date.now() + hours * 3600000;
    localStorage.setItem('focus_mode_until', String(until));
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="focus-modal">
        <h2>Режим фокуса</h2>
        <p>Все уведомления будут отключены на выбранное время</p>
        <input type="range" min={0.5} max={8} step={0.5} value={hours}
          onChange={e => setHours(parseFloat(e.target.value))} />
        <span>{hours} ч</span>
        <button onClick={activate}>Включить</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
}
