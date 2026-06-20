import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface PinnedBarProps {
  chatId: number;
  onNavigate: (messageId: number) => void;
}

interface PinnedMessage {
  id: number;
  content: string;
  sender_id: number;
  timestamp: string;
}

const PinnedBar: React.FC<PinnedBarProps> = ({ chatId, onNavigate }) => {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);

  useEffect(() => {
    const loadPinned = async () => {
      try {
        const res = await apiClient.get(`/messages/${chatId}/pinned`);
        setPinnedMessages(res.data || []);
      } catch {
        setPinnedMessages([]);
      }
    };
    loadPinned();
  }, [chatId]);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="pinned-bar">
      <div className="pinned-bar-icon">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </div>
      <div className="pinned-bar-scroll">
        {pinnedMessages.map((msg) => (
          <button
            key={msg.id}
            className="pinned-bar-item"
            onClick={() => onNavigate(msg.id)}
            title={msg.content?.substring(0, 100)}
          >
            <span className="pinned-bar-text">{msg.content?.substring(0, 40) || 'Pinned message'}</span>
          </button>
        ))}
      </div>
      <div className="pinned-bar-count">{pinnedMessages.length}</div>
    </div>
  );
};

export default PinnedBar;
