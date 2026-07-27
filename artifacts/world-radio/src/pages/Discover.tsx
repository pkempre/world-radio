import { useEffect, useState } from 'react';
import { Station } from '../types';
import { StationCard } from '../components/StationCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ArrowRight, Disc3 } from 'lucide-react';

export default function Discover() {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/radio/json/stations/topvote/20')
      .then(res => res.json())
      .then(data => {
        setStations(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch top stations", err);
        setIsLoading(false);
      });
  }, []);

  const genres = [
    'jazz', 'classical', 'electronic', 'rock', 'news', 'ambient', 'pop', 'hiphop'
  ];

  return (
    <div className="min-h-[100dvh] pb-32">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background z-0" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 z-0" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-foreground">
              Travel the world <br/>
              <span className="text-primary italic font-serif font-normal">through sound.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Explore thousands of live radio stations from every corner of the planet. Immerse yourself in local cultures, late-night broadcasts, and global frequencies.
            </p>
            
            <div className="flex flex-wrap gap-3">
              {genres.map(genre => (
                <Link key={genre} href={`/browse?tag=${genre}`}>
                  <span className="px-5 py-2.5 rounded-full bg-secondary/50 hover:bg-primary hover:text-primary-foreground border border-border/50 text-sm font-medium transition-all cursor-pointer capitalize">
                    {genre}
                  </span>
                </Link>
              ))}
              <Link href="/browse">
                <span className="px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-medium text-sm transition-all cursor-pointer flex items-center gap-2">
                  All Genres <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Disc3 className="w-6 h-6 text-primary animate-[spin_4s_linear_infinite]" />
          <h2 className="text-2xl font-bold">Trending Worldwide</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : stations.length > 0 ? (
            stations.map((station, i) => (
              <StationCard key={station.stationuuid} station={station} index={i} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
              Could not load trending stations right now.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
