import React from 'react';

interface NotFoundProps {
  title?: string;
  message?: string;
  description?: string;
  onClose?: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ 
  title = '404', 
  message = 'Страница не найдена', 
  description = 'Запрашиваемая страница не существует или была перемещена.',
  onClose 
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ maxWidth: 400 }}>
        <div style={{
          fontSize: '6rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: 16
        }}>
          {title}
        </div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>{message}</h1>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: 24 }}>{description}</p>
        <button 
          onClick={onClose || (() => window.location.href = '/')}
          style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          На главную
        </button>
      </div>
    </div>
  );
};

export default NotFound;
