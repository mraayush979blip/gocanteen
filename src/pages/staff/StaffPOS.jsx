import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, Plus, Minus, ShoppingCart, CheckCircle2, 
  Banknote, CreditCard, User, AlertCircle, X, ChevronRight, Hash, Receipt
} from 'lucide-react';

export default function StaffPOS() {
  const { selectedOutlet, session, profile, showToast, triggerHaptic } = useAuth();
  const navigate = useNavigate();
  
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'upi'
  const [paymentStatus, setPaymentStatus] = useState('paid'); // 'paid' | 'unpaid'
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [selectedOutlet]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [catRes, invRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('inventory').select('*, categories(name)').order('created_at')
      ]);

      let items = invRes.data || [];
      if (selectedOutlet && items.length > 0) {
        const { data: availData, error: availErr } = await supabase
          .from('inventory_availability')
          .select('item_id, is_available')
          .eq('outlet_id', selectedOutlet);

        if (!availErr && availData) {
          const availMap = {};
          availData.forEach(a => availMap[a.item_id] = a.is_available);
          items = items.map(item => ({
            ...item,
            is_available: availMap[item.id] !== undefined ? availMap[item.id] : item.is_available
          }));
        }
      }

      setCategories(catRes.data || []);
      setInventory(items.filter(item => item.is_available));
    } catch (err) {
      console.error('Error fetching inventory for POS:', err);
      showToast('Failed to load menu items', true);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === 'all' || item.category_id === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventory, searchQuery, activeCategory]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleAddToCart = (item) => {
    triggerHaptic();
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    triggerHaptic();
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const orderId = crypto.randomUUID();
      const uniqueOrderId = 'GC-' + orderId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
      
      let tokenNumber = 1;
      try {
        const { data: rpcToken, error: rpcError } = await supabase.rpc('get_next_token');
        if (!rpcError && rpcToken) {
          tokenNumber = Number(rpcToken);
        } else {
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
      const staffName = profile?.full_name || session?.user?.email || 'Staff';

      const orderPayload = {
        id: orderId,
        order_number: uniqueOrderId,
        customer_name: customerName.trim() || 'Walk-in Customer',
        phone: '',
        status: 'pending',
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        total_amount: subtotal,
        subtotal_amount: subtotal,
        discount_amount: 0,
        platform_fee: 0,
        is_parcel: false,
        parcel_charge: 0,
        token_number: tokenNumber,
        pickup_code: pickupCode,
        special_instructions: `Manual POS Order by ${staffName}`,
        outlet_id: profile?.assigned_outlet_id || selectedOutlet || null,
        handled_by_name: `POS (${staffName})`
      };

      if (session?.user?.id) {
        orderPayload.customer_id = session.user.id; // Or staff ID creating it
      }

      const { error: orderError } = await supabase.from('orders').insert([orderPayload]);
      if (orderError) throw orderError;

      const orderItemsPayload = cart.map(i => ({
        order_id: orderId,
        inventory_id: i.id,
        item_name: i.name,
        quantity: i.qty,
        price_at_time: i.price
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
      if (itemsError) throw itemsError;

      showToast(`🎉 Order Placed! Token #${tokenNumber}`);
      setCart([]);
      setIsCheckoutModalOpen(false);
      setCustomerName('');
      setPaymentMethod('cash');
      setPaymentStatus('paid');
      
      // Redirect to KDS
      navigate('/staff/kds');
      
    } catch (error) {
      console.error('POS Checkout Error:', error);
      showToast('Failed to create order. ' + error.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 p-2 sm:p-4">
      {/* Left Menu Section */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[60vh] lg:h-[80vh]">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              💰
            </div>
            <div>
              <h2 className="font-black text-slate-900 leading-tight">Point of Sale</h2>
              <p className="text-xs text-slate-500 font-medium">Quick order entry</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeCategory === 'all' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeCategory === cat.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.emoji}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {loading ? (
            <div className="flex justify-center py-10"><span className="animate-spin text-2xl">⏳</span></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm font-medium">No items found.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => handleAddToCart(item)}
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 group flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform shadow-sm">
                      {item.emoji || '🍽️'}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{item.name}</h3>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <span className="font-black text-emerald-600">₹{item.price}</span>
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Cart Section */}
      <div className="w-full lg:w-96 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[50vh] lg:h-[80vh] shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-900 text-white">
          <h2 className="font-black text-lg flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
          </h2>
          <p className="text-xs text-slate-400 font-medium">{cart.reduce((sum, i) => sum + i.qty, 0)} items in cart</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center">
              <Receipt className="w-10 h-10 mb-2 opacity-50" />
              Cart is empty.<br/>Tap items to add.
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center shadow-sm">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <span>{item.emoji}</span>
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-emerald-600 font-black text-xs">₹{item.price * item.qty}</div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 shrink-0 border border-slate-200">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 active:scale-90 transition-transform">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-4 text-center font-black text-sm text-slate-900">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 active:scale-90 transition-transform">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-bold">Total Amount</span>
            <span className="text-2xl font-black text-slate-900">₹{subtotal}</span>
          </div>
          <button
            onClick={() => setIsCheckoutModalOpen(true)}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-black shadow-md active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
          >
            Checkout Order <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsCheckoutModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-xl text-slate-900">Confirm Order</h3>
                <p className="text-xs text-slate-500 font-medium">₹{subtotal} • {cart.length} items</p>
              </div>
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" /> Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <Banknote className="w-3.5 h-3.5" /> Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> UPI / QR
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Payment Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('paid')}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      paymentStatus === 'paid' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    ✅ Received Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('unpaid')}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                      paymentStatus === 'unpaid' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    ⏳ Unpaid / Later
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 active:scale-95 transition-all mt-4"
              >
                {isSubmitting ? (
                  <span className="animate-spin text-xl">⏳</span>
                ) : (
                  <>Create Order (₹{subtotal})</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
