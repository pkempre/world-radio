import { useState, useEffect, useRef } from 'react';
import { Station } from '../types';
import { StationCard } from '../components/StationCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setStations([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/radio/json/stations/search?name=${encodeURIComponent(searchQuery)}&limit=40&hidebroken=true&order=clickcount&reverse=true`);
      const data = await res.json();
      setStations(data);
    } catch (err) {
      console.error("Failed to search stations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (query.trim()) {
      timerRef.current = setTimeout(() => {
        performSearch(query);
      }, 500);
    } else {
      setStations([]);
      setHasSearched(false);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-8 pb-32 min-h-[100dvh]">
      <div className="max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold mb-6 text-foreground tracking-tight text-center">Find a Station</h1>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-16 pr-6 py-5 bg-card border-2 border-border rounded-full text-lg shadow-sm focus:outline-none focus:border-primary focus:ring-0 transition-all placeholder:text-muted-foreground"
            placeholder="Search by station name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          )}
        </div>
      </div>

      {!hasSearched ? (
        <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
          <SearchIcon className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">Type a name to search our global directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          ) : stations.length > 0 ? (
            stations.map((station, i) => (
              <StationCard key={station.stationuuid} station={station} index={i} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-border">
              <h3 className="text-xl font-semibold mb-2">No stations found</h3>
              <p className="text-muted-foreground">We couldn't find anything matching "{query}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
