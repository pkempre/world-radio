import { X, Music2, ListMusic, Mic2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useYouTubePlayer } from '../context/YouTubePlayerContext';

function getEmbedUrl(current: ReturnType<typeof useYouTubePlayer>['current']): string | null {
  if (!current) return null;
  const base = 'https://www.youtube.com/embed';
  const params = 'autoplay=1&rel=0&modestbranding=1';
  if (current.kind === 'video') return `${base}/${current.item.videoId}?${params}`;
  if (current.kind === 'playlist') return `${base}/videoseries?list=${current.item.playlistId}&${params}`;
  if (current.kind === 'artist') return `${base}?listType=user_uploads&list=${current.item.channelId}&${params}`;
  return null;
}

export function YouTubePlayerBar() {
  const { current, close } = useYouTubePlayer();

  const embedUrl = getEmbedUrl(current);

  const icon =
    current?.kind === 'playlist' ? <ListMusic className="w-4 h-4" /> :
    current?.kind === 'artist' ? <Mic2 className="w-4 h-4" /> :
    <Music2 className="w-4 h-4" />;

  const label =
    current?.kind === 'video' ? current.item.title :
    current?.kind === 'playlist' ? current.item.title :
    current?.kind === 'artist' ? current.item.title :
    '';

  const sublabel =
    current?.kind === 'video' ? current.item.channelTitle :
    current?.kind === 'playlist' ? current.item.channelTitle :
    current?.kind === 'artist' ? 'Artist Channel' :
    '';

  const thumbnail =
    current?.kind === 'video' ? current.item.thumbnail :
    current?.kind === 'playlist' ? current.item.thumbnail :
    current?.kind === 'artist' ? current.item.thumbnail :
    null;

  return (
    <AnimatePresence>
      {current && embedUrl && (
        <motion.div
          key="yt-bar"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/60 shadow-2xl"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 py-3">
              {/* Thumbnail */}
              {thumbnail && (
                <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden ring-2 ring-primary/30">
                  <img src={thumbnail} alt={label} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-primary mb-0.5">
                  {icon}
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    {current.kind === 'video' ? 'Music' : current.kind === 'playlist' ? 'Playlist' : 'Artist'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground truncate">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{sublabel}</p>
              </div>

              {/* Embedded player */}
              <div className="shrink-0 rounded-xl overflow-hidden ring-1 ring-border/50 shadow-lg">
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  width="320"
                  height="180"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="block"
                  title={label}
                />
              </div>

              {/* Close */}
              <button
                onClick={close}
                className="shrink-0 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Close player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
