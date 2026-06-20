import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface ChannelStatsProps {
  chatId: number;
}

const PERIODS = ['hour', 'day', 'week', 'month', '6months', 'year', '2years', '5years'] as const;

const ChannelStats: React.FC<ChannelStatsProps> = ({ chatId }) => {
  const [period, setPeriod] = useState<string>('day');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/chats/${chatId}/stats/referral?period=${period}`);
      setStats(res.data);
    } catch { setStats(null); }
    setLoading(false);
  };

  return (
    <div className="channel-stats">
      <div className="stats-period-tabs">
        {PERIODS.map(p => (
          <button key={p} className={`period-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p === 'hour' ? '1ч' : p === 'day' ? '24ч' : p === 'week' ? '7д' : p === 'month' ? '30д' : p === '6months' ? '6м' : p === 'year' ? '1г' : p === '2years' ? '2г' : '5л'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="stats-loading">Загрузка...</div>
      ) : stats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.subs_total}</div>
            <div className="stat-label">Всего</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#22c55e' }}>+{stats.subs_gained}</div>
            <div className="stat-label">Прибыло</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ef4444' }}>+{stats.subs_lost}</div>
            <div className="stat-label">Убыло</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">ℹ️</div>
            <div className="stat-label">{stats.subs_by_search} поиск</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">🔗</div>
            <div className="stat-label">{stats.subs_by_link} ссылка</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">👥</div>
            <div className="stat-label">{stats.subs_by_referral} реф</div>
          </div>
        </div>
      ) : (
        <div className="stats-empty">Нет данных</div>
      )}
    </div>
  );
};

export default ChannelStats;
