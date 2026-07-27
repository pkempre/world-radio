import { Link, useLocation } from 'wouter';
import { Radio, Search, Globe, Heart, Crown, Music2, Mic2, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useSubscription } from '../context/SubscriptionContext';

export function Navbar() {
  const [location] = useLocation();
  const { isPremium } = useSubscription();

  const radioLinks = [
    { href: '/', label: 'Discover', icon: Radio },
    { href: '/browse', label: 'Browse', icon: Globe },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/favorites', label: 'Favorites', icon: Heart },
  ];

  const musicLinks = [
    { href: '/music', label: 'Music', icon: Music2 },
    { href: '/artists', label: 'Artists', icon: Mic2 },
    { href: '/playlists', label: 'Playlists', icon: ListMusic },
  ];

  const allLinks = [...radioLinks, ...musicLinks];

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity shrink-0">
          <Radio className="w-7 h-7" />
          <span className="font-bold text-lg tracking-tight text-foreground hidden sm:block">
            World<span className="text-primary">Radio</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1 bg-secondary/30 p-1 rounded-full border border-border/50 overflow-x-auto">
          {/* Radio section */}
          {radioLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />

          {/* YouTube/Music section */}
          {musicLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Desktop Premium */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {isPremium ? (
            <Link href="/subscription">
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all cursor-pointer">
                <Crown className="w-4 h-4" />
                Premium
              </span>
            </Link>
          ) : (
            <Link href="/pricing">
              <span className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 cursor-pointer">
                <Crown className="w-4 h-4" />
                Premium
              </span>
            </Link>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="flex lg:hidden items-center gap-1.5">
          {allLinks.map((link) => {
            const isActive = location === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
              </Link>
            );
          })}
          <Link
            href={isPremium ? '/subscription' : '/pricing'}
            className={cn(
              "p-2 rounded-full transition-colors",
              location === '/pricing' || location === '/subscription'
                ? "text-primary bg-primary/10"
                : isPremium
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Crown className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
