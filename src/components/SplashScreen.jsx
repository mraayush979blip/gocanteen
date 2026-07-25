import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CANTEEN_QUOTES = [
  "Good food is the foundation of genuine happiness.",
  "Fresh campus meals cooked with care & zero queue waiting.",
  "Fast counter pickup powered by live token tracking.",
  "Savor every bite — fresh, hygienic ingredients prepared daily.",
  "Fuel your study sessions with delicious canteen favorites!"
];

export default function SplashScreen({ onFinish }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Pick random quote
    setQuoteIndex(Math.floor(Math.random() * CANTEEN_QUOTES.length));

    // Hide splash screen after 1.8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 500); // Allow fade-out exit animation
    }, 1800);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-between p-8 select-none"
        >
          {/* Top Decorative Sparkles */}
          <div className="w-full flex justify-between items-center opacity-40 text-xs font-mono tracking-widest text-emerald-400">
            <span>GO CANTEEN v2.0</span>
            <span>EXPRESS PICKUP</span>
          </div>

          {/* Center Brand Logo & Glowing Ring */}
          <div className="flex flex-col items-center text-center space-y-6 max-w-sm mx-auto my-auto">
            <div className="relative">
              {/* Pulse Glow Ring Effect */}
              <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500 to-amber-400 opacity-60 blur-xs animate-spin-slow" />
              
              <motion.div
                initial={{ scale: 0.6, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-emerald-400 shadow-2xl p-1 overflow-hidden flex items-center justify-center"
              >
                <img
                  src="/app-icon.png"
                  alt="Go Canteen Logo"
                  className="w-full h-full object-contain rounded-full"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-1.5"
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <span>GO CANTEEN</span>
                <span className="text-xs bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-md font-extrabold uppercase">
                  FAST
                </span>
              </h1>
              <p className="text-xs text-emerald-400 font-extrabold tracking-widest uppercase">
                Campus Food Ordering App
              </p>
            </motion.div>

            {/* Animated Food Quote */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="pt-2 px-4"
            >
              <p className="text-xs sm:text-sm text-slate-300 font-medium italic leading-relaxed text-center">
                "{CANTEEN_QUOTES[quoteIndex]}"
              </p>
            </motion.div>
          </div>

          {/* Bottom Shimmer Loading Bar */}
          <div className="w-full max-w-xs space-y-2">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.7, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 rounded-full"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-extrabold tracking-widest uppercase text-center block">
              Loading fresh canteen menu...
            </span>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
