import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import Icon from '../Icon';
import './SearchModal.css';

interface SearchModalProps {
  onClose: () => void;
  onChatSelect: (chatId: number, chatName: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose, onChatSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ chats: [], messages: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'chats' | 'messages' | 'users'>('all');
  const [filterChatId, setFilterChatId] = useState<number | null>(null);
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    const res = await apiClient.get('/chats/');
    setChats(res.data);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults({ chats: [], messages: [], users: [] });
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [query, filterChatId]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/search/global?q=${encodeURIComponent(query)}&limit=50`);
      setResults(res.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVisibleResults = () => {
    switch (activeTab) {
      case 'chats': return results.chats;
      case 'messages': return results.messages;
      case 'users': return results.users;
      default: return [...results.chats, ...results.messages, ...results.users];
    }
  };

  const handleMessageClick = (message: any) => {
    onChatSelect(message.chat_id, `Чат ${message.chat_id}`);
    onClose();
  };

  const handleUserClick = (user: any) => {
    // Создаём или открываем чат с пользователем
    const chatId = generateChatId(user.id);
    onChatSelect(chatId, user.username);
    onClose();
  };

  const generateChatId = (userId: number) => {
    return userId + 100000;
  };

  const highlightText = (text: string) => {
    if (!query) return text;
    const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const safe = escapeHtml(text);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return safe.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Поиск</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="search-input-wrapper">
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="Поиск по чатам, сообщениям, пользователям..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        
        {filterChatId && (
          <div className="search-filter">
            <span>Фильтр: чат {chats.find(c => c.id === filterChatId)?.name}</span>
            <button onClick={() => setFilterChatId(null)}>✕</button>
          </div>
        )}
        
        <div className="search-tabs">
          <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            Все ({results.chats.length + results.messages.length + results.users.length})
          </button>
          <button className={`tab ${activeTab === 'chats' ? 'active' : ''}`} onClick={() => setActiveTab('chats')}>
            Чаты ({results.chats.length})
          </button>
          <button className={`tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            Сообщения ({results.messages.length})
          </button>
          <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            Пользователи ({results.users.length})
          </button>
        </div>
        
        <div className="search-results">
          {loading ? (
            <div className="search-loading">
              <div className="loading-spinner" />
              <p>Поиск...</p>
            </div>
          ) : getVisibleResults().length === 0 ? (
            <div className="search-empty">
              <Icon name="search" size={48} />
              <p>Ничего не найдено</p>
            </div>
          ) : (
            <>
              {activeTab === 'all' && (
                <>
                  {results.chats.length > 0 && (
                    <div className="results-section">
                      <div className="section-title">Чаты</div>
                      {results.chats.map((chat: any) => (
                        <div key={chat.id} className="result-item chat" onClick={() => onChatSelect(chat.id, chat.name)}>
                          <div className="result-icon"><Icon name="send" size={20} /></div>
                          <div className="result-info">
                            <div className="result-title">{chat.name}</div>
                            <div className="result-subtitle">{chat.type_label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {results.messages.length > 0 && (
                    <div className="results-section">
                      <div className="section-title">Сообщения</div>
                      {results.messages.map((msg: any) => (
                        <div key={msg.id} className="result-item message" onClick={() => handleMessageClick(msg)}>
                          <div className="result-icon"><Icon name="note" size={20} /></div>
                          <div className="result-info">
                            <div className="result-title" dangerouslySetInnerHTML={{ __html: highlightText(msg.content.substring(0, 100)) }} />
                            <div className="result-subtitle">Чат {msg.chat_id} • {new Date(msg.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {results.users.length > 0 && (
                    <div className="results-section">
                      <div className="section-title">Пользователи</div>
                      {results.users.map((user: any) => (
                        <div key={user.id} className="result-item user" onClick={() => handleUserClick(user)}>
                          <div className="result-avatar">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" />
                            ) : (
                              <span>{user.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="result-info">
                            <div className="result-title">{user.first_name} {user.last_name}</div>
                            <div className="result-subtitle">@{user.username}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'chats' && results.chats.map((chat: any) => (
                <div key={chat.id} className="result-item chat" onClick={() => onChatSelect(chat.id, chat.name)}>
                  <div className="result-icon"><Icon name="send" size={20} /></div>
                  <div className="result-info">
                    <div className="result-title">{chat.name}</div>
                    <div className="result-subtitle">{chat.type_label}</div>
                  </div>
                </div>
              ))}
              
              {activeTab === 'messages' && results.messages.map((msg: any) => (
                <div key={msg.id} className="result-item message" onClick={() => handleMessageClick(msg)}>
                  <div className="result-icon"><Icon name="note" size={20} /></div>
                  <div className="result-info">
                    <div className="result-title" dangerouslySetInnerHTML={{ __html: highlightText(msg.content.substring(0, 100)) }} />
                    <div className="result-subtitle">Чат {msg.chat_id} • {new Date(msg.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
              
              {activeTab === 'users' && results.users.map((user: any) => (
                <div key={user.id} className="result-item user" onClick={() => handleUserClick(user)}>
                  <div className="result-avatar">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" />
                    ) : (
                      <span>{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="result-info">
                    <div className="result-title">{user.first_name} {user.last_name}</div>
                    <div className="result-subtitle">@{user.username}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;