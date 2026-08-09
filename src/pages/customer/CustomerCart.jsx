import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  X, Trash2, Plus, Minus, Ticket, Smartphone, DollarSign, ArrowRight, Loader2, Sparkles, CheckCircle2, LogIn, KeyRound, CreditCard, ShieldCheck, Save, Bookmark, Info, Calendar, ChevronRight, AlertCircle, Copy, Tag, Check, Gift, Clock, BellRing
} from 'lucide-react';

export default function CustomerCart({ isOpen, onClose, onOpenAuth, onOrderPlaced }) {
  const { cart, updateCartQty, removeFromCart, clearCart, setCart, session, profile, fetchProfile, showToast, appliedPromo, setAppliedPromo, selectedOutlet } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saveToProfileOption, setSaveToProfileOption] = useState(true);

  const [savingProfile, setSavingProfile] = useState(false);
  const [canteenSettings, setCanteenSettings] = useState({
    openTime: '08:00',
    closeTime: '17:00',
    isHoliday: false,
    loading: true
  });

  const fetchCanteenSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
      if (!error && data) {
        const open = data.find(s => s.key === 'canteen_open_time')?.value || '08:00';
        const close = data.find(s => s.key === 'canteen_close_time')?.value || '17:00';
        const holiday = data.find(s => s.key === 'canteen_is_holiday')?.value === 'true';
        setCanteenSettings({ openTime: open, closeTime: close, isHoliday: holiday, loading: false });
      } else {
        setCanteenSettings(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.warn('Error fetching canteen settings:', err);
      setCanteenSettings(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCanteenSettings();
    }
  }, [isOpen]);

  const isCanteenOpen = () => {
    if (canteenSettings.isHoliday) return false;
    try {
      const now = new Date();
      const options = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false };
      const formatter = new Intl.DateTimeFormat('en-US', options);
      const timeStr = formatter.format(now);
      const [currHour, currMin] = timeStr.split(':').map(Number);

      const [openHour, openMin] = canteenSettings.openTime.split(':').map(Number);
      const [closeHour, closeMin] = canteenSettings.closeTime.split(':').map(Number);

      const currMinutes = currHour * 60 + currMin;
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      return currMinutes >= openMinutes && currMinutes < closeMinutes;
    } catch (e) {
      const now = new Date();
      const currHour = now.getHours();
      const currMin = now.getMinutes();
      const [openHour, openMin] = canteenSettings.openTime.split(':').map(Number);
      const [closeHour, closeMin] = canteenSettings.closeTime.split(':').map(Number);

      const currMinutes = currHour * 60 + currMin;
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      return currMinutes >= openMinutes && currMinutes < closeMinutes;
    }
  };

  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cash'
  const [notes, setNotes] = useState('');
  const [isParcel, setIsParcel] = useState(false);

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState(null);
  const [confirmedCode, setConfirmedCode] = useState(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const [showCartNotifPrompt, setShowCartNotifPrompt] = useState(false);

  // Dynamically load Razorpay SDK only when cart is opened to prevent preload warnings
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && !window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && session?.user && 'Notification' in window && Notification.permission === 'default' && cart.length > 0) {
      const dismissedStr = localStorage.getItem('cart_notification_prompt_dismissed');
      let shouldShow = true;
      if (dismissedStr) {
        const dismissedTime = parseInt(dismissedStr, 10);
        if (Date.now() - dismissedTime < 12 * 60 * 60 * 1000) {
          shouldShow = false;
        }
      }
      if (shouldShow) {
        const t = setTimeout(() => setShowCartNotifPrompt(true), 600);
        return () => clearTimeout(t);
      }
    } else if (!isOpen) {
      setShowCartNotifPrompt(false);
    }
  }, [isOpen, session, cart.length]);

  const handleAllowCartNotif = async () => {
    setShowCartNotifPrompt(false);
    try {
      const { requestForToken } = await import('../../lib/firebase');
      const token = await requestForToken();
      if (token && session?.user) {
        await supabase.from('profiles').update({ fcm_token: token }).eq('id', session.user.id);
        showToast('Notifications enabled!', false);
      }
    } catch (e) {
      console.warn('Failed to get notification permission:', e);
    }
  };

  const handleDismissCartNotif = () => {
    setShowCartNotifPrompt(false);
    localStorage.setItem('cart_notification_prompt_dismissed', Date.now().toString());
  };

  // Fetch pending order count for user-level spam protection checks
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      const fetchPendingCount = async () => {
        try {
          const { count, error } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', session.user.id)
            .eq('status', 'pending');
          if (!error && count !== null) {
            setPendingOrdersCount(count);
          }
        } catch (e) {
          console.warn('Could not fetch pending orders count:', e);
        }
      };
      fetchPendingCount();
    } else if (!isOpen) {
      setPendingOrdersCount(0);
    }
  }, [isOpen, session]);

  // Fetch active available coupons — secret (Yogle) coupons are excluded from this list
  const fetchAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAvailableCoupons(data.filter(c => {
          if (c.is_secret) return false;
          const isExpired =
            (c.valid_till && new Date(c.valid_till) < new Date()) ||
            (c.max_uses && (c.current_uses || 0) >= c.max_uses);
          return !isExpired;
        }));
      }
    } catch (err) {
      console.error('Error fetching available coupons:', err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Pre-fill customer name & phone from profile/session/Supabase & fetch coupons
  useEffect(() => {
    const fetchFreshProfile = async () => {
      if (!session?.user?.id) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', session.user.id)
          .maybeSingle();

        if (data) {
          if (data.full_name) setCustomerName(data.full_name);
          if (data.phone) setPhone(data.phone);
        }
      } catch (err) {
        console.error('Error fetching fresh cart profile:', err);
      }
    };

    if (isOpen) {
      if (profile?.full_name) setCustomerName(profile.full_name);
      if (profile?.phone) setPhone(profile.phone);

      fetchFreshProfile();
      fetchAvailableCoupons();
    }
  }, [isOpen, session, profile]);

  // Window anti-exit listener has been removed because it intercepts and blocks UPI deep links (upi://) from opening native apps on mobile devices.

  const [enablePlatformFee, setEnablePlatformFee] = useState(() => {
    return localStorage.getItem('enable_platform_fee') !== 'false';
  });

  useEffect(() => {
    const fetchPlatformFeeSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'enable_platform_fee')
          .maybeSingle();

        if (!error && data) {
          const isEnabled = data.value !== 'false';
          setEnablePlatformFee(isEnabled);
          localStorage.setItem('enable_platform_fee', isEnabled ? 'true' : 'false');
        }
      } catch (err) {
        console.error('Error fetching platform fee setting:', err);
      }
    };

    if (isOpen) {
      fetchPlatformFeeSetting();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
  let discountPercent = 0;
  if (appliedPromo) {
    discountPercent = Number(appliedPromo.discount_percent || appliedPromo.discount || 0);
  }
  const discountAmt = Math.round((subtotal * discountPercent) / 100);
  const amountAfterDiscount = Math.max(0, subtotal - discountAmt);

  const totalPackagableItems = cart.reduce((sum, item) => item.has_packaging_charge ? sum + (Number(item.qty) || 1) : sum, 0);
  const parcelCharge = isParcel ? (10 * totalPackagableItems) : 0;

  const baseAmountForFee = amountAfterDiscount + parcelCharge;
  const isOnlinePayment = paymentMethod === 'razorpay';
  const platformFee = (isOnlinePayment && enablePlatformFee) ? Number((baseAmountForFee * 0.0236).toFixed(2)) : 0;
  const finalPayableAmount = Number((baseAmountForFee + platformFee).toFixed(2));

  const handleApplyPromo = async (e) => {
    if (e) e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setPromoError('Invalid or expired coupon code');
        return;
      }

      if (data.valid_till && new Date(data.valid_till) < new Date()) {
        setPromoError('This coupon code has expired');
        return;
      }

      if (data.min_order_amount && subtotal < data.min_order_amount) {
        setPromoError(`Minimum order amount for this coupon is ₹${data.min_order_amount}`);
        return;
      }

      if (data.max_uses && (data.current_uses || 0) >= data.max_uses) {
        setPromoError('This coupon code has expired (usage limit reached)');
        return;
      }

      setAppliedPromo(data);
      const savings = Math.round((subtotal * Number(data.discount_percent || 0)) / 100);
      setPromoSuccess(`✓ Coupon Applied: ${data.discount_percent}% OFF! (Saved ₹${savings})`);
      showToast(`🎉 Coupon ${data.code} applied! Saved ₹${savings}`);
    } catch (err) {
      setPromoError('Error verifying coupon');
    }
  };

  const handleApplySelectedPromo = (coupon) => {
    setPromoError('');
    setPromoSuccess('');

    if (coupon.valid_till && new Date(coupon.valid_till) < new Date()) {
      showToast(`Coupon ${coupon.code} has expired`, true);
      return;
    }

    const minOrder = Number(coupon.min_order_amount || 0);
    if (minOrder > 0 && subtotal < minOrder) {
      const diff = minOrder - subtotal;
      showToast(`Add items worth ₹${diff} more to apply ${coupon.code}`, true);
      return;
    }

    if (coupon.max_uses && (coupon.current_uses || 0) >= coupon.max_uses) {
      showToast(`Coupon ${coupon.code} has expired (usage limit reached)`, true);
      return;
    }

    setAppliedPromo(coupon);
    setPromoCodeInput(coupon.code);
    const savings = Math.round((subtotal * Number(coupon.discount_percent || 0)) / 100);
    setPromoSuccess(`✓ Coupon Applied: ${coupon.discount_percent}% OFF! (Saved ₹${savings})`);
    showToast(`🎉 Coupon ${coupon.code} applied! Saved ₹${savings}`);
    setShowCouponsModal(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoSuccess('');
    setPromoError('');
    showToast('Coupon removed');
  };

  const handleSaveToProfile = async () => {
    if (!session?.user?.id) {
      showToast('Please sign in to save details to profile', true);
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!customerName.trim() || !phone.trim()) {
      showToast('Please enter both Full Name and Phone Number to save', true);
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: customerName.trim(), phone: phone.trim() })
        .eq('id', session.user.id);

      if (error) throw error;
      if (fetchProfile) await fetchProfile();
      showToast('✓ Saved! Your name and phone are now stored in profile.');
    } catch (err) {
      showToast('Failed to save profile: ' + err.message, true);
    } finally {
      setSavingProfile(false);
    }
  };

  const executeOrderPlacement = async ({ paymentStatus = 'unpaid', paymentId = null, pMethod = paymentMethod }) => {
    try {
      // Auto-save to profile if user requested or profile is missing details
      if (session?.user?.id && (saveToProfileOption || !profile?.full_name || !profile?.phone)) {
        try {
          await supabase
            .from('profiles')
            .update({ full_name: customerName.trim(), phone: phone.trim() })
            .eq('id', session.user.id);
          if (fetchProfile) fetchProfile();
        } catch (e) {
          console.warn('Auto profile update warning:', e);
        }
      }

      const orderId = crypto.randomUUID();

      let tokenNumber = 1;
      try {
        // Try getting the true global max token safely via Database Function (bypassing RLS)
        const { data: rpcToken, error: rpcError } = await supabase.rpc('get_next_token');
        
        if (!rpcError && rpcToken) {
          tokenNumber = Number(rpcToken);
        } else {
          // Fallback if RPC hasn't been created in DB yet
          const { data: maxTokenData } = await supabase
            .from('orders')
            .select('token_number')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (maxTokenData?.token_number && !isNaN(Number(maxTokenData.token_number))) {
            tokenNumber = Number(maxTokenData.token_number) + 1;
          }
        }
      } catch (e) {
        console.warn('Max token fetch error, fallback to 1:', e);
      }

      const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Save token_number and pickup_code to user_metadata so Supabase SMTP email reads exact values
      if (session?.user) {
        try {
          await supabase.auth.updateUser({
            data: {
              token_number: tokenNumber,
              pickup_code: pickupCode
            }
          });
        } catch (e) {
          console.warn('Could not update user_metadata for email template:', e);
        }
      }

      const userNotes = notes ? notes.trim() : '';

      let enrichedNotes = userNotes;
      if (paymentId) {
        const payTag = `💳 Razorpay Payment ID: ${paymentId}`;
        enrichedNotes = enrichedNotes ? `${enrichedNotes} | ${payTag}` : payTag;
      }

      const uniqueOrderId = 'GC-' + orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);

      const basePayload = {
        id: orderId,
        order_number: uniqueOrderId,
        customer_name: customerName.trim(),
        phone: phone.trim(),
        status: 'pending',
        payment_status: paymentStatus,
        payment_method: pMethod,
        total_amount: finalPayableAmount,
        special_instructions: enrichedNotes,
        token_number: tokenNumber,
        pickup_code: pickupCode,
        platform_fee: platformFee,
        subtotal_amount: subtotal,
        discount_amount: discountAmt,
        coupon_code: appliedPromo ? appliedPromo.code : '',
        payment_id: paymentId || '',
        razorpay_payment_id: paymentId || '',
        is_parcel: isParcel,
        parcel_charge: parcelCharge,
        outlet_id: selectedOutlet || null
      };



      if (session?.user?.id) {
        basePayload.customer_id = session.user.id;
      }

      const fullPayload = {
        ...basePayload,
        customer_email: session?.user?.email || profile?.email || ''
      };

      const { error: firstErr } = await supabase
        .from('orders')
        .insert([fullPayload]);

      if (firstErr) {
        console.warn('Full payload insert fallback executed:', firstErr.message);
        const { error: fallbackErr } = await supabase
          .from('orders')
          .insert([basePayload]);

        if (fallbackErr) throw fallbackErr;
      }


      const orderItemsPayload = cart.map(i => ({
        order_id: orderId,
        inventory_id: (!i.is_offer && typeof i.id === 'string' && i.id.length > 20) ? i.id : null,
        item_name: i.name,
        quantity: i.qty,
        price_at_time: i.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) {
        // Fallback for stale carts where an offer was added without the is_offer flag
        // or an inventory item was recently deleted but still in the cart.
        if (itemsError.message?.includes('violates foreign key constraint')) {
          const fallbackPayload = orderItemsPayload.map(item => ({
            ...item,
            inventory_id: null
          }));
          const { error: retryError } = await supabase.from('order_items').insert(fallbackPayload);
          if (retryError) {
             throw new Error(`Order placed but items failed to save (fallback): ${retryError.message}`);
          }
        } else {
          console.error("Order items failed to save:", itemsError);
          throw new Error(`Order placed but items failed to save: ${itemsError.message}`);
        }
      }

      // Promo usage count is now automatically securely handled by a Supabase Database Trigger

      setConfirmedToken(tokenNumber);
      setConfirmedCode(pickupCode);
      clearCart();
      showToast('🎉 Order placed successfully!');
    } catch (err) {
      console.error('Checkout error:', err);
      if (err.message?.includes('row-level security') || err.code === '42501') {
        showToast('Please sign in to complete order placement!', true);
        if (onOpenAuth) onOpenAuth();
      } else {
        showToast('Failed to place order: ' + err.message, true);
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const verifyStockAvailability = async () => {
    try {
      const inventoryIds = cart
        .map(i => i.id)
        .filter(id => typeof id === 'string' && id.length > 20);

      if (inventoryIds.length === 0) return { ok: true };

      const { data: invItems, error } = await supabase
        .from('inventory')
        .select('id, name, price, is_available')
        .in('id', inventoryIds);

      if (error) {
        console.warn('Stock verification query warning:', error.message);
        return { ok: true };
      }

      if (selectedOutlet) {
        const { data: availData } = await supabase
          .from('inventory_availability')
          .select('item_id, is_available')
          .eq('outlet_id', selectedOutlet)
          .in('item_id', inventoryIds);
        
        if (availData) {
          const availMap = {};
          availData.forEach(a => availMap[a.item_id] = a.is_available);
          invItems.forEach(item => {
            if (availMap[item.id] !== undefined) {
              item.is_available = availMap[item.id];
            }
          });
        }
      }

      const outOfStockNames = [];
      let priceChanged = false;

      const updatedCart = cart.map(cartItem => {
        const dbItem = invItems?.find(db => db.id === cartItem.id);
        if (dbItem) {
          // Check stock
          if (dbItem.is_available === false) {
            outOfStockNames.push(dbItem.name);
            return null; // Will be filtered out
          }
          // Check price
          const dbPrice = Number(dbItem.price);
          const cartPrice = Number(cartItem.price);
          if (dbPrice !== cartPrice) {
            priceChanged = true;
            showToast(`💰 Price Updated: "${dbItem.name}" changed from ₹${cartPrice} to ₹${dbPrice}.`, true);
            return { ...cartItem, price: dbPrice };
          }
        }
        return cartItem;
      }).filter(Boolean);

      if (outOfStockNames.length > 0) {
        outOfStockNames.forEach(name => {
          const item = cart.find(i => i.name === name);
          if (item) updateCartQty(item.id, -999);
        });
        return { ok: false, outOfStockNames };
      }

      if (priceChanged) {
        setCart(updatedCart);
        return { ok: false, priceUpdated: true };
      }

      return { ok: true };
    } catch (err) {
      console.warn('Stock verification error:', err);
      return { ok: true };
    }
  };

  const handlePlaceOrder = async () => {
    if (canteenSettings.isHoliday) {
      showToast('🗓️ Canteen is closed today due to a holiday.', true);
      return;
    }
    if (!isCanteenOpen()) {
      showToast(`⏰ Canteen is currently closed. Orders can only be placed between ${canteenSettings.openTime} and ${canteenSettings.closeTime} IST.`, true);
      return;
    }

    // Force login before placing order
    if (!session?.user) {
      showToast('🔑 Please sign in to place your order!', true);
      if (onOpenAuth) onOpenAuth();
      return;
    }

    // Check pending order limit before proceeding to payment
    if (session?.user?.id) {
      try {
        const { count, error } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', session.user.id)
          .eq('status', 'pending');

        if (!error && count !== null && count >= 3) {
          setPendingOrdersCount(count);
          showToast('⚠️ Order Limit Reached: You already have 3 pending orders. Please wait for them to be prepared!', true);
          return;
        }
      } catch (err) {
        console.warn('Spam order check warning:', err);
      }
    }

    let hasErr = false;
    if (!customerName.trim()) {
      setNameError('Full name is strictly required');
      hasErr = true;
    }
    if (!phone.trim()) {
      setPhoneError('Mobile phone number is strictly required');
      hasErr = true;
    } else if (phone.trim().length !== 10) {
      setPhoneError('Mobile number must be exactly 10 digits');
      hasErr = true;
    }

    if (hasErr) {
      showToast('Please fill in all mandatory fields (*)', true);
      return;
    }

    // Live background stock check before proceeding with payment/checkout (prevents stale local cache orders)
    setPlacingOrder(true);
    const stockCheck = await verifyStockAvailability();
    if (!stockCheck.ok) {
      setPlacingOrder(false);
      if (stockCheck.priceUpdated) {
        showToast(`⚠️ Order Total Updated: Some menu item prices changed to match the latest menu. Please review and place your order again!`, true);
      } else {
        const itemNames = stockCheck.outOfStockNames.join(', ');
        showToast(`⚠️ Out of Stock Alert: [${itemNames}] became unavailable in database! It has been removed from your cart.`, true);
      }
      return;
    }

    // DUAL-LAYER COD ANTI-SPAM & FAKE ORDER PROTECTION
    if (paymentMethod === 'cash') {
      const targetPhone = phone.trim();
      const targetUserId = session?.user?.id;

      try {

        setPlacingOrder(true);

        // 1. Rule 1: Max 2 Active Unpaid Cash Orders Limit
        let activeQuery = supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'unpaid')
          .in('status', ['pending', 'preparing', 'ready']);

        if (targetUserId) {
          activeQuery = activeQuery.or(`customer_id.eq.${targetUserId},phone.eq.${targetPhone}`);
        } else {
          activeQuery = activeQuery.eq('phone', targetPhone);
        }

        const { count: activeUnpaidCount, error: activeErr } = await activeQuery;

        if (!activeErr && activeUnpaidCount !== null && activeUnpaidCount >= 2) {
          setPlacingOrder(false);
          showToast('⚠️ Anti-Spam Lock: You have 2 unpaid Cash orders in queue! Pay at counter or use UPI Online to order more.', true);
          return;
        }

        // 2. Rule 2: Hourly COD Rate Limit (Max 5 Cash Orders per Hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        let hourlyQuery = supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', oneHourAgo);

        if (targetUserId) {
          hourlyQuery = hourlyQuery.or(`customer_id.eq.${targetUserId},phone.eq.${targetPhone}`);
        } else {
          hourlyQuery = hourlyQuery.eq('phone', targetPhone);
        }

        const { count: hourlyCount, error: hourlyErr } = await hourlyQuery;

        if (!hourlyErr && hourlyCount !== null && hourlyCount >= 5) {
          setPlacingOrder(false);
          showToast('⚠️ Anti-Spam Security: Hourly Cash order limit reached (max 5/hour). Please use UPI online payment!', true);
          return;
        }
      } catch (checkErr) {
        console.warn('Anti-spam check warning:', checkErr);
      } finally {
        setPlacingOrder(false);
      }
    }

    if (paymentMethod === 'razorpay') {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_THo2IUiDVzSCsC';

      if (typeof window.Razorpay === 'undefined') {
        setPlacingOrder(false);
        showToast('Razorpay SDK loading... Please wait a moment.', true);
        return;
      }

      setPlacingOrder(true);

      // 1. Create order on the backend serverless endpoint
      let orderData;
      try {
        const orderResponse = await fetch('/api/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: Math.round(finalPayableAmount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
          })
        });

        if (!orderResponse.ok) {
          const errData = await orderResponse.json();
          throw new Error(errData.error || 'Failed to initialize payment order');
        }

        orderData = await orderResponse.json();
      } catch (err) {
        setPlacingOrder(false);
        showToast(`❌ Payment Initialization Error: ${err.message}`, true);
        return;
      }

      // 2. Open official Razorpay modal using order_id
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Go Canteen',
        description: `Food Order (${cart.length} items)`,
        image: window.location.hostname === 'localhost' ? '' : window.location.origin + '/logo.png',
        order_id: orderData.order_id,
        prefill: {
          name: customerName,
          contact: phone,
          email: session?.user?.email || profile?.email || '',
          method: 'upi'
        },
        upi: {
          flow: 'intent'
        },
        theme: {
          color: '#059669', // Emerald brand theme color
          backdrop_color: '#f8fafc' // Slate-50 background shade
        },
        handler: async function (response) {
          if (!response || !response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            setPlacingOrder(false);
            showToast('❌ Invalid Payment Response from Razorpay. Transaction failed.', true);
            return;
          }

          // 3. Cryptographically verify signature on the backend
          try {
            setPlacingOrder(true);
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyResponse.ok) {
              const verifyErrData = await verifyResponse.json();
              throw new Error(verifyErrData.error || 'Signature verification failed');
            }

            // 4. Record order details into database as PAID online
            executeOrderPlacement({
              paymentStatus: 'paid',
              paymentId: response.razorpay_payment_id,
              pMethod: 'razorpay_upi'
            });
          } catch (verifyErr) {
            setPlacingOrder(false);
            showToast(`❌ Payment Verification Failed: ${verifyErr.message}`, true);
          }
        },
        modal: {
          backdropclose: false,
          escape: false,
          handleback: true,
          confirm_close: true,
          ondismiss: function () {
            setPlacingOrder(false);
            showToast('Payment window closed. Order was not placed.');
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setPlacingOrder(false);
          showToast(`Payment Failed: ${response.error.description}`, true);
        });
        rzp.open();
      } catch (e) {
        console.error('Razorpay Error:', e);
        setPlacingOrder(false);
        showToast('Failed to open payment window. Please try again.', true);
      }
    } else {
      setPlacingOrder(true);
      executeOrderPlacement({
        paymentStatus: 'unpaid',
        paymentId: null,
        pMethod: 'cash'
      });
    }
  };

  const handleSafeClose = () => {
    if (placingOrder) {
      showToast('⚠️ Payment is in progress. Please complete or cancel the payment window first!', true);
      return;
    }
    onClose();
  };

  const isProfileSaved = Boolean(profile?.full_name && profile?.phone);

  return (
    <div className={`fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 text-slate-900 ${placingOrder ? 'pointer-events-none' : 'opacity-100 animate-fade-in'}`} onClick={handleSafeClose}>
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>

        {/* Loading Overlay inside Cart */}
        {placingOrder && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-3 animate-fade-in pointer-events-auto">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-sm font-black text-slate-900">Processing Your Order...</p>
            <p className="text-xs text-slate-500 font-semibold">Please do not close or refresh this page.</p>
          </div>
        )}

        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h2 className="text-base font-black tracking-tight">Your Order Cart ({cart.length})</h2>
          </div>
          <button onClick={handleSafeClose} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER SUCCESS DISPLAY SCREEN */}
        {confirmedToken ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black text-3xl shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">Order Confirmed!</span>
              <h2 className="text-3xl font-black text-slate-900">Token #{confirmedToken}</h2>
              <p className="text-xs text-slate-500 font-medium">Your food is sent to kitchen KDS screen!</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl w-full max-w-xs space-y-1 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-purple-900 tracking-widest block">Pickup Security PIN</span>
              <div className="text-3xl font-black text-purple-950 tracking-widest font-mono">🔑 {confirmedCode}</div>
              <p className="text-[11px] text-slate-500 font-medium pt-1">Show this PIN at the counter during pickup</p>
            </div>

            {paymentMethod === 'cash' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-2xl w-full max-w-xs text-left shadow-2xs flex items-start gap-2.5 mx-auto">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold leading-tight">
                  <span className="block text-xs font-black text-amber-800 mb-0.5">Action Required!</span>
                  Please pay cash at the counter to start preparation. Staff will only begin making your order after successful payment.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setConfirmedToken(null);
                setConfirmedCode(null);
                onClose();
                if (onOrderPlaced) onOrderPlaced();
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              Track Order Live →
            </button>
          </div>
        ) : (
          <>
            {/* Scrollable Cart Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">

              {/* Login Prompt Banner if guest */}
              {!session && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-amber-900">Sign in to track your order live!</span>
                  <button
                    onClick={onOpenAuth}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-[11px] shrink-0 flex items-center gap-1"
                  >
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </button>
                </div>
              )}

              {/* Item List */}
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-2">
                  <span className="text-4xl">🛒</span>
                  <p className="text-xs text-slate-400 font-bold">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cart.map(item => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{item.emoji || '🍽️'}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                          <span className="text-[11px] text-slate-500 font-semibold">₹{item.price} each</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5">
                          <button onClick={() => updateCartQty(item.id, -1)} className="text-slate-400 hover:text-slate-900">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 px-1">{item.qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="text-slate-400 hover:text-slate-900">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  {/* Coupon Section */}
                  <div className="space-y-2">
                    {/* IF A COUPON IS ALREADY APPLIED */}
                    {appliedPromo ? (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                            🏷️
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">{appliedPromo.code}</span>
                              <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                                {appliedPromo.discount_percent || appliedPromo.discount}% OFF
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 font-bold">
                              🎉 Saved ₹{discountAmt} on this order!
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-xl transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* COUPON INPUT FORM */}
                        <form onSubmit={handleApplyPromo} className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Apply Promo Coupon</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                value={promoCodeInput}
                                onChange={(e) => setPromoCodeInput(e.target.value)}
                                placeholder="e.g. WELCOME10"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs uppercase focus:outline-none focus:border-emerald-600 font-bold"
                              />
                            </div>
                            <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl">
                              Apply
                            </button>
                          </div>
                          {promoError && <p className="text-[11px] text-red-600 font-bold">{promoError}</p>}
                          {promoSuccess && <p className="text-[11px] text-emerald-600 font-bold">{promoSuccess}</p>}
                        </form>

                        {/* BLINKIT-STYLE COUPON BANNER SHORTCUT */}
                        {availableCoupons.length > 0 && (
                          <div
                            onClick={() => {
                              fetchAvailableCoupons();
                              setShowCouponsModal(true);
                            }}
                            className="cursor-pointer bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-3 rounded-2xl flex items-center justify-between border border-purple-500/30 shadow-sm group transition-all hover:scale-[1.01]"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                                🎟️
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-yellow-300">Save extra with Coupons</span>
                                  <span className="text-[9px] font-black bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded-full uppercase">
                                    {availableCoupons.length} Deals
                                  </span>
                                </div>
                                <p className="text-[10px] text-purple-200 font-medium">
                                  Tap to see discount codes & min order conditions
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs font-bold text-yellow-300 group-hover:translate-x-1 transition-transform">
                              <span>See All</span>
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Customer Details Form */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {!session ? (
                      <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 text-center space-y-3 shadow-2xs my-1">
                        <LogIn className="w-5.5 h-5.5 text-amber-600 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-amber-900">Sign In Required to Checkout</h4>
                          <p className="text-[11px] text-amber-700 font-semibold leading-relaxed">
                            Please sign in with your campus Google account to place this order and track your token.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenAuth) onOpenAuth();
                          }}
                          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <LogIn className="w-3.5 h-3.5" /> Sign In with Google
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Contact & Delivery Info</h3>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={customerName}
                            onChange={(e) => {
                              setCustomerName(e.target.value);
                              if (e.target.value.trim()) setNameError('');
                            }}
                            placeholder="Enter your full name"
                            className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:outline-none transition-all ${nameError ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-emerald-600'
                              }`}
                          />
                          {nameError && <span className="text-[10px] text-red-500 font-bold block mt-1">{nameError}</span>}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Mobile Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 10 && val.startsWith('91')) {
                                val = val.slice(2);
                              } else if (val.length === 11 && val.startsWith('0')) {
                                val = val.slice(1);
                              }
                              const cleanValue = val.slice(0, 10);
                              setPhone(cleanValue);
                              if (cleanValue.length === 10) {
                                setPhoneError('');
                              } else if (cleanValue.length > 0 && cleanValue.length < 10) {
                                setPhoneError('Mobile number must be exactly 10 digits');
                              }
                            }}
                            placeholder="Enter 10-digit mobile number"
                            className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:outline-none transition-all ${phoneError ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-emerald-600'
                              }`}
                          />
                          {phoneError && <span className="text-[10px] text-red-500 font-bold block mt-1">{phoneError}</span>}
                        </div>

                        {/* Auto-Save to Profile Checkbox - Only shown if contact details NOT saved in profile yet */}
                        {!isProfileSaved && (
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 pt-0.5">
                            <input
                              type="checkbox"
                              checked={saveToProfileOption}
                              onChange={(e) => setSaveToProfileOption(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                            />
                            <span>💾 Save name & phone to my profile for 1-tap future checkouts</span>
                          </label>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Special Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Extra spicy, less sugar"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* Parcel Toggle */}
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between shadow-2xs mt-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📦</span>
                            <div>
                              <h4 className="text-xs font-black text-orange-900">Need Packaging?</h4>
                              <p className="text-[10px] text-orange-700 font-semibold leading-tight mt-0.5">Parcel charges will be calculated at ₹10/item for applicable categories.</p>
                            </div>
                          </div>
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={isParcel}
                              onChange={(e) => setIsParcel(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-orange-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all relative shadow-inner border border-slate-300 peer-checked:border-orange-600"></div>
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'razorpay', label: 'Pay Online', subtitle: 'Scan QR Code • GPay • PhonePe', icon: Smartphone, badge: 'QR & UPI ⚡' },
                        { id: 'cash', label: 'Cash at Counter', subtitle: 'pay at counter ', icon: DollarSign, badge: 'Pay Later' }
                      ].map(method => {
                        const Icon = method.icon;
                        const isSelected = paymentMethod === method.id;
                        return (
                          <div
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-1 relative ${isSelected
                              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {method.badge}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900">{method.label}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-tight">{method.subtitle}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sticky Checkout Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-white space-y-3 shadow-lg">

                {/* Canteen Closed Alert Callout */}
                {!isCanteenOpen() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 shadow-2xs">
                    <Clock className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-left">
                      <span className="text-xs font-black uppercase tracking-wider block text-amber-755">
                        {canteenSettings.isHoliday ? 'Canteen Holiday' : 'Ordering Closed'}
                      </span>
                      <p className="text-[11px] font-bold text-amber-900 leading-snug">
                        {canteenSettings.isHoliday
                          ? 'Ordering by app is locked by admin. ordering or checkout is locked.'
                          : `Orders are only accepted between ${canteenSettings.openTime} and ${canteenSettings.closeTime} (IST). ordering or checkout is locked.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending Orders Warning Callout */}
                {pendingOrdersCount >= 3 && isCanteenOpen() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 shadow-2xs">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-left">
                      <span className="text-xs font-black uppercase tracking-wider block text-amber-705">
                        Order Limit Reached
                      </span>
                      <p className="text-[11px] font-bold text-amber-900 leading-snug">
                        You already have 3 pending orders in queue. Please wait for the kitchen to prepare them before placing another order.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">₹{subtotal}</span>
                  </div>
                  {appliedPromo && discountAmt > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon ({appliedPromo.code})</span>
                      <span>-₹{discountAmt}</span>
                    </div>
                  )}
                  {isParcel && parcelCharge > 0 && (
                    <div className="flex justify-between text-orange-700 font-bold">
                      <span>Packaging Charge</span>
                      <span>+₹{parcelCharge}</span>
                    </div>
                  )}
                  {isOnlinePayment && platformFee > 0 && (
                    <div className="flex justify-between text-slate-700 font-bold text-xs">
                      <span>Platform Fee (UPI/Online)</span>
                      <span className="text-slate-900">+₹{platformFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
                    <span>Total Payable</span>
                    <span className="text-emerald-700">₹{finalPayableAmount}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || (session && !isCanteenOpen())}
                  className={`w-full py-4 font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 ${!session
                    ? 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer active:scale-[0.99]'
                    : !isCanteenOpen()
                      ? 'bg-slate-200 text-slate-400 border border-slate-350 cursor-not-allowed shadow-none'
                      : pendingOrdersCount >= 3
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.99]'
                    }`}
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : !session ? (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>SIGN IN TO PLACE ORDER</span>
                    </>
                  ) : !isCanteenOpen() ? (
                    <>
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span>{canteenSettings.isHoliday ? 'CLOSED FOR HOLIDAY' : `CLOSED (${canteenSettings.openTime} - ${canteenSettings.closeTime})`}</span>
                    </>
                  ) : pendingOrdersCount >= 3 ? (
                    <span>LIMIT REACHED (3 PENDING ORDERS)</span>
                  ) : (
                    <>
                      <span>{paymentMethod === 'razorpay' ? 'PAY & PLACE ORDER (UPI)' : 'CONFIRM ORDER (CASH)'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

      </div>

      {/* BLINKIT-STYLE AVAILABLE COUPONS OVERLAY DRAWER */}
      {showCouponsModal && (
        <div className="absolute inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in text-slate-900">
          <div className="bg-slate-50 w-full h-full flex flex-col shadow-2xl relative animate-slide-in-right">

            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
                  🎟️
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Available Coupons & Offers</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Select best coupon to apply to your order</p>
                </div>
              </div>
              <button
                onClick={() => setShowCouponsModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Subtotal Banner */}
            <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-xs font-bold shadow-inner">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Cart Subtotal: <b className="text-yellow-300 text-sm">₹{subtotal}</b></span>
              </div>
              {appliedPromo && (
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400">
                  {appliedPromo.code} Applied ✓
                </span>
              )}
            </div>

            {/* Coupons List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" data-lenis-prevent="true">
              {loadingCoupons ? (
                <div className="text-center py-12 space-y-2">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-bold">Loading available coupons...</p>
                </div>
              ) : availableCoupons.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <span className="text-4xl">🎟️</span>
                  <p className="text-xs text-slate-500 font-bold">No promo coupons available right now.</p>
                </div>
              ) : (
                availableCoupons.map((coupon) => {
                  const minOrder = Number(coupon.min_order_amount || 0);
                  const qualifies = subtotal >= minOrder;
                  const shortBy = minOrder - subtotal;
                  const discountPercent = Number(coupon.discount_percent || 0);
                  const calculatedSavings = Math.round((subtotal * discountPercent) / 100);
                  const isApplied = appliedPromo?.id === coupon.id || appliedPromo?.code === coupon.code;
                  const isExpired =
                    (coupon.valid_till && new Date(coupon.valid_till) < new Date()) ||
                    (coupon.max_uses && coupon.current_uses >= coupon.max_uses);

                  return (
                    <div
                      key={coupon.id}
                      className={`bg-white border rounded-2xl overflow-hidden shadow-xs transition-all relative ${isApplied
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : isExpired
                          ? 'border-slate-200 opacity-60'
                          : qualifies
                            ? 'border-slate-200 hover:border-emerald-400'
                            : 'border-amber-200 bg-amber-50/10'
                        }`}
                    >
                      {/* Top Accent Ribbon */}
                      <div className={`h-1.5 w-full ${isApplied ? 'bg-emerald-500' : qualifies ? 'bg-purple-600' : 'bg-amber-400'}`} />

                      <div className="p-4 space-y-3">

                        {/* Top Row: Discount Tag + Code + Apply Button */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-emerald-700 text-white font-black text-[11px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                                FLAT {discountPercent}% OFF
                              </span>
                              <span className="border-2 border-dashed border-emerald-600 text-emerald-950 font-black text-xs px-2.5 py-0.5 rounded-lg font-mono bg-emerald-50">
                                {coupon.code}
                              </span>
                            </div>

                            {qualifies && calculatedSavings > 0 && (
                              <p className="text-xs font-black text-emerald-700 flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Save ₹{calculatedSavings} on this order!</span>
                              </p>
                            )}
                          </div>

                          {/* Action Button */}
                          {isApplied ? (
                            <button
                              type="button"
                              onClick={handleRemovePromo}
                              className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs rounded-xl flex items-center gap-1 hover:bg-emerald-200 transition-all shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" /> APPLIED
                            </button>
                          ) : isExpired ? (
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl shrink-0">
                              EXPIRED
                            </span>
                          ) : qualifies ? (
                            <button
                              type="button"
                              onClick={() => handleApplySelectedPromo(coupon)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                            >
                              APPLY
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-3 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-xl shrink-0 cursor-not-allowed"
                            >
                              ADD ₹{shortBy} MORE
                            </button>
                          )}
                        </div>

                        {/* Description */}
                        {coupon.description && (
                          <p className="text-xs font-semibold text-slate-700 leading-snug">
                            {coupon.description}
                          </p>
                        )}

                        {/* Dynamic min-order progress warning */}
                        {!qualifies && !isExpired && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-950 font-bold">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Add items worth <b className="text-amber-900 underline font-black">₹{shortBy}</b> more to unlock this coupon!</span>
                          </div>
                        )}

                        {/* Terms & Conditions Section (Blinkit Style) */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                            Terms & Conditions
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium">

                            {/* Min Order Condition */}
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>Min Order: <b className="text-slate-900 font-bold">₹{minOrder}</b></span>
                            </div>

                            {/* Validity Date Condition */}
                            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>
                                {coupon.valid_till
                                  ? `Valid till ${new Date(coupon.valid_till).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                  : 'No Expiry Date'}
                              </span>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* Center Aligned Notification Permission Prompt */}
      {showCartNotifPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative border border-slate-100 flex flex-col items-center text-center">
            
            <button 
              onClick={handleDismissCartNotif}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 mt-2 animate-bounce-slow">
              <BellRing className="w-8 h-8" />
            </div>
            
            <h3 className="font-black text-slate-900 text-xl tracking-tight mb-2">Enable Notifications?</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed px-2">
              So we can instantly alert you exactly when your food is hot, ready, and waiting for pickup.
            </p>
            
            <div className="flex w-full gap-3">
              <button
                onClick={handleDismissCartNotif}
                className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm py-3.5 rounded-xl transition-all"
              >
                Maybe Later
              </button>
              <button
                onClick={handleAllowCartNotif}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-emerald-200"
              >
                Yes, Notify Me
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

