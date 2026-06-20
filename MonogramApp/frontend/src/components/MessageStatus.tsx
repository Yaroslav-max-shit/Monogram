import React from 'react';

interface MessageStatusProps {
  status: 'sending' | 'sent' | 'delivered' | 'read';
  className?: string;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ status, className = '' }) => {
  if (status === 'sending') {
    return (
      <svg viewBox="0 0 16 16" width={14} height={14} className={`message-status-icon ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.6}>
        <circle cx="8" cy="8" r="6" strokeDasharray="28" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  if (status === 'sent') {
    return (
      <svg viewBox="0 0 16 11" width={14} height={10} className={`message-status-icon ${className}`} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.4}>
        <path d="M1 5.5L4 8.5L11 1" />
      </svg>
    );
  }

  if (status === 'delivered') {
    return (
      <svg viewBox="0 0 16 11" width={14} height={10} className={`message-status-icon ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7}>
        <path d="M1 5.5L4 8.5L11 1" />
      </svg>
    );
  }

  if (status === 'read') {
    return (
      <svg viewBox="0 0 22 11" width={18} height={10} className={`message-status-icon ${className}`} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 5.5L4 8.5L11 1" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <path d="M9 5.5L12 8.5L19 1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return null;
};

export default MessageStatus;
