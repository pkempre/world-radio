import { useState, useEffect } from 'react';
import { Station } from '../types';

const FAVORITES_KEY = 'wr_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Station[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Could not parse favorites", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (station: Station) => {
    setFavorites(prev => {
      const exists = prev.some(s => s.stationuuid === station.stationuuid);
      if (exists) {
        return prev.filter(s => s.stationuuid !== station.stationuuid);
      } else {
        return [...prev, station];
      }
    });
  };

  const isFavorite = (stationuuid: string) => {
    return favorites.some(s => s.stationuuid === stationuuid);
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite
  };
}
