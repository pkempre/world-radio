import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { PlayerProvider } from './context/PlayerContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { YouTubePlayerProvider } from './context/YouTubePlayerContext';
import { PlayerBar } from './components/PlayerBar';
import { YouTubePlayerBar } from './components/YouTubePlayerBar';
import { Navbar } from './components/Navbar';

import Discover from './pages/Discover';
import Browse from './pages/Browse';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Music from './pages/Music';
import Artists from './pages/Artists';
import Playlists from './pages/Playlists';
import Pricing from './pages/Pricing';
import Subscription from './pages/Subscription';
import CheckoutSuccess from './pages/CheckoutSuccess';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground">This frequency is static.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Discover} />
      <Route path="/browse" component={Browse} />
      <Route path="/search" component={Search} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/music" component={Music} />
      <Route path="/artists" component={Artists} />
      <Route path="/playlists" component={Playlists} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <SubscriptionProvider>
            <YouTubePlayerProvider>
              <PlayerProvider>
                <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary relative font-sans">
                  <Navbar />
                  <main className="flex-1">
                    <Router />
                  </main>
                  <PlayerBar />
                  <YouTubePlayerBar />
                </div>
                <Toaster />
              </PlayerProvider>
            </YouTubePlayerProvider>
          </SubscriptionProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
