import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onFinish }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade-out timer trigger
    const finishTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 400); // Fade-out transition duration
    }, 1800);

    return () => clearTimeout(finishTimer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-white text-slate-900 flex flex-col items-center justify-center select-none overflow-hidden"
        >
          {/* Centered Minimal Brand Showcase */}
          <div className="relative flex flex-col items-center text-center">
            
            {/* Logo Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="w-20 h-20 mb-6 flex items-center justify-center rounded-2xl overflow-hidden"
            >
              <img
                src="/app-icon.png"
                alt="Go Canteen Logo"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Brand Title */}
            <motion.h1
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="text-xl font-black tracking-[0.1em] text-slate-800 uppercase"
            >
              GO CANTEEN
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase"
            >
              Express Campus Pickup
            </motion.p>
            
            {/* Minimal Spinner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2"
            >
              <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </motion.div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
