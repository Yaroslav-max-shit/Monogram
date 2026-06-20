import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { useFavoriteStickers } from '../hooks/useFavoriteStickers';

interface StickerPack {
  id: number;
  name: string;
  code: string;
  thumbnail?: string;
  sticker_count?: number;
}

interface Sticker {
  id: number;
  url: string;
  type: string;
  emoji?: string;
}

interface StickerPickerProps {
  onSelect: (stickerUrl: string) => void;
  onClose: () => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, onClose }) => {
  const [packs, setPacks] = useState<StickerPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<StickerPack | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);
  const { favorites, toggle: toggleFav, isFavorite } = useFavoriteStickers();

  useEffect(() => {
    loadPacks();
  }, []);

  useEffect(() => {
    if (selectedPack && !showFavorites) {
      loadStickers(selectedPack.code);
    }
  }, [selectedPack, showFavorites]);

  const loadPacks = async () => {
    try {
      const res = await apiClient.get('/stickers/packs');
      setPacks(res.data || []);
      if (res.data?.length > 0) setSelectedPack(res.data[0]);
    } catch (err) { console.error('Failed to load packs:', err); }
    setLoading(false);
  };

  const loadStickers = async (code: string) => {
    try {
      const res = await apiClient.get(`/stickers/pack/${code}`);
      setStickers(res.data?.stickers || []);
    } catch (err) { console.error('Failed to load stickers:', err); }
  };

  const searchPacks = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { loadPacks(); return; }
    try {
      const res = await apiClient.get(`/stickers/search?q=${q}`);
      setPacks(res.data || []);
    } catch (err) { console.error('Search failed:', err); }
  };

  return (
    <div className="sticker-picker-overlay" onClick={onClose}>
      <div className="sticker-picker" onClick={e => e.stopPropagation()}>
        <div className="sticker-picker-header">
          <input
            className="sticker-search"
            placeholder="Search sticker packs..."
            value={search}
            onChange={e => searchPacks(e.target.value)}
            autoFocus
          />
          <button className="sticker-close" onClick={onClose}>&times;</button>
        </div>
        <div className="sticker-packs-bar">
          <div
            className={`sticker-pack-tab ${showFavorites ? 'active' : ''}`}
            onClick={() => { setShowFavorites(true); setSelectedPack(null); }}
          >
            <div className="pack-thumb-placeholder">⭐</div>
            <span className="pack-name">Избранное</span>
          </div>
          {packs.map(p => (
            <div
              key={p.id}
              className={`sticker-pack-tab ${selectedPack?.id === p.id && !showFavorites ? 'active' : ''}`}
              onClick={() => { setSelectedPack(p); setShowFavorites(false); }}
            >
              {p.thumbnail ? (
                <img src={p.thumbnail} alt={p.name} className="pack-thumb" />
              ) : (
                <div className="pack-thumb-placeholder">{p.name.charAt(0)}</div>
              )}
              <span className="pack-name">{p.name}</span>
            </div>
          ))}
        </div>
        <div className="sticker-grid">
          {showFavorites ? (
            favorites.length === 0 ? (
              <div className="sticker-empty">Нет избранных стикеров</div>
            ) : (
              favorites.map((url, i) => (
                <div key={i} className="sticker-item" onClick={() => onSelect(url)}>
                  <img src={url} alt="fav sticker" className="sticker-img" />
                </div>
              ))
            )
          ) : (
            stickers.map(s => (
              <div
                key={s.id}
                className="sticker-item"
                onClick={() => onSelect(s.url)}
                title={s.emoji || ''}
                onContextMenu={(e) => { e.preventDefault(); toggleFav(s.url); }}
              >
                <img src={s.url} alt="sticker" className="sticker-img" />
                {isFavorite(s.url) && <span className="sticker-fav-badge">⭐</span>}
              </div>
            ))
          )}
          {!showFavorites && stickers.length === 0 && !loading && (
            <div className="sticker-empty">No stickers in this pack</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickerPicker;