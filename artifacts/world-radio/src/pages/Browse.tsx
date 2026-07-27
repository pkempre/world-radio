import { useState, useEffect } from 'react';
import { useSearch } from 'wouter';
import { Station } from '../types';
import { StationCard } from '../components/StationCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { Filter, Loader2 } from 'lucide-react';

export default function Browse() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialTag = searchParams.get('tag') || '';
  const initialCountry = searchParams.get('country') || '';

  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const [filters, setFilters] = useState({
    tag: initialTag,
    country: initialCountry,
  });

  const LIMIT = 24;

  const fetchStations = async (currentOffset: number, append = false) => {
    if (!append) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: currentOffset.toString(),
        hidebroken: 'true',
        order: 'clickcount',
        reverse: 'true'
      });

      if (filters.tag) params.append('tag', filters.tag);
      if (filters.country) params.append('country', filters.country);

      const res = await fetch(`/api/radio/json/stations/search?${params.toString()}`);
      const data = await res.json();

      if (append) {
        setStations(prev => [...prev, ...data]);
      } else {
        setStations(data);
      }
    } catch (err) {
      console.error("Failed to fetch stations", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchStations(0, false);
  }, [filters]);

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchStations(nextOffset, true);
  };

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-32 min-h-[100dvh]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 text-foreground tracking-tight">Browse</h1>
          <p className="text-muted-foreground">Filter stations by genre or country.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Filter by genre..." 
              value={filters.tag}
              onChange={(e) => updateFilter('tag', e.target.value)}
              className="w-full md:w-48 pl-9 pr-4 py-2 bg-secondary/30 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Filter by country..." 
              value={filters.country}
              onChange={(e) => updateFilter('country', e.target.value)}
              className="w-full md:w-48 pl-9 pr-4 py-2 bg-secondary/30 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stations.length > 0 ? (
          stations.map((station, i) => (
            <StationCard key={`${station.stationuuid}-${i}`} station={station} index={i % LIMIT} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-border">
            <h3 className="text-xl font-semibold mb-2">No stations found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to find more results.</p>
          </div>
        )}
      </div>

      {stations.length > 0 && stations.length % LIMIT === 0 && !isLoading && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-8 py-3 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground font-medium transition-colors flex items-center gap-2"
          >
            {isLoadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
