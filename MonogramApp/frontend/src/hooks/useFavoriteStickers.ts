import { useState, useCallback } from 'react';

export function useFavoriteStickers() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('fav_stickers') || '[]');
  });

  const toggle = useCallback((url: string) => {
    setFavorites(prev => {
      const next = prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url];
      localStorage.setItem('fav_stickers', JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((url: string) => favorites.includes(url), [favorites]);

  return { favorites, toggle, isFavorite };
}
