
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Volume2, VolumeX, AlertCircle, Loader2, Globe } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

export function PlayerBar() {
  const { currentStation, isPlaying, isLoading, volume, error, togglePlayPause, setVolume } = usePlayer();

  if (!currentStation) return null;

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.8 : 0);
  };

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 h-24 bg-card border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-opacity-95"
      data-testid="player-bar"
    >
      <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
        
        {/* Station Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border border-border">
            <Globe className="absolute inset-0 m-auto text-muted-foreground w-8 h-8" />
            {currentStation.favicon ? (
              <img 
                src={currentStation.favicon} 
                alt={currentStation.name}
                className="absolute inset-0 w-full h-full object-cover z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
          </div>
          
          <div className="flex flex-col min-w-0">
            <h3 className="font-semibold text-foreground truncate max-w-[200px] md:max-w-[300px]">
              {currentStation.name || 'Unknown Station'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
              {currentStation.country && <span>{currentStation.country}</span>}
              {currentStation.bitrate > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                  <span>{currentStation.bitrate} kbps</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center justify-center w-1/3">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={togglePlayPause}
              disabled={isLoading && !isPlaying}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,87,34,0.3)] hover:shadow-[0_0_30px_rgba(255,87,34,0.5)]"
              data-testid="button-play-pause"
            >
              {isLoading && !isPlaying ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>
          </div>
          
          <div className="h-4 mt-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1 text-xs text-destructive font-medium"
                >
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </motion.div>
              ) : isPlaying ? (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-widest"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Live
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          <button 
            onClick={toggleMute} 
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-mute"
          >
            {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="w-24 md:w-32 hidden sm:block">
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
              data-testid="slider-volume"
            />
          </div>
        </div>

      </div>
    </motion.div>
  );
}
