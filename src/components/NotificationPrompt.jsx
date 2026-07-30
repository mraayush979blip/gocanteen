import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import { requestForToken } from '../lib/firebase';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) return;

    // Only show if user is logged in, permission is default, and they haven't dismissed it recently
    const checkPermission = () => {
      if (session?.user && Notification.permission === 'default') {
        const dismissedStr = localStorage.getItem('notification_prompt_dismissed');
        let shouldShow = true;
        
        if (dismissedStr) {
          const dismissedTime = parseInt(dismissedStr, 10);
          // Don't show again if dismissed within the last 24 hours
          if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
            shouldShow = false;
          }
        }

        if (shouldShow) {
          setShowPrompt(true);
        }
      }
    };

    // Show after 4 seconds of logging in
    const timer = setTimeout(checkPermission, 4000);
    return () => clearTimeout(timer);
  }, [session]);

  const handleAllow = async () => {
    setShowPrompt(false);
    try {
      const token = await requestForToken();
      if (token && session?.user) {
        await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', session.user.id);
      }
    } catch (e) {
      console.warn('Failed to get notification permission:', e);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-white rounded-[24px] shadow-2xl z-[999] border border-slate-200 overflow-hidden"
        >
          <div className="p-5 flex gap-4 relative">
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 animate-bounce-slow">
              <BellRing className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="font-black text-slate-900 text-base tracking-tight pr-6">Don't Miss Your Order!</h3>
              <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                Allow notifications so we can instantly alert you exactly when your food is hot, ready, and waiting for pickup at the counter.
              </p>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAllow}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-200"
                >
                  Yes, Notify Me
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
