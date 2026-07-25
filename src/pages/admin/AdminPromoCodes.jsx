import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, X, Loader2, Save, Calendar, Ticket, CheckCircle2, Clock } from 'lucide-react';

export default function AdminPromoCodes() {
  const { showToast } = useAuth();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    min_order_amount: '',
    max_uses: '',
    valid_till: '',
    description: ''
  });

  useEffect(() => {
    fetchPromos();

    const channel = supabase
      .channel('admin-promos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPromos();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promo_codes' }, () => {
        fetchPromos();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchPromos = async () => {
    try {
      const [promoRes, orderRes] = await Promise.all([
        supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*')
      ]);

      if (promoRes.error) console.error('Promo fetch error:', promoRes.error);
      if (orderRes.error) console.error('Orders fetch error:', orderRes.error);

      const allPromos = promoRes.data || [];
      const allOrders = orderRes.data || [];

      // Calculate actual real-time redemptions from orders table for 100% accuracy
      const processedPromos = allPromos.map(p => {
        const pCode = (p.code || '').trim().toUpperCase();

        const countFromOrders = allOrders.filter(o => {
          // 1. Direct match on coupon_code / promo_code column if present
          if (o.coupon_code && o.coupon_code.toString().trim().toUpperCase() === pCode) return true;
          if (o.promo_code && o.promo_code.toString().trim().toUpperCase() === pCode) return true;

          // 2. Fallback check inside special_instructions
          if (o.special_instructions) {
            const instrUpper = o.special_instructions.toUpperCase();
            if (instrUpper.includes(pCode)) return true;
          }
          return false;
        }).length;

        const effectiveUses = Math.max(Number(p.current_uses || 0), countFromOrders);

        return {
          ...p,
          calculated_uses: effectiveUses
        };
      });

      setPromos(processedPromos);
    } catch (err) {
      console.error('Promo codes fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const code = formData.code.trim().toUpperCase();
    if (!code || !formData.discount_percent) {
      showToast('Coupon code and discount % are required', true);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code,
        discount_percent: Number(formData.discount_percent),
        min_order_amount: formData.min_order_amount ? Number(formData.min_order_amount) : 0,
        max_uses: formData.max_uses ? Number(formData.max_uses) : null,
        is_active: true
      };

      if (formData.valid_till) {
        payload.valid_till = new Date(formData.valid_till).toISOString();
      }
      if (formData.description) {
        payload.description = formData.description.trim();
      }

      const { error } = await supabase.from('promo_codes').insert([payload]);

      if (error) throw error;
      showToast(`✓ Coupon ${code} created!`);
      setModalOpen(false);
      setFormData({
        code: '',
        discount_percent: '',
        min_order_amount: '',
        max_uses: '',
        valid_till: '',
        description: ''
      });
      fetchPromos();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const { error } = await supabase.from('promo_codes').delete().eq('id', id);
      if (error) throw error;
      showToast('Coupon deleted');
      fetchPromos();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading coupons...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Promo Coupons & Discounts</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage discount codes and validity dates for customer checkout</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Coupon
        </button>
      </div>

      {/* Coupons List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promos.map(promo => {
          const isExpired = promo.valid_till && new Date(promo.valid_till) < new Date();

          return (
            <div
              key={promo.id}
              className={`bg-white border rounded-3xl p-5 space-y-3 shadow-2xs relative ${
                isExpired ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 uppercase tracking-wide">
                    🎟️ {promo.code}
                  </span>
                  {isExpired ? (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                      EXPIRED ⌛
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      ACTIVE ✓
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(promo.id, promo.code)}
                  className="p-2 rounded-xl bg-slate-100 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete Coupon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 text-xs text-slate-700 font-bold">
                <div className="text-emerald-700 font-extrabold text-sm">
                  {promo.discount_percent}% OFF <span className="text-slate-500 text-xs font-semibold">• Min Order ₹{promo.min_order_amount || 0}</span>
                </div>
                {promo.description && (
                  <p className="text-[11px] text-slate-500 font-medium">{promo.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-100">
                <span>Total Redemptions: <b className="text-purple-700 font-extrabold">{promo.calculated_uses ?? promo.current_uses ?? 0} / {promo.max_uses || '∞'}</b></span>
                {promo.valid_till && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Valid Till: {new Date(promo.valid_till).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-slate-900">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">Create New Promo Coupon</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. WELCOME10"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold uppercase focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={formData.discount_percent}
                    onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    placeholder="199"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Usage Limit</label>
                  <input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited if empty"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valid Till Date</label>
                  <input
                    type="date"
                    value={formData.valid_till}
                    onChange={(e) => setFormData({ ...formData, valid_till: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Note / Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 10% OFF on orders above ₹100"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Publish Coupon Code
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
