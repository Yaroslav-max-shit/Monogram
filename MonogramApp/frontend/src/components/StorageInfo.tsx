import React, { useState, useEffect } from 'react';

function formatSize(bytes: number): string {
  if (bytes > 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  if (bytes > 1000) return `${(bytes / 1000).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function StorageInfo() {
  const [storage, setStorage] = useState({ cache: 0, photos: 0, videos: 0, audio: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(names => {
        let totalCache = 0;
        Promise.all(names.map(name =>
          caches.open(name).then(cache =>
            cache.keys().then(requests =>
              Promise.all(requests.map(req =>
                cache.match(req).then(res => {
                  if (res) totalCache += Number(res.headers.get('content-length') || 0);
                })
              ))
            )
          )
        )).then(() => {
          setStorage(prev => ({ ...prev, cache: totalCache, total: totalCache }));
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
  }, []);

  const clearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    setStorage({ cache: 0, photos: 0, videos: 0, audio: 0, total: 0 });
  };

  return (
    <div className="storage-info">
      <h3>Использование памяти</h3>
      <div className="storage-bar">
        <div className="storage-bar-fill" style={{ width: `${Math.min(storage.total / 10000000 * 100, 100)}%` }} />
      </div>
      {loading ? (
        <div className="storage-loading">Подсчёт...</div>
      ) : (
        <>
          <div className="storage-item"><span>Кэш</span><span>{formatSize(storage.cache)}</span></div>
          <button className="clear-cache-btn" onClick={clearCache}>Очистить кэш</button>
        </>
      )}
    </div>
  );
}
