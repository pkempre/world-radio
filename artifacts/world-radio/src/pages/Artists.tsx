import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic2, ExternalLink, ChevronDown } from 'lucide-react';
import { YouTubeArtist, COUNTRIES } from '../types';

function SkeletonArtistCard() {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-secondary/50 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-secondary/50 rounded-full w-2/3" />
        <div className="h-3 bg-secondary/30 rounded-full w-full" />
        <div className="h-3 bg-secondary/30 rounded-full w-1/2" />
      </div>
    </div>
  );
}

function ArtistCard({ artist, index }: { artist: YouTubeArtist; index: number }) {
  return (
    <motion.a
      href={`https://www.youtube.com/channel/${artist.channelId}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group bg-card border border-card-border rounded-2xl p-5 flex items-center gap-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
    >
      <div className="relative shrink-0">
        {artist.thumbnail ? (
          <img
            src={artist.thumbnail}
            alt={artist.title}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/50 transition-all"
            loading="lazy"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center ring-2 ring-border">
            <Mic2 className="w-7 h-7 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {artist.title}
          </h3>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
        {artist.description && (
          <p className="text-muted-foreground text-xs mt-1 line-clamp-2 leading-relaxed">
            {artist.description}
          </p>
        )}
      </div>
    </motion.a>
  );
}

export default function Artists() {
  const [artists, setArtists] = useState<YouTubeArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({
      country: selectedCountry.code,
      maxResults: '20',
    });

    fetch(`/api/youtube/artists?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setArtists(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load artists');
        setIsLoading(false);
      });
  }, [selectedCountry]);

  return (
    <div className="container mx-auto px-4 py-8 pb-32 min-h-[100dvh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 text-foreground tracking-tight flex items-center gap-3">
          <Mic2 className="w-8 h-8 text-primary" />
          Artists
        </h1>
        <p className="text-muted-foreground">Explore music artists and channels from every country.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative">
          <select
            value={selectedCountry.code}
            onChange={e => {
              const c = COUNTRIES.find(c => c.code === e.target.value);
              if (c) setSelectedCountry(c);
            }}
            className="appearance-none bg-secondary/30 border border-border rounded-full pl-4 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer w-full sm:w-auto min-w-[180px]"
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Country badge */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">{selectedCountry.flag}</span>
        <span className="text-lg font-semibold text-foreground">{selectedCountry.name}</span>
      </div>

      {/* Grid */}
      {error ? (
        <div className="py-20 text-center bg-card rounded-2xl border border-border">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">Check that your Google API Key has YouTube Data API v3 enabled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <SkeletonArtistCard key={i} />)
            : artists.length > 0
            ? artists.map((artist, i) => <ArtistCard key={artist.channelId} artist={artist} index={i} />)
            : (
              <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-border">
                <Mic2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No artists found</h3>
                <p className="text-muted-foreground">Try selecting a different country.</p>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
