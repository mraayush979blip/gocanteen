import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Smooth progress loading emulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 45);

    // Fade-out timer trigger
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 400); // Fade-out transition duration
    }, 1600);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 text-slate-800 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Subtle Ambient Radial Light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/35 rounded-full blur-3xl pointer-events-none" />

          {/* Centered Minimal Brand & Loading Showcase */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            {/* Pulsing Logo Mark */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.02, 0.98, 1],
                opacity: 1
              }}
              transition={{ 
                duration: 1.4,
                times: [0, 0.4, 0.75, 1],
                ease: "easeInOut"
              }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-100/50 via-teal-50/50 to-amber-100/50 blur-xl pointer-events-none" />
              <div className="relative w-20 h-20 rounded-full bg-white border border-slate-200/80 shadow-md p-1.5 flex items-center justify-center">
                <img
                  src="/app-icon.png"
                  alt="Go Canteen Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </motion.div>

            {/* Brand Title & Subtitle */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1"
            >
              <h1 className="text-2xl font-black tracking-wider text-slate-800 uppercase">
                GO CANTEEN
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-600/90">
                Express Campus Pickup
              </p>
            </motion.div>

            {/* Sleek Minimal Progress Line */}
            <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
