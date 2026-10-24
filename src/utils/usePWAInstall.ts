import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && (window as any).__deferredPwaPrompt) {
      return (window as any).__deferredPwaPrompt as BeforeInstallPromptEvent;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect standalone mode (already installed or running as standalone window)
    const checkIsInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkIsInstalled();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsInstalled(true);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // 2. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 3. Check if window already holds a cached deferred prompt
    if ((window as any).__deferredPwaPrompt && !deferredPrompt) {
      setDeferredPrompt((window as any).__deferredPwaPrompt);
    }

    // 4. Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__deferredPwaPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 5. Capture appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        delete (window as any).__deferredPwaPrompt;
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<{ success: boolean; outcome?: 'accepted' | 'dismissed' }> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null);
    if (!promptEvent) {
      return { success: false };
    }

    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      
      // Clear deferred prompt after user responds
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        try {
          delete (window as any).__deferredPwaPrompt;
        } catch {}
      }

      if (choiceResult && choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        return { success: true, outcome: 'accepted' };
      }

      return { success: false, outcome: choiceResult?.outcome || 'dismissed' };
    } catch (err) {
      console.warn('Error during PWA install prompt:', err);
      return { success: false };
    }
  };

  const hasPrompt = !!deferredPrompt || (typeof window !== 'undefined' && !!(window as any).__deferredPwaPrompt);

  return {
    isInstallable: hasPrompt && !isInstalled,
    isInstalled,
    isIOS,
    install,
    deferredPrompt,
  };
}
