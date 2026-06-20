import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';

const SharePage: React.FC = () => {
  const [sharedText, setSharedText] = useState('');
  const [sharedTitle, setSharedTitle] = useState('');
  const [sharedUrl, setSharedUrl] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'sent' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = params.get('text') || '';
    const title = params.get('title') || '';
    const url = params.get('url') || '';
    setSharedText(text);
    setSharedTitle(title);
    setSharedUrl(url);
    setStatus('ready');
  }, []);

  const handleSend = async () => {
    setStatus('loading');
    const content = [sharedTitle, sharedText, sharedUrl].filter(Boolean).join('\n');
    try {
      await apiClient.post('/messages/', { content, chat_id: 0 });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="share-page">
      <h2>Поделиться в Monogram</h2>
      {status === 'ready' && (
        <div className="share-content">
          <div className="share-preview">
            {sharedTitle && <div className="share-title">{sharedTitle}</div>}
            {sharedText && <div className="share-text">{sharedText}</div>}
            {sharedUrl && <div className="share-url">{sharedUrl}</div>}
          </div>
          <button className="share-send-btn" onClick={handleSend}>Отправить</button>
        </div>
      )}
      {status === 'sent' && <div className="share-success">Отправлено!</div>}
      {status === 'error' && <div className="share-error">Ошибка отправки</div>}
    </div>
  );
};

export default SharePage;
