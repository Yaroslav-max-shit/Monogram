import React, { useState } from 'react';
import apiClient from '../services/api';

interface SchedulePickerProps {
  chatId: number;
  onSchedule: (scheduledFor: string) => void;
  onClose: () => void;
}

const SchedulePicker: React.FC<SchedulePickerProps> = ({ chatId, onSchedule, onClose }) => {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    return d.toISOString().slice(0, 16);
  });
  const [sending, setSending] = useState(false);

  const handleSchedule = async () => {
    setSending(true);
    onSchedule(date);
    setSending(false);
  };

  const getCountdown = () => {
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return 'Now';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content schedule-picker" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Schedule Message</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="schedule-form">
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="schedule-input"
            min={new Date().toISOString().slice(0, 16)}
          />
          <div className="schedule-countdown">Sends in: {getCountdown()}</div>
          <button
            className="btn-primary"
            onClick={handleSchedule}
            disabled={sending || new Date(date).getTime() <= Date.now()}
          >
            {sending ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePicker;