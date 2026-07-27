
import { useFavorites } from '../hooks/useFavorites';
import { StationCard } from '../components/StationCard';
import { Heart } from 'lucide-react';
import { Link } from 'wouter';

export default function Favorites() {
  const { favorites } = useFavorites();

  return (
    <div className="container mx-auto px-4 py-8 pb-32 min-h-[100dvh]">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 text-foreground tracking-tight flex items-center gap-3">
          <Heart className="w-8 h-8 text-primary fill-primary/20" />
          Your Collection
        </h1>
        <p className="text-muted-foreground">Stations you've saved for later listening.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="py-24 text-center bg-card rounded-2xl border border-border flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-3">No favorites yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            You haven't added any stations to your collection. Discover new music and tap the heart icon to save them here.
          </p>
          <Link href="/">
            <span className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors inline-block cursor-pointer shadow-lg shadow-primary/20">
              Discover Stations
            </span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((station, i) => (
            <StationCard key={station.stationuuid} station={station} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
