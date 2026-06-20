import React, { useEffect, useRef } from 'react';

interface MentionDropdownProps {
  members: Array<{ id: number; username: string; first_name: string; last_name: string }>;
  filter: string;
  onSelect: (username: string) => void;
  position: { top: number; left: number };
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({ members, filter, onSelect, position }) => {
  const ref = useRef<HTMLDivElement>(null);

  const filtered = members.filter(m =>
    m.username.toLowerCase().includes(filter.toLowerCase()) ||
    (m.first_name || '').toLowerCase().includes(filter.toLowerCase()) ||
    (m.last_name || '').toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onSelect('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onSelect]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 1000,
        background: 'var(--bg-secondary, #1e1e2e)',
        border: '1px solid var(--border-color, #333)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        maxHeight: '200px',
        overflowY: 'auto',
        minWidth: '180px',
      }}
    >
      {filtered.map(m => (
        <div
          key={m.id}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-primary, #fff)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover, #2a2a3e)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          onClick={() => onSelect(m.username)}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--accent-color, #6c5ce7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600, color: '#fff',
          }}>
            {(m.first_name || m.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500 }}>@{m.username}</div>
            <div style={{ fontSize: '12px', opacity: 0.6 }}>
              {m.first_name} {m.last_name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MentionDropdown;
