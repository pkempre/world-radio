
import { Station } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, Heart, Globe, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useFavorites } from '../hooks/useFavorites';

// Flag emoji helper
function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface StationCardProps {
  station: Station;
  index?: number;
}

export function StationCard({ station, index = 0 }: StationCardProps) {
  const { currentStation, isPlaying, playStation, togglePlayPause } = usePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const isCurrent = currentStation?.stationuuid === station.stationuuid;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const favorited = isFavorite(station.stationuuid);

  const tags = station.tags ? station.tags.split(',').slice(0, 3).filter(Boolean) : [];

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlayPause();
    } else {
      playStation(station);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(station);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => !isCurrent && playStation(station)}
      className={cn(
        "group relative flex flex-col rounded-2xl bg-card border transition-all cursor-pointer overflow-hidden",
        isCurrent ? "border-primary shadow-[0_0_20px_rgba(255,87,34,0.15)]" : "border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
      )}
      data-testid={`card-station-${station.stationuuid}`}
    >
      {/* Decorative top gradient */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 flex-1 flex flex-col z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border border-border shadow-inner">
            <Globe className="absolute inset-0 m-auto text-muted-foreground w-8 h-8" />
            {station.favicon ? (
              <img 
                src={station.favicon} 
                alt={station.name}
                className="absolute inset-0 w-full h-full object-cover z-10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            
            {/* Play overlay */}
            <div className={cn(
              "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity",
              isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <button
                onClick={handlePlayClick}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-transform",
                  isCurrent ? "bg-primary text-primary-foreground scale-100" : "bg-white/20 text-white hover:bg-primary hover:text-primary-foreground hover:scale-110"
                )}
                data-testid={`button-play-${station.stationuuid}`}
              >
                {isCurrentlyPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleFavoriteClick}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            data-testid={`button-favorite-${station.stationuuid}`}
          >
            <Heart className={cn("w-5 h-5 transition-colors", favorited && "fill-primary text-primary")} />
          </button>
        </div>

        <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {station.name || 'Unknown Station'}
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5" title={station.country}>
            {station.countrycode && <span className="text-base leading-none">{getFlagEmoji(station.countrycode)}</span>}
            <span className="truncate max-w-[120px]">{station.country || 'Unknown'}</span>
          </span>
          {station.bitrate > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1 text-xs font-mono tracking-wider">
                <Activity className="w-3 h-3" />
                {station.bitrate}
              </span>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span 
              key={`${tag}-${i}`}
              className="px-2.5 py-1 rounded-md bg-secondary/50 text-secondary-foreground text-xs font-medium border border-border/50 capitalize"
            >
              {tag}
            </span>
          ))}
          {tags.length === 0 && (
            <span className="px-2.5 py-1 rounded-md bg-secondary/50 text-secondary-foreground/50 text-xs font-medium border border-border/50">
              No tags
            </span>
          )}
        </div>
      </div>
      
      {/* Live Indicator bar */}
      <div className={cn(
        "h-1 w-full bg-primary transform origin-left transition-transform duration-500",
        isCurrentlyPlaying ? "scale-x-100" : "scale-x-0"
      )} />
    </motion.div>
  );
}
