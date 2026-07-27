import { createContext, useContext, useState, useCallback } from 'react';
import { YouTubeVideo, YouTubePlaylist, YouTubeArtist } from '../types';

type PlayerItem =
  | { kind: 'video'; item: YouTubeVideo }
  | { kind: 'playlist'; item: YouTubePlaylist }
  | { kind: 'artist'; item: YouTubeArtist };

interface YouTubePlayerContextType {
  current: PlayerItem | null;
  play: (item: PlayerItem) => void;
  close: () => void;
}

const YouTubePlayerContext = createContext<YouTubePlayerContextType | undefined>(undefined);

export function YouTubePlayerProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<PlayerItem | null>(null);

  const play = useCallback((item: PlayerItem) => setCurrent(item), []);
  const close = useCallback(() => setCurrent(null), []);

  return (
    <YouTubePlayerContext.Provider value={{ current, play, close }}>
      {children}
    </YouTubePlayerContext.Provider>
  );
}

export function useYouTubePlayer() {
  const ctx = useContext(YouTubePlayerContext);
  if (!ctx) throw new Error('useYouTubePlayer must be used within YouTubePlayerProvider');
  return ctx;
}
