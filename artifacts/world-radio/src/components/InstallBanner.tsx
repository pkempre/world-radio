import { useState } from 'react';
import { Download, X, Share, MoreVertical, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('install-banner-dismissed') === 'true';
  });

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  const shouldShow = isInstallable && !isInstalled && !dismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="install-banner"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed top-16 left-0 right-0 z-50 px-4 py-2"
        >
          <div className="max-w-2xl mx-auto bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 p-4 flex items-center gap-4">
            {/* Icon */}
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Radio className="w-6 h-6 text-primary" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">
                Install World Radio
              </p>
              {isIOS ? (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                  Tap
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-secondary rounded text-foreground font-medium">
                    <Share className="w-3 h-3" /> Share
                  </span>
                  then
                  <span className="px-1.5 py-0.5 bg-secondary rounded text-foreground font-medium">
                    Add to Home Screen
                  </span>
                  for background audio
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Install for background audio &amp; offline access
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!isIOS && (
                <button
                  onClick={triggerInstall}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
              )}
              <button
                onClick={dismiss}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
