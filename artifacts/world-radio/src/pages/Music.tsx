import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music2, Play, ChevronDown } from 'lucide-react';
import { YouTubeVideo, COUNTRIES } from '../types';
import { useYouTubePlayer } from '../context/YouTubePlayerContext';

function SkeletonMusicCard() {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-secondary/50" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-secondary/50 rounded-full w-3/4" />
        <div className="h-3 bg-secondary/30 rounded-full w-1/2" />
      </div>
    </div>
  );
}

function MusicCard({
  video,
  index,
  isPlaying,
  onPlay,
}: {
  video: YouTubeVideo;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      onClick={onPlay}
      className={`group bg-card border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
        isPlaying
          ? 'border-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30'
          : 'border-card-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5'
      }`}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
              isPlaying
                ? 'bg-primary opacity-100 scale-100'
                : 'bg-primary/90 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'
            }`}
          >
            {isPlaying ? (
              /* Equalizer bars animation */
              <div className="flex items-end gap-0.5 h-5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-1 bg-primary-foreground rounded-full animate-bounce"
                    style={{ height: `${50 + i * 20}%`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : (
              <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
            )}
          </div>
        </div>
        {isPlaying && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1.5">
            <Music2 className="w-3 h-3" />
            Playing
          </div>
        )}
      </div>
      <div className="p-4">
        <h3
          className={`font-semibold text-sm line-clamp-2 transition-colors leading-snug ${
            isPlaying ? 'text-primary' : 'text-foreground group-hover:text-primary'
          }`}
        >
          {video.title}
        </h3>
        <p className="text-muted-foreground text-xs mt-1.5 truncate">{video.channelTitle}</p>
      </div>
    </motion.div>
  );
}

export default function Music() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const { current, play } = useYouTubePlayer();

  const currentVideoId =
    current?.kind === 'video' ? current.item.videoId : null;

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({
      country: selectedCountry.code,
      maxResults: '20',
      ...(query ? { q: query } : {}),
    });

    fetch(`/api/youtube/music?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setVideos(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load music');
        setIsLoading(false);
      });
  }, [selectedCountry, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-52 min-h-[100dvh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 text-foreground tracking-tight flex items-center gap-3">
          <Music2 className="w-8 h-8 text-primary" />
          Music
        </h1>
        <p className="text-muted-foreground">
          Tap any song to play it directly — no redirects.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative">
          <select
            value={selectedCountry.code}
            onChange={(e) => {
              const c = COUNTRIES.find((c) => c.code === e.target.value);
              if (c) setSelectedCountry(c);
            }}
            className="appearance-none bg-secondary/30 border border-border rounded-full pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-auto min-w-[180px]"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search music..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-secondary/30 border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Country badge */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">{selectedCountry.flag}</span>
        <span className="text-lg font-semibold text-foreground">{selectedCountry.name}</span>
        {query && (
          <span className="ml-2 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-xs rounded-full font-medium">
            "{query}"
          </span>
        )}
      </div>

      {/* Grid */}
      {error ? (
        <div className="py-20 text-center bg-card rounded-2xl border border-border">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Make sure your Google API Key has YouTube Data API v3 enabled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonMusicCard key={i} />)
            : videos.length > 0
            ? videos.map((video, i) => (
                <MusicCard
                  key={video.videoId}
                  video={video}
                  index={i}
                  isPlaying={currentVideoId === video.videoId}
                  onPlay={() => play({ kind: 'video', item: video })}
                />
              ))
            : (
              <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-border">
                <Music2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">Try a different country or search term.</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
