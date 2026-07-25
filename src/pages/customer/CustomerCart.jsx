import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  X, Trash2, Plus, Minus, Ticket, Smartphone, DollarSign, ArrowRight, Loader2, Sparkles, CheckCircle2, LogIn, KeyRound, CreditCard, ShieldCheck, Save, Bookmark, Info, Calendar, ChevronRight, AlertCircle, Copy, Tag, Check, Gift
} from 'lucide-react';

export default function CustomerCart({ isOpen, onClose, onOpenAuth, onOrderPlaced }) {
  const { cart, updateCartQty, removeFromCart, clearCart, session, profile, fetchProfile, showToast, appliedPromo, setAppliedPromo } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saveToProfileOption, setSaveToProfileOption] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cash'
  const [notes, setNotes] = useState('');

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);

  const [placingOrder, setPlacingOrder] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState(null);
  const [confirmedCode, setConfirmedCode] = useState(null);

  // Fetch active available coupons
  const fetchAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAvailableCoupons(data);
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

  // Window anti-exit listener during payment execution (Must be declared before any conditional return)
  useEffect(() => {
    if (placingOrder) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Payment is processing. Closing this page will interrupt your transaction!';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [placingOrder]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
  let discountPercent = 0;
  if (appliedPromo) {
    discountPercent = Number(appliedPromo.discount_percent || appliedPromo.discount || 0);
  }
  const discountAmt = Math.round((subtotal * discountPercent) / 100);
  const amountAfterDiscount = Math.max(0, subtotal - discountAmt);
  const isOnlinePayment = paymentMethod === 'razorpay';
  const platformFee = isOnlinePayment ? Number((amountAfterDiscount * 0.0236).toFixed(2)) : 0;
  const finalPayableAmount = Number((amountAfterDiscount + platformFee).toFixed(2));

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

      if (data.max_uses && data.current_uses >= data.max_uses) {
        setPromoError('Coupon code usage limit reached');
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

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      showToast(`Coupon ${coupon.code} usage limit reached`, true);
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
        const { data: maxTokenData } = await supabase
          .from('orders')
          .select('token_number')
          .order('token_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (maxTokenData?.token_number && !isNaN(Number(maxTokenData.token_number))) {
          tokenNumber = Number(maxTokenData.token_number) + 1;
        }
      } catch (e) {
        console.warn('Max token fetch error, fallback:', e);
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

      const basePayload = {
        id: orderId,
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
        razorpay_payment_id: paymentId || ''
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
        inventory_id: typeof i.id === 'string' && i.id.length > 20 ? i.id : null,
        item_name: i.name,
        quantity: i.qty,
        price_at_time: i.price
      }));

      await supabase.from('order_items').insert(orderItemsPayload);

      if (appliedPromo) {
        try {
          await supabase
            .from('promo_codes')
            .update({ current_uses: (appliedPromo.current_uses || 0) + 1 })
            .eq('id', appliedPromo.id);
        } catch (e) {
          console.warn('Could not increment promo_codes current_uses:', e);
        }
      }

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

  const handlePlaceOrder = async () => {
    let hasErr = false;
    if (!customerName.trim()) {
      setNameError('Full name is strictly required');
      hasErr = true;
    }
    if (!phone.trim()) {
      setPhoneError('Mobile phone number is strictly required');
      hasErr = true;
    }

    if (hasErr) {
      showToast('Please fill in all mandatory fields (*)', true);
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
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_THIkRDo41sOum4';

      if (typeof window.Razorpay === 'undefined') {
        showToast('Razorpay SDK loading... Please wait a moment.', true);
        return;
      }

      setPlacingOrder(true);

      const options = {
        key: razorpayKey,
        amount: Math.round(finalPayableAmount * 100),
        currency: 'INR',
        name: 'Go Canteen',
        description: `Food Order (${cart.length} items)`,
        image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
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
          color: '#0c831f'
        },
        handler: function (response) {
          if (!response || !response.razorpay_payment_id) {
            setPlacingOrder(false);
            showToast('❌ Invalid Payment Response from Razorpay. Transaction failed.', true);
            return;
          }
          executeOrderPlacement({
            paymentStatus: 'paid',
            paymentId: response.razorpay_payment_id,
            pMethod: 'razorpay_upi'
          });
        },
        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
            showToast('Payment window closed. Order was not placed.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setPlacingOrder(false);
        showToast(`Payment Failed: ${response.error.description}`, true);
      });
      rzp.open();
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
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in text-slate-900" onClick={handleSafeClose}>
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        
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
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:outline-none transition-all ${
                          nameError ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-emerald-600'
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
                          setPhone(e.target.value);
                          if (e.target.value.trim()) setPhoneError('');
                        }}
                        placeholder="Enter mobile number (+91...)"
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-slate-900 text-xs focus:outline-none transition-all ${
                          phoneError ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-emerald-600'
                        }`}
                      />
                      {phoneError && <span className="text-[10px] text-red-500 font-bold block mt-1">{phoneError}</span>}
                    </div>

                    {/* Auto-Save to Profile Checkbox - Only shown if contact details NOT saved in profile yet */}
                    {!isProfileSaved && session && (
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
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'razorpay', label: 'UPI Instant Pay', subtitle: 'Scan QR Code • GPay • PhonePe', icon: Smartphone, badge: 'QR & UPI ⚡' },
                        { id: 'cash', label: 'Cash at Counter', subtitle: 'Pay when picking up', icon: DollarSign, badge: 'Pay Later' }
                      ].map(method => {
                        const Icon = method.icon;
                        const isSelected = paymentMethod === method.id;
                        return (
                          <div
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-1 relative ${
                              isSelected
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
                  disabled={placingOrder}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing Order...</span>
                    </>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  const isExpired = coupon.valid_till && new Date(coupon.valid_till) < new Date();

                  return (
                    <div
                      key={coupon.id}
                      className={`bg-white border rounded-2xl overflow-hidden shadow-xs transition-all relative ${
                        isApplied
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

    </div>
  );
}

