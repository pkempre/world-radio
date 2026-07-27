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

// ── Media Session helpers ──────────────────────────────────────────────────────

function buildArtwork(favicon: string | undefined): MediaImage[] {
  if (!favicon || !favicon.startsWith('http')) return defaultArtwork();
  return [
    { src: favicon, sizes: '96x96', type: 'image/png' },
    { src: favicon, sizes: '128x128', type: 'image/png' },
  ];
}

function defaultArtwork(): MediaImage[] {
  const base = window.location.origin;
  return [
    { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png' },
  ];
}

function setMediaSessionMetadata(station: Station) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: station.name,
    artist: [station.country, station.language].filter(Boolean).join(' · ') || 'World Radio',
    album: 'World Radio — Live',
    artwork: buildArtwork(station.favicon),
  });
}

function setMediaSessionState(state: 'playing' | 'paused' | 'none') {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = state;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Keep a stable ref to the current station so Media Session handlers can close over it
  const stationRef = useRef<Station | null>(null);

  // ── Audio element setup ──────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    // Required on iOS for background audio — the element must not be muted
    audio.muted = false;
    audioRef.current = audio;

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setError(null);
      setMediaSessionState('playing');
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Stream unavailable');
      setMediaSessionState('none');
    };

    const handlePause = () => {
      setIsPlaying(false);
      setMediaSessionState('paused');
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Volume sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // ── Media Session action handlers ────────────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => {
      if (!audioRef.current) return;
      setIsLoading(true);
      audioRef.current.play().catch(() => {
        setError('Playback failed.');
        setIsLoading(false);
        setIsPlaying(false);
        setMediaSessionState('paused');
      });
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.src = '';
      setCurrentStation(null);
      stationRef.current = null;
      setIsPlaying(false);
      setIsLoading(false);
      setMediaSessionState('none');
    });

    // These are required for some lock-screen UIs — no-ops for live radio
    navigator.mediaSession.setActionHandler('nexttrack', null);
    navigator.mediaSession.setActionHandler('previoustrack', null);

    return () => {
      if (!('mediaSession' in navigator)) return;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('stop', null);
    };
  }, []);

  // ── playStation ──────────────────────────────────────────────────────────────
  const playStation = useCallback((station: Station) => {
    if (!audioRef.current) return;

    fetch(`/api/radio/json/url/${station.stationuuid}`, { method: 'POST' }).catch(() => {});

    stationRef.current = station;
    setCurrentStation(station);
    setIsLoading(true);
    setError(null);

    // Update OS media controls immediately — before audio starts
    setMediaSessionMetadata(station);

    audioRef.current.src = station.url_resolved;
    audioRef.current.load();

    audioRef.current.play().catch((err) => {
      console.error('Playback prevented:', err);
      setError('Playback failed. Please try again.');
      setIsLoading(false);
      setIsPlaying(false);
      setMediaSessionState('none');
    });
  }, []);

  // ── togglePlayPause ──────────────────────────────────────────────────────────
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentStation) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      audioRef.current.play().catch((err) => {
        console.error('Playback prevented:', err);
        setError('Playback failed.');
        setIsLoading(false);
        setIsPlaying(false);
        setMediaSessionState('none');
      });
    }
  }, [isPlaying, currentStation]);

  const setVolume = useCallback((newVolume: number) => setVolumeState(newVolume), []);

  return (
    <PlayerContext.Provider
      value={{ currentStation, isPlaying, isLoading, volume, error, playStation, togglePlayPause, setVolume }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) throw new Error('usePlayer must be used within a PlayerProvider');
  return context;
}
