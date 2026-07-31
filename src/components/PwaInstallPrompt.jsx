import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed it
    const isDismissed = localStorage.getItem('gocanteen-install-prompt-dismissed');
    
    // iOS Detection
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // Check if running as PWA
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    
    // If it's iOS Safari and not installed, show manual instructions
    if (isIos() && !isInStandaloneMode() && !isDismissed) {
      setIsIosPrompt(true);
      const timer = setTimeout(() => setIsVisible(true), 4000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome Native Prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        const timer = setTimeout(() => setIsVisible(true), 4000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosPrompt) {
      // It's iOS, just dismiss because they have to do it manually
      handleDismiss();
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('gocanteen-install-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (deferredPrompt || isIosPrompt) && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-45 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-5 flex flex-col gap-3 select-none"
        >
          <div className="flex items-start gap-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <span className="text-2xl">🎁</span>
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <h3 className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                Get the Go Canteen App!
              </h3>
              <p className="text-[12px] text-slate-500 font-medium leading-snug mt-1">
                Install to receive live order updates, unlock <span className="text-emerald-600 font-bold">exclusive app discounts</span>, and skip the line entirely.
              </p>
            </div>
            
            <button
              onClick={handleDismiss}
              className="absolute top-0 right-0 text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1 rounded-full transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isIosPrompt ? (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
              <p className="text-[11px] text-slate-600 font-bold flex items-center gap-2">
                📱 iPhone Install Guide:
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Tap the <strong className="text-blue-500">Share</strong> icon at the bottom of Safari, then scroll down and tap <strong className="text-slate-800">"Add to Home Screen"</strong>.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs py-2.5 rounded-xl flex justify-center items-center gap-2 shadow-sm shadow-emerald-200 transition-all"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Install App Now</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
