import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { staffTranslations } from '../lib/translations';
import { requestForToken, messaging, onForegroundMessage } from '../lib/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cg-user-profile')) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  // View mode for role switcher: 'customer' | 'staff' | 'admin'
  const [activePortal, setActivePortalState] = useState(() => {
    return localStorage.getItem('cg-active-portal') || 'customer';
  });

  const setActivePortal = (portal) => {
    localStorage.setItem('cg-active-portal', portal);
    setActivePortalState(portal);
  };

  const resolveActivePortalOnLogin = (prof, isExplicitLogin = false) => {
    let target = 'customer';
    if (prof?.role === 'admin') {
      target = 'admin';
      if (isExplicitLogin && window.location.pathname !== '/menu') {
        window.location.pathname = '/admin/dashboard';
      }
    } else if (prof?.role === 'staff') {
      target = 'staff';
      if (isExplicitLogin && window.location.pathname !== '/menu') {
        window.location.pathname = '/staff/kds';
      }
    } else {
      target = 'customer';
    }
    setActivePortal(target);
  };

  // Global Cart State
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cg-unified-cart') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Global Toast
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const toastTimeoutRef = useRef(null);

  const showToast = (message, isError = false, duration = 3500) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ show: true, message, isError });

    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
      toastTimeoutRef.current = null;
    }, duration);
  };

  const fetchProfile = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: userId, email: userEmail, role: 'customer' }])
          .select()
          .single();
        const p = newProfile || { id: userId, email: userEmail, role: 'customer' };
        setProfile(p);
        localStorage.setItem('cg-user-profile', JSON.stringify(p));
        return p;
      } else if (data) {
        setProfile(data);
        localStorage.setItem('cg-user-profile', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
    const fallback = { id: userId, email: userEmail, role: 'customer' };
    setProfile(fallback);
    localStorage.setItem('cg-user-profile', JSON.stringify(fallback));
    return fallback;
  };

  useEffect(() => {
    let mounted = true;
    let authInitialized = false;

    const handleSessionChange = async (newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (newSession?.user) {
        try {
          // We can set loading false earlier so the UI appears faster, then resolve profile async
          const prof = await fetchProfile(newSession.user.id, newSession.user.email);
          if (mounted) {
            resolveActivePortalOnLogin(prof);
          }
        } catch (e) {
          console.error("Error setting profile on session change:", e);
        }
      } else {
        setProfile(null);
        localStorage.removeItem('cg-user-profile');
        setActivePortal('customer');
      }

      authInitialized = true;
      if (mounted) {
        setLoading(false);
      }
    };

    // 1. Immediately check session on mount (faster than waiting for event)
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted) {
        handleSessionChange(initialSession);
      }
    }).catch(err => {
      console.warn("Fast session check failed:", err);
      if (mounted) setLoading(false);
    });

    // 2. Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      handleSessionChange(newSession);
    });

    // 3. Absolute Safety fallback: force UI unlock after 2 seconds no matter what
    const fallbackTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cg-unified-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // If this window was opened as a child popup, close popup after login
    if (window.opener && window.opener !== window && session?.user) {
      try {
        window.close();
      } catch (e) { }
    }
  }, [session]);

  // Request notification permissions and save token
  useEffect(() => {
    const initNotifications = async () => {
      // Only auto-initialize if permission is already granted.
      // If it's 'default', our custom NotificationPrompt component will softly ask the user instead.
      if (session?.user && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const token = await requestForToken();
          if (token) {
            // Update fcm_token in Supabase profiles
            await supabase
              .from('profiles')
              .update({ fcm_token: token })
              .eq('id', session.user.id);
          }
        } catch (e) {
          console.warn('FCM token initialization failed:', e);
        }
      }
    };

    // Delay initialization slightly to ensure service worker is fully ready
    const timer = setTimeout(initNotifications, 2000);
    return () => clearTimeout(timer);
  }, [session]);

  // Foreground notification listener
  useEffect(() => {
    let unsubscribe = null;
    
    if ('Notification' in window && Notification.permission === 'granted' && session?.user) {
      try {
        unsubscribe = onForegroundMessage((payload) => {
          console.log('Foreground message received:', payload);
          const body = payload.notification?.body || '';
          const title = payload.notification?.title || 'Notification';
          showToast(`🔔 ${title}: ${body}`, false, 5000);
        });
      } catch (err) {
        console.warn('Error setting up foreground notification listener:', err);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [session]);

  const triggerHaptic = (ms = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) { }
    }
  };

  const addToCart = (item) => {
    triggerHaptic(15);
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(`Added ${item.name} to cart 🛒`, false, 1000);
  };

  const updateCartQty = (id, delta) => {
    triggerHaptic(15);
    setCart(prev => {
      return prev
        .map(i => {
          if (i.id === id) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (id) => {
    triggerHaptic([20, 10, 20]);
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => {
    triggerHaptic([30, 20, 30]);
    setCart([]);
    setAppliedPromo(null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('cg-admin-unlocked');
    localStorage.removeItem('cg-user-profile');
    setSession(null);
    setProfile(null);
    clearCart();
    showToast('Logged out successfully');
  };

  // Staff Language Selector: 'en' | 'hi' | 'hinglish'
  const [staffLanguage, setStaffLanguageState] = useState(() => {
    return localStorage.getItem('gocanteen-staff-lang') || 'en';
  });

  const setStaffLanguage = (lang) => {
    setStaffLanguageState(lang);
    localStorage.setItem('gocanteen-staff-lang', lang);
  };

  const staffT = staffTranslations[staffLanguage] || staffTranslations.en;

  // Admin Passcode Gate state
  const [isAdminUnlocked, setIsAdminUnlockedState] = useState(() => {
    return localStorage.getItem('cg-admin-unlocked') === 'true';
  });

  const setIsAdminUnlocked = (val) => {
    localStorage.setItem('cg-admin-unlocked', val ? 'true' : 'false');
    setIsAdminUnlockedState(val);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        user: session?.user || profile || null,
        loading,
        connectionError,
        userRole: profile?.role || 'customer',
        activePortal,
        setActivePortal,
        isAdminUnlocked,
        setIsAdminUnlocked,
        staffLanguage,
        setStaffLanguage,
        staffT,
        cart,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        setCart,
        appliedPromo,
        setAppliedPromo,
        toast,
        showToast,
        triggerHaptic,
        logout,
        fetchProfile: () => profile && fetchProfile(profile.id, profile.email)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
