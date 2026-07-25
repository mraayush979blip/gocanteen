import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownToLine, X } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later.
      setDeferredPrompt(e);

      // Check if user has already dismissed it in this session
      const isDismissed = localStorage.getItem('gocanteen-install-prompt-dismissed');
      if (!isDismissed) {
        // Show the prompt banner after a short delay to not conflict with the splash screen
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      console.log('Go Canteen app installed successfully.');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt response: ${outcome}`);

    // Clean up the prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Dismiss prompt to avoid nagging the user
    localStorage.setItem('gocanteen-install-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && deferredPrompt && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-45 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-4 flex items-start gap-4 select-none"
        >
          {/* Logo Container */}
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0">
            <img
              src="/app-icon.png"
              alt="Go Canteen Logo"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-extrabold text-slate-800 tracking-tight">
              Install Go Canteen App
            </h3>
            <p className="text-[11px] text-slate-500 font-medium leading-normal mt-0.5">
              Add to your home screen for express counter pickup and live order token status tracking.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-bold text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>

          {/* Close Icon Button */}
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-1.5 rounded-full transition-all shrink-0 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
