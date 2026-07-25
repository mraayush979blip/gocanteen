import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const CANTEEN_QUOTES = [
  "Good food is the foundation of genuine happiness.",
  "Freshly prepared campus delights, zero queue waiting.",
  "Quality ingredients, crafted daily for your enjoyment.",
  "Fueling your academic journey with instant counter pickup.",
  "Express food ordering designed for seamless campus life."
];

export default function SplashScreen({ onFinish }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Select randomized quote
    setQuoteIndex(Math.floor(Math.random() * CANTEEN_QUOTES.length));

    // Smooth progress counter animation up to 100%
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 45);

    // Hide splash screen after completion (1.6s total duration)
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 400); // Fade-out duration
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
          className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
        >
          {/* Ambient Subtle Background Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar Header */}
          <div className="relative z-10 w-full flex items-center justify-between opacity-60 text-[11px] font-mono tracking-widest uppercase text-slate-400">
            <span>GO CANTEEN</span>
            <span>EXPRESS DINING</span>
          </div>

          {/* Center Main Branding Showcase */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm mx-auto my-auto">
            
            {/* Logo Mark with Subtle Ambient Ring */}
            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-emerald-500/30 via-teal-500/20 to-amber-500/30 blur-md" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border border-slate-700/60 shadow-2xl p-1 overflow-hidden flex items-center justify-center ring-1 ring-emerald-500/30">
                <img
                  src="/app-icon.png"
                  alt="Go Canteen Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
            </motion.div>

            {/* Brand Title & Subtitle */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  GO CANTEEN
                </h1>
                <span className="bg-yellow-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                  FAST
                </span>
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-emerald-400">
                Express Campus Food Ordering
              </p>
            </motion.div>

            {/* Premium Quote Card */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-xl backdrop-blur-md w-full space-y-1.5"
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daily Culinary Quote</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium italic leading-relaxed text-center">
                "{CANTEEN_QUOTES[quoteIndex]}"
              </p>
            </motion.div>

          </div>

          {/* Bottom Progress Bar & Percentage Ticker */}
          <div className="relative z-10 w-full max-w-xs mx-auto space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider px-1">
              <span>Loading Menu</span>
              <span className="text-emerald-400 font-black">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 rounded-full"
              />
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
