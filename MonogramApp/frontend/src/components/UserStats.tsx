import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface UserStatsData {
  messages_sent: number;
  chats_count: number;
  media_sent: number;
  days_on_platform: number;
  show_in_profile: boolean;
}

interface UserStatsProps {
  userId: number;
}

const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/users/stats').then(res => {
      setStats(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  if (loading || !stats || !stats.show_in_profile) return null;

  const items = [
    { label: 'Messages', value: stats.messages_sent.toLocaleString(), icon: 'MSG' },
    { label: 'Chats', value: stats.chats_count.toString(), icon: 'CHT' },
    { label: 'Media', value: stats.media_sent.toString(), icon: 'MED' },
    { label: 'Days', value: stats.days_on_platform.toString(), icon: 'DAY' },
  ];

  return (
    <div className="user-stats-card">
      <h4 className="stats-title">Account Stats</h4>
      <div className="stats-grid">
        {items.map(item => (
          <div key={item.label} className="stat-item">
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserStats;