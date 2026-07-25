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
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 text-slate-800 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
        >
          {/* Ambient Subtle Background Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar Header */}
          <div className="relative z-10 w-full flex items-center justify-between opacity-80 text-[11px] font-mono tracking-widest uppercase text-slate-500">
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
              <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-100/50 via-teal-50/50 to-amber-100/50 blur-xl pointer-events-none" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border border-slate-200/80 shadow-lg p-1.5 flex items-center justify-center ring-4 ring-emerald-500/5">
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
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800">
                  GO CANTEEN
                </h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100/60 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Express
                </span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/90">
                Express Campus Food Ordering
              </p>
            </motion.div>

            {/* Premium Quote Card */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="bg-white/80 border border-slate-200/50 rounded-2xl p-4.5 shadow-sm backdrop-blur-md w-full space-y-2"
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Daily Culinary Quote</span>
              </div>
              <p className="text-xs sm:text-[13px] text-slate-600 font-medium italic leading-relaxed text-center">
                "{CANTEEN_QUOTES[quoteIndex]}"
              </p>
            </motion.div>

          </div>

          {/* Bottom Progress Bar & Percentage Ticker */}
          <div className="relative z-10 w-full max-w-xs mx-auto space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider px-1">
              <span>Loading Menu</span>
              <span className="text-emerald-600 font-extrabold">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
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
