import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Ticket, Flame, Sparkles, Copy, Check, Zap } from 'lucide-react';

export default function FloatingCouponBanner() {
  const { showToast } = useAuth();
  const [promos, setPromos] = useState([]);
  const [offers, setOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const [promoRes, offerRes] = await Promise.all([
        supabase.from('promo_codes').select('*').eq('is_active', true).eq('is_secret', false),
        supabase.from('offers').select('*').eq('is_active', true).limit(3)
      ]);
      setPromos(promoRes.data || []);
      setOffers(offerRes.data || []);
    } catch (e) {
      console.error('Banner deals fetch error:', e);
    }
  };

  if (promos.length === 0 && offers.length === 0) return null;

  return (
    <div className="relative z-30 max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-1">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-2.5 sm:p-3 shadow-[0_12px_24px_rgba(0,0,0,0.25),inset_0_2px_4px_rgba(255,255,255,0.4)] border-2 border-b-[6px] border-emerald-800 backdrop-blur-md">
        
        {/* Ambient Glowing Background Effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-400/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          
          {/* Left Tag: Live Deal Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-400/30 text-xs font-black shrink-0 tracking-wide text-yellow-300 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span>LIVE CANTEEN OFFERS</span>
          </div>

          {/* Horizontally Scrollable Container */}
          <div className="overflow-x-auto flex-1 relative py-0.5 scrollbar-none overscroll-x-contain">
            <div className="flex items-center gap-3 whitespace-nowrap min-w-max">
              
              {/* Promo Coupon Cards */}
              {promos.map((p, idx) => (
                <div
                  key={`promo-${p.id}-${idx}`}
                  className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-900/50 text-white shrink-0 shadow-sm snap-start"
                >
                  <div className="w-6 h-6 rounded-lg bg-yellow-400/20 flex items-center justify-center text-yellow-300 shrink-0">
                    <Ticket className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span>Use Code</span>
                    <span className="font-black text-yellow-300 uppercase tracking-wider font-mono">
                      {p.code}
                    </span>
                    <span>for</span>
                    <span className="bg-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md text-[11px] shadow-2xs">
                      {p.discount_percent}% OFF
                    </span>
                  </div>
                </div>
              ))}

              {/* Combo Offers */}
              {offers.map((o, idx) => (
                <div
                  key={`offer-${o.id}-${idx}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-900/50 text-white shrink-0 shadow-sm snap-start"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span className="text-xs font-bold">
                    <b>{o.name}:</b> Deal at ₹{o.price}
                  </span>
                  {o.original_price && Number(o.original_price) > Number(o.price) && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md">
                      SAVE ₹{Number(o.original_price) - Number(o.price)}
                    </span>
                  )}
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
