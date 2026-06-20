import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../Icon';
import apiClient from '../../services/api';
import MediaViewer from '../MediaViewer';

interface MediaItem {
  id: number;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  fileName: string;
  fileSize: number;
  timestamp: string;
  senderName: string;
  senderId: number;
  messageId: number;
  duration?: number;
  width?: number;
  height?: number;
}

interface MediaGalleryProps {
  chatId: number;
  onClose: () => void;
  onMediaClick?: (url: string, type: string, messageId?: number) => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ chatId, onClose, onMediaClick }) => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'files' | 'all'>('all');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const itemsPerPage = 20;

  // Загрузка медиа
  const loadMedia = useCallback(async (reset: boolean = true) => {
    if (reset) {
      setCurrentPage(1);
      setMedia([]);
      setHasMore(true);
    }
    
    if (!hasMore && !reset) return;
    
    setLoadingMore(true);
    try {
      const res = await apiClient.get(`/chats/${chatId}/media`, {
        params: {
          type: activeTab === 'all' ? undefined : activeTab,
          limit: itemsPerPage,
          offset: reset ? 0 : (currentPage - 1) * itemsPerPage,
          sort_by: sortBy,
          sort_order: sortOrder,
          search: searchQuery || undefined
        }
      });
      
      const newMedia = res.data.items || res.data;
      
      if (reset) {
        setMedia(newMedia);
      } else {
        setMedia(prev => [...prev, ...newMedia]);
      }
      
      setHasMore(newMedia.length === itemsPerPage);
    } catch (error) {
      console.error('Ошибка загрузки медиа:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [chatId, activeTab, currentPage, sortBy, sortOrder, searchQuery, hasMore]);

  useEffect(() => {
    setCurrentPage(1);
    loadMedia(true);
  }, [activeTab, sortBy, sortOrder, searchQuery]);

  useEffect(() => {
    if (currentPage > 1) {
      loadMedia(false);
    }
  }, [currentPage]);

  // Фильтрация на клиенте (дополнительно)
  useEffect(() => {
    let filtered = [...media];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.fileName.toLowerCase().includes(query) ||
        item.senderName.toLowerCase().includes(query)
      );
    }
    
    setFilteredMedia(filtered);
  }, [media, searchQuery]);

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Форматирование даты
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days === 0) {
      if (hours === 0) return 'Только что';
      return `${hours} ч. назад`;
    }
    if (days === 1) return 'Вчера';
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString();
  };

  // Форматирование длительности видео/аудио
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Обработка скролла для бесконечной подгрузки
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 200 && !loadingMore && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Подсчёт статистики
  const stats = {
    images: media.filter(m => m.type === 'image').length,
    videos: media.filter(m => m.type === 'video').length,
    files: media.filter(m => m.type === 'file').length,
    totalSize: media.reduce((sum, m) => sum + m.fileSize, 0)
  };

  const tabs = [
    { id: 'all', label: 'Всё', icon: 'folder', count: media.length },
    { id: 'images', label: 'Фото', icon: 'picture', count: stats.images },
    { id: 'videos', label: 'Видео', icon: 'video', count: stats.videos },
    { id: 'files', label: 'Файлы', icon: 'document', count: stats.files }
  ];

  if (loading && media.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="media-gallery-modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', width: '90%', maxWidth: '1000px', maxHeight: '85vh', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Медиа и файлы</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-tertiary)' }}>Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="media-gallery-modal" onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-secondary)',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '85vh',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'scaleIn 0.2s ease'
      }}>
        {/* Заголовок */}
        <div className="modal-header" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Icon name="folder" size={24} color="var(--accent)" />
            <h2 style={{ margin: 0 }}>Медиа и файлы</h2>
            <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: 'var(--bg-primary)', borderRadius: '20px' }}>
              {formatFileSize(stats.totalSize)}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Поиск */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: '20px' }}>
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.85rem', width: '150px' }}
              />
            </div>
            
            {/* Сортировка */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: '6px 10px', borderRadius: '20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <option value="date">По дате</option>
              <option value="size">По размеру</option>
              <option value="name">По имени</option>
            </select>
            
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              style={{ padding: '6px 10px', borderRadius: '20px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
            >
              <Icon name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} />
            </button>
            
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '6px' }}>✕</button>
          </div>
        </div>

        {/* Табы */}
        <div className="media-tabs" style={{ display: 'flex', gap: '4px', padding: '0.8rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '0.7rem'
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Контент */}
        <div className="media-content" onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {filteredMedia.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
              <Icon name="folder" size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Нет медиафайлов в этом чате</p>
            </div>
          ) : activeTab === 'images' ? (
            <div className="images-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="image-item"
                  onClick={() => {
                    if (onMediaClick) onMediaClick(item.url, 'image', item.messageId);
                    else {
                      setSelectedMedia(item);
                      setShowMediaViewer(true);
                    }
                  }}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'var(--bg-primary)'
                  }}
                >
                  <img src={item.url} alt={item.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '8px',
                    fontSize: '0.7rem',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{item.senderName}</span>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'videos' ? (
            <div className="videos-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="video-item"
                  onClick={() => {
                    if (onMediaClick) onMediaClick(item.url, 'video', item.messageId);
                    else {
                      setSelectedMedia(item);
                      setShowMediaViewer(true);
                    }
                  }}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                >
                  <div style={{ position: 'relative', width: '120px', height: '90px', borderRadius: '12px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                    <video src={item.url} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {item.duration && (
                      <span style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.fileName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{item.senderName} • {formatDate(item.timestamp)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{formatFileSize(item.fileSize)}</div>
                  </div>
                  <Icon name="play" size={24} style={{ alignSelf: 'center', opacity: 0.5 }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="files-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredMedia.map(item => (
                <div
                  key={item.id}
                  className="file-item"
                  onClick={() => window.open(item.url, '_blank')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div className="file-icon" style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={item.type === 'image' ? 'picture' : item.type === 'video' ? 'video' : 'document'} size={24} />
                  </div>
                  <div className="file-info" style={{ flex: 1, minWidth: 0 }}>
                    <div className="file-name" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.fileName}</div>
                    <div className="file-meta" style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                      <span>{formatFileSize(item.fileSize)}</span>
                      <span>{item.senderName}</span>
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const a = document.createElement('a');
                      a.href = item.url;
                      a.download = item.fileName;
                      a.click();
                    }}
                    style={{ padding: '8px', borderRadius: '8px', background: 'var(--hover-bg)', border: 'none', cursor: 'pointer' }}
                  >
                    <Icon name="download" size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {loadingMore && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div className="loading-spinner-small" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
            </div>
          )}
        </div>

        {/* Медиа просмотрщик */}
        {showMediaViewer && selectedMedia && (
          <MediaViewer
              src={selectedMedia.url}
              type={selectedMedia.type === 'image' || selectedMedia.type === 'video' ? selectedMedia.type : 'image'}
              onClose={() => setShowMediaViewer(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MediaGallery;