import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Station } from '../types';

interface PlayerContextType {
  currentStation: Station | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  error: string | null;
  playStation: (station: Station) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    
    const audio = audioRef.current;
    
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
    };
    
    const handleWaiting = () => {
      setIsLoading(true);
    };
    
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Stream unavailable');
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);
    audio.addEventListener('pause', handlePause);
    
    return () => {
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playStation = useCallback((station: Station) => {
    if (!audioRef.current) return;
    
    // Fire and forget click register
    fetch(`/api/radio/json/url/${station.stationuuid}`, {
      method: 'POST'
    }).catch(() => {});
    
    setCurrentStation(station);
    setIsLoading(true);
    setError(null);
    
    // Reset and play
    audioRef.current.src = station.url_resolved;
    audioRef.current.load();
    
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.error("Playback prevented:", err);
        setError("Playback failed. Please try again.");
        setIsLoading(false);
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentStation) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Playback prevented:", err);
          setError("Playback failed.");
          setIsLoading(false);
          setIsPlaying(false);
        });
      }
    }
  }, [isPlaying, currentStation]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentStation,
        isPlaying,
        isLoading,
        volume,
        error,
        playStation,
        togglePlayPause,
        setVolume
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
