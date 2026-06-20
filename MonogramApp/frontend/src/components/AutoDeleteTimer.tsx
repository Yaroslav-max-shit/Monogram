import React, { useState } from 'react';

interface AutoDeleteTimerProps {
  chatId: number;
  currentTimer?: number;
  onSet: (seconds: number) => void;
}

const TIMER_OPTIONS: { label: string; seconds: number }[] = [
  { label: 'Off', seconds: 0 },
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
  { label: '6 hours', seconds: 21600 },
  { label: '12 hours', seconds: 43200 },
  { label: '24 hours', seconds: 86400 },
];

const AutoDeleteTimer: React.FC<AutoDeleteTimerProps> = ({ currentTimer = 0, onSet }) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = TIMER_OPTIONS.find(t => t.seconds === currentTimer)?.label || 'Off';

  return (
    <div className="auto-delete-timer">
      <button className="auto-delete-trigger" onClick={() => setIsOpen(!isOpen)} title="Auto-delete timer">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span>{currentLabel}</span>
      </button>
      {isOpen && (
        <div className="auto-delete-menu">
          <div className="auto-delete-menu-header">Auto-delete messages</div>
          {TIMER_OPTIONS.map(opt => (
            <button
              key={opt.seconds}
              className={`auto-delete-option ${opt.seconds === currentTimer ? 'active' : ''}`}
              onClick={() => { onSet(opt.seconds); setIsOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutoDeleteTimer;
