import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Ticket, Flame, Sparkles, Copy, Check, Zap } from 'lucide-react';

export default function FloatingCouponBanner() {
  const { setAppliedPromo, showToast } = useAuth();
  const [promos, setPromos] = useState([]);
  const [offers, setOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const [promoRes, offerRes] = await Promise.all([
        supabase.from('promo_codes').select('*').eq('is_active', true),
        supabase.from('offers').select('*').eq('is_active', true).limit(3)
      ]);
      setPromos(promoRes.data || []);
      setOffers(offerRes.data || []);
    } catch (e) {
      console.error('Banner deals fetch error:', e);
    }
  };

  const handleCopy = (promo) => {
    try {
      navigator.clipboard.writeText(promo.code);
    } catch (e) {
      // Fallback
    }

    setAppliedPromo(promo);
    setCopiedCode(promo.code);
    showToast(`🎉 Coupon ${promo.code} applied! ${promo.discount_percent}% OFF saved to cart.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (promos.length === 0 && offers.length === 0) return null;

  return (
    <div className="relative z-30 max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-1">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-2.5 sm:p-3 shadow-lg shadow-emerald-900/10 border border-emerald-500/30 backdrop-blur-md">
        
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

          {/* Marquee Ticker Container (Pause on Hover) */}
          <div className="overflow-hidden flex-1 relative py-0.5">
            <div className="flex items-center gap-4 animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
              
              {/* Promo Coupon Cards */}
              {[...promos, ...promos].map((p, idx) => {
                const isCopied = copiedCode === p.code;
                return (
                  <div
                    key={`promo-${p.id}-${idx}`}
                    onClick={() => handleCopy(p)}
                    className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border shrink-0 group ${
                      isCopied
                        ? 'bg-yellow-400 text-slate-950 border-yellow-300 font-extrabold scale-105 shadow-md'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/70 border-emerald-400/30 hover:border-emerald-300 text-white shadow-xs'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-yellow-400/20 group-hover:bg-yellow-400/30 flex items-center justify-center text-yellow-300 shrink-0">
                      <Ticket className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span>Get</span>
                      <span className="bg-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md text-[11px] shadow-2xs">
                        {p.discount_percent}% OFF
                      </span>
                      <span>with</span>
                      <span className="font-black text-yellow-300 uppercase tracking-wider font-mono">
                        {p.code}
                      </span>
                    </div>

                    {isCopied ? (
                      <span className="text-[10px] bg-slate-950 text-yellow-400 font-black px-2 py-0.5 rounded-lg flex items-center gap-1 animate-bounce">
                        <Check className="w-3 h-3" /> APPLIED!
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 group-hover:bg-yellow-400 group-hover:text-slate-950 text-emerald-200 font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all">
                        <Copy className="w-3 h-3" /> Apply
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Combo Offers */}
              {offers.map((o, idx) => (
                <div
                  key={`offer-${o.id}-${idx}`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 px-3.5 py-1.5 rounded-xl text-amber-100 shrink-0 text-xs font-bold shadow-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0">
                    <Flame className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <span><b>{o.name}:</b> Deal at ₹{o.price}</span>
                  {o.original_price && Number(o.original_price) > Number(o.price) && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-md">
                      SAVE ₹{Number(o.original_price) - Number(o.price)}
                    </span>
                  )}
                </div>
              ))}

            </div>
          </div>

          {/* Right Action Hint */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-black text-emerald-100 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-400/30 shrink-0 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Tap coupon to apply</span>
          </div>

        </div>
      </div>
    </div>
  );
}
