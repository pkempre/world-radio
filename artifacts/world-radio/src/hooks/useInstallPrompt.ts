import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS (Safari doesn't fire beforeinstallprompt — manual instructions needed)
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if already installed (standalone mode or display-mode: standalone)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Android/Chrome: capture the deferred install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Track successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    // On iOS, show banner if not already installed
    if (ios && !standalone) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return { isInstallable, isInstalled, isIOS, triggerInstall };
}
