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
          className="fixed inset-0 z-50 bg-slate-200 text-slate-800 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Subtle Ambient Radial Light */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

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
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-300/30 via-teal-200/30 to-amber-200/30 blur-xl pointer-events-none" />
              <div className="relative w-24 h-24 rounded-full bg-slate-200 border-[3px] border-b-[8px] border-slate-300 shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9),inset_0_2px_4px_rgba(255,255,255,1)] p-2 flex items-center justify-center">
                <div className="w-full h-full rounded-full overflow-hidden shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,1)] bg-slate-100 flex items-center justify-center">
                  <img
                    src="/app-icon.png"
                    alt="Go Canteen Logo"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
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

            {/* Sleek Minimal Progress Line (Neumorphic Slot) */}
            <div className="w-48 h-3 bg-slate-200 rounded-full overflow-hidden relative shadow-[inset_3px_3px_6px_rgba(0,0,0,0.15),inset_-3px_-3px_6px_rgba(255,255,255,0.8)] border border-slate-300/50">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
