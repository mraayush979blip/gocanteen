import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, RefreshCw, KeyRound, 
  XCircle, ChevronDown, ChevronUp, Sparkles, Zap, Calendar
} from 'lucide-react';
import CancelOrderModal from '../../components/CancelOrderModal';
import { getOrderFinancials, getCancellationReason } from '../../lib/orderUtils';

export default function CustomerOrders({ onOpenAuth }) {
  const { user, profile, showToast } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active' | 'today' | 'all'
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Cancellation Modal state for customer
  const [cancelModalOrder, setCancelModalOrder] = useState(null);

  useEffect(() => {
    if (!user) return;

    fetchUserOrders();

    const channel = supabase
      .channel(`customer-orders-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `customer_id=eq.${user.id}`
      }, (payload) => {
        fetchUserOrders();
        if (payload.eventType === 'UPDATE' && payload.new.status === 'ready') {
          showToast(`🎉 Order #${payload.new.token_number || payload.new.id.slice(0, 4)} is READY for pickup!`);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const fetchUserOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, item_name, inventory(name, emoji))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      if (data && data.length > 0 && !expandedOrderId) {
        setExpandedOrderId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCancelOrder = async (cancelReason) => {
    if (!cancelModalOrder) return;
    try {
      const order = cancelModalOrder;
      const customerName = profile?.full_name || order.customer_name || 'Customer';
      const cancellationTag = `❌ Cancelled Reason: ${cancelReason} (by Customer ${customerName})`;
      let updatedNotes = order.special_instructions ? `${order.special_instructions} | ${cancellationTag}` : cancellationTag;

      const baseUpdate = {
        status: 'cancelled',
        cancellation_reason: cancelReason,
        refund_status: 'none',
        special_instructions: updatedNotes,
        handled_by_name: `${customerName} (STUDENT)`
      };

      const { error } = await supabase
        .from('orders')
        .update(baseUpdate)
        .eq('id', order.id);

      if (error) {
        delete baseUpdate.cancellation_reason;
        delete baseUpdate.refund_status;
        const { error: fbErr } = await supabase
          .from('orders')
          .update(baseUpdate)
          .eq('id', order.id);
        if (fbErr) throw fbErr;
      }

      showToast('✓ Order cancelled successfully');
      setCancelModalOrder(null);
      fetchUserOrders();
    } catch (err) {
      showToast('Failed to cancel order: ' + err.message, true);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { label: '⏳ Pending', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'preparing':
        return { label: '👨‍🍳 Preparing', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'ready':
        return { label: '✅ Ready for Pickup', bg: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-extrabold animate-pulse' };
      case 'completed':
        return { label: '🎉 Handover Complete', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'cancelled':
        return { label: '✕ Cancelled', bg: 'bg-red-100 text-red-800 border-red-300' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">Sign in to view your orders</h2>
        <p className="text-xs text-slate-500 font-medium">
          Track live canteen preparation, token numbers, and pickup security PINs.
        </p>
        <button
          onClick={onOpenAuth}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Sign In / Sign Up</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading your order tokens...</span>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
  const todayOrders = orders.filter(o => isToday(o.created_at));

  const activeOrdersCount = activeOrders.length;
  const todayOrdersCount = todayOrders.length;

  let filteredOrders = orders;
  if (filter === 'active') {
    filteredOrders = activeOrders.length > 0 ? activeOrders : orders;
  } else if (filter === 'today') {
    filteredOrders = todayOrders;
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-20 text-slate-900">
      
      {/* 1. Header & Live Indicator */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">My Orders & Tokens</h1>
            {activeOrdersCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                {activeOrdersCount} ACTIVE
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Real-time status updates from canteen kitchen</p>
        </div>

        <button
          onClick={fetchUserOrders}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all shrink-0"
          title="Refresh Orders"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilter('active')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all flex items-center gap-1.5 ${
            filter === 'active'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-yellow-300" />
          <span>Active Orders ({activeOrdersCount})</span>
        </button>

        <button
          onClick={() => setFilter('today')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all flex items-center gap-1.5 ${
            filter === 'today'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Today ({todayOrdersCount})</span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>All History ({orders.length})</span>
        </button>
      </div>

      {/* 3. Compact Informative Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-14 bg-white border border-slate-200 rounded-3xl p-6 space-y-2 shadow-2xs">
          <span className="text-4xl">📦</span>
          <h3 className="text-sm font-extrabold text-slate-900">No orders found</h3>
          <p className="text-xs text-slate-500">
            {filter === 'active' 
              ? "You have no active orders right now." 
              : filter === 'today' 
                ? "No orders placed today." 
                : "Your order history is empty."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const badge = getStatusBadge(order.status);
            const orderIsToday = isToday(order.created_at);
            const { subtotal, discount, finalAmount, couponCode } = getOrderFinancials(order);

            const itemsList = order.order_items || [];
            const summaryText = itemsList.map(i => `${i.quantity}x ${i.inventory?.name || i.item_name || 'Item'}`).join(', ');

            // Customer self-cancellation eligibility
            const isUnpaidPending = order.payment_status !== 'paid' && order.status === 'pending';
            const cancellationReasonText = getCancellationReason(order);

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-2xl transition-all shadow-2xs overflow-hidden ${
                  orderIsToday ? 'border-slate-300' : 'border-slate-200 opacity-90'
                }`}
              >
                {/* COMPACT CARD HEADER */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/80 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    
                    {/* Left: Token Number & Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono">
                        Token #{order.token_number || order.id.slice(0, 4)}
                      </span>

                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Right: Price & Expand Arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-slate-900">₹{finalAmount}</span>
                        {discount > 0 && (
                          <span className="text-[10px] text-emerald-600 font-bold block -mt-0.5">Saved ₹{discount}</span>
                        )}
                      </div>

                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                  </div>

                  {/* Middle Row: Items Summary & Pickup Security PIN */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <p className="text-slate-600 font-bold truncate flex-1">
                      {summaryText || 'Food order items'}
                    </p>

                    {order.status === 'cancelled' ? (
                      <span className="text-[11px] font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-md border border-red-300 shrink-0">
                        ❌ Reason: {cancellationReasonText}
                      </span>
                    ) : order.pickup_code ? (
                      <span className="text-[11px] font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0">
                        🔑 PIN: {order.pickup_code}
                      </span>
                    ) : null}
                  </div>

                  {/* Bottom Meta Row */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-100">
                    <span>
                      {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {order.payment_method?.toUpperCase() || 'CASH'} ({order.payment_status?.toUpperCase()})
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {isExpanded ? 'Tap to close ▲' : 'Tap for details ▼'}
                    </span>
                  </div>
                </div>

                {/* EXPANDABLE DETAILS SECTION */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-4 animate-fade-in text-xs">
                    
                    {/* Security Pickup PIN Banner */}
                    {order.pickup_code && order.status !== 'cancelled' && (
                      <div className="bg-purple-500/10 border border-purple-200 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-5 h-5 text-purple-600 shrink-0" />
                          <div>
                            <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider">Pickup Security PIN</span>
                            <p className="text-[11px] text-slate-600">Show this PIN to counter staff when collecting food</p>
                          </div>
                        </div>
                        <span className="text-xl font-black text-purple-900 tracking-widest font-mono bg-white px-3 py-1 rounded-lg border border-purple-200 shadow-2xs">
                          {order.pickup_code}
                        </span>
                      </div>
                    )}

                    {/* Cancellation Reason Banner */}
                    {order.status === 'cancelled' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-900 font-medium">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold uppercase block text-[10px] text-red-700">Cancellation Reason</span>
                          <p className="font-bold text-slate-900">
                            {cancellationReasonText}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Customer Self-Service Cancel Button for Unpaid Pending Orders */}
                    {isUnpaidPending ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelModalOrder(order);
                        }}
                        className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Cancel My Unpaid Order</span>
                      </button>
                    ) : order.payment_status !== 'paid' && order.status !== 'cancelled' ? (
                      <p className="text-[10px] text-slate-400 font-bold text-center italic">
                        🔒 Food preparation started or cash confirmed. Order cannot be cancelled.
                      </p>
                    ) : null}

                    {/* Progress Bar Timeline */}
                    {['pending', 'preparing', 'ready', 'completed'].includes(order.status) && (
                      <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Live Order Status</span>
                        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                          <div className={['pending', 'preparing', 'ready', 'completed'].includes(order.status) ? 'text-amber-600' : 'text-slate-400'}>
                            Placed
                          </div>
                          <div className={['preparing', 'ready', 'completed'].includes(order.status) ? 'text-blue-600' : 'text-slate-400'}>
                            Preparing 👨‍🍳
                          </div>
                          <div className={['ready', 'completed'].includes(order.status) ? 'text-emerald-700 font-extrabold' : 'text-slate-400'}>
                            Ready ✅
                          </div>
                          <div className={order.status === 'completed' ? 'text-slate-600' : 'text-slate-400'}>
                            Picked Up 🎉
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 mt-1">
                          <div
                            className={`h-full transition-all duration-500 ${
                              order.status === 'pending' ? 'w-1/4 bg-amber-500' :
                              order.status === 'preparing' ? 'w-2/4 bg-blue-500' :
                              order.status === 'ready' ? 'w-3/4 bg-emerald-600 animate-pulse' :
                              'w-full bg-slate-500'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Itemized Order Breakdown */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Itemized Breakdown</span>
                      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 font-black text-xs">{item.quantity}x</span>
                              <span className="text-base">{item.inventory?.emoji || '🍽️'}</span>
                              <span className="font-bold text-slate-900">{item.inventory?.name || item.item_name}</span>
                            </div>
                            <span className="font-extrabold text-slate-700">₹{(Number(item.price_at_time) || 0) * (Number(item.quantity) || 1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment & Coupon Details */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-bold text-slate-900">₹{subtotal}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Discount Coupon ({couponCode})</span>
                          <span>-₹{discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100 text-xs">
                        <span>Total Payable</span>
                        <span className="text-emerald-700">₹{finalAmount}</span>
                      </div>
                      <div className="pt-1 text-[10px] text-slate-400 font-medium">
                        Payment via <b>{order.payment_method?.toUpperCase()}</b> ({order.payment_status?.toUpperCase()})
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Reason Modal for Customer */}
      <CancelOrderModal
        isOpen={!!cancelModalOrder}
        order={cancelModalOrder}
        onConfirm={handleCustomerCancelOrder}
        onClose={() => setCancelModalOrder(null)}
      />

    </div>
  );
}
