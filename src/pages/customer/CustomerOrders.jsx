import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, RefreshCw, KeyRound, 
  XCircle, ChevronDown, ChevronUp, Sparkles, Zap, Calendar
} from 'lucide-react';
import CancelOrderModal from '../../components/CancelOrderModal';
import { getOrderFinancials, getCancellationReason, getOrderPin, getUserSpecialInstructions, getOrderId } from '../../lib/orderUtils';

export default function CustomerOrders({ onOpenAuth }) {

  const { user, profile, showToast } = useAuth();
  // Pre-load from offline cache to prevent loading states on page open
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`cg-cache-orders-${user?.id}`) || '[]');
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem(`cg-cache-orders-${user?.id}`);
      return !cached || JSON.parse(cached).length === 0;
    } catch (e) {
      return true;
    }
  });
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
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, item_name, inventory(name, emoji))')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const activeOrders = data || [];
      
      // Auto-cancel check for unpaid cash orders past 11:59 PM
      const now = new Date();
      if (now.getHours() >= 23 && now.getMinutes() >= 59) {
        const staleOrders = activeOrders.filter(o => o.payment_method === 'cash' && o.payment_status === 'unpaid' && !['cancelled', 'completed', 'delivered'].includes(o.status));
        if (staleOrders.length > 0) {
          const cancelReason = "System cancelled automatically: Customer had not done the payment till the closing of canteen";
          for (const o of staleOrders) {
            const updatedNotes = o.special_instructions ? `${o.special_instructions} | ❌ ${cancelReason}` : `❌ ${cancelReason}`;
            supabase.from('orders').update({
              status: 'cancelled',
              cancellation_reason: cancelReason,
              special_instructions: updatedNotes
            }).eq('id', o.id).then(({error: updateErr}) => {
              if (updateErr) {
                supabase.from('orders').update({
                  status: 'cancelled',
                  special_instructions: updatedNotes
                }).eq('id', o.id).then();
              }
            });
          }
        }
      }

      setOrders(activeOrders);
      localStorage.setItem(`cg-cache-orders-${user.id}`, JSON.stringify(data || []));

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
      const isPaid = order.payment_status === 'paid';
      const refundStatusValue = isPaid ? 'requested' : 'none';

      const baseUpdate = {
        status: 'cancelled',
        cancellation_reason: cancelReason,
        refund_status: refundStatusValue,
        handled_by_name: `Customer (${customerName})`
      };

      const { error } = await supabase
        .from('orders')
        .update(baseUpdate)
        .eq('id', order.id);

      if (error) {
        console.warn('DB update fallback for customer cancellation:', error.message);
        delete baseUpdate.cancellation_reason;
        delete baseUpdate.refund_status;
        const { error: fbErr } = await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            handled_by_name: `Customer (${customerName})`
          })
          .eq('id', order.id);
        if (fbErr) throw fbErr;
      }

      showToast(isPaid ? '✓ Order cancelled. Refund application sent to Canteen Admin (5-7 Days)' : '✓ Order cancelled successfully');
      setCancelModalOrder(null);
      fetchUserOrders();
    } catch (err) {
      showToast('Failed to cancel order: ' + err.message, true);
    }
  };



  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-amber-50 text-amber-800 border-amber-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            <span>Pending</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-blue-50 text-blue-800 border-blue-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span>Preparing 👨‍🍳</span>
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
            </span>
            <span>Ready for Pickup ✅</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-slate-50 text-slate-600 border-slate-200">
            <span>Handover Complete 🎉</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-red-50 text-red-800 border-red-200">
            <span>Cancelled ✕</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border bg-slate-50 text-slate-600 border-slate-200">
            <span>{status}</span>
          </span>
        );
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
    filteredOrders = activeOrders;
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
            const orderIsToday = isToday(order.created_at);
            const { subtotal, discount, foodSalesAmount, platformFee, customerPaid, couponCode } = getOrderFinancials(order);

            const itemsList = order.order_items || [];
            const summaryText = itemsList.map(i => `${i.quantity}x ${i.inventory?.name || i.item_name || 'Item'}`).join(', ');

            const pin = getOrderPin(order);
            const orderIdStr = getOrderId(order);
            const isPaidOnline = order.payment_status === 'paid' || (order.payment_method || '').toLowerCase().includes('upi') || (order.payment_method || '').toLowerCase().includes('razorpay');
            const isCashOrder = (order.payment_method || '').toLowerCase().includes('cash') || order.payment_status !== 'paid';

            // Customers can ONLY cancel CASH orders when status is strictly 'pending' (before cooking starts)
            const canCustomerCancel = isCashOrder && !isPaidOnline && order.status === 'pending';

            const cancellationReasonText = getCancellationReason(order);
            const cleanUserNotes = getUserSpecialInstructions(order.special_instructions);


            return (
              <div
                key={order.id}
                className={`bg-white border rounded-2xl transition-all shadow-2xs overflow-hidden ${
                  orderIsToday ? 'border-slate-300' : 'border-slate-200 opacity-90'
                }`}
              >
                {/* UNPAID CASH WARNING */}
                {isCashOrder && order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
                  <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-2">
                    <p className="text-amber-800 text-xs font-bold flex items-center gap-1.5 leading-snug">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      Please pay at the counter. Your order will not be prepared until payment is received.
                    </p>
                  </div>
                )}

                {/* COMPACT CARD HEADER */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/80 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    
                    {/* Left: Token Number, Order ID & Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono">
                        Token #{order.token_number || order.id.slice(0, 4)}
                      </span>

                      {orderIdStr && (
                        <span className="text-xs font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 font-mono">
                          🆔 {orderIdStr}
                        </span>
                      )}

                      {renderStatusBadge(order.status)}
                    </div>

                    {/* Right: Price & Expand Arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-black text-slate-900">₹{customerPaid}</span>
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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Emoji Preview Stack */}
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        {itemsList.slice(0, 3).map((item, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-2xs">
                            <span className="text-xs">{item.inventory?.emoji || '🍽️'}</span>
                          </div>
                        ))}
                        {itemsList.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center shadow-2xs">
                            <span className="text-[8px] font-black text-slate-600">+{itemsList.length - 3}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-slate-600 font-bold truncate">
                        {summaryText || 'Food order items'}
                      </p>
                    </div>

                    {order.status === 'cancelled' ? (
                      <span className="text-[11px] font-black text-red-800 bg-red-100 px-2 py-0.5 rounded-md border border-red-300 shrink-0">
                        ❌ Reason: {cancellationReasonText}
                      </span>
                    ) : pin ? (
                      <span className="text-[11px] font-black text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-md border border-purple-300 shrink-0 font-mono shadow-2xs">
                        🔑 PIN: {pin}
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
                    {pin && order.status !== 'cancelled' && (
                      <div className="bg-purple-500/10 border border-purple-200 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-5 h-5 text-purple-600 shrink-0" />
                          <div>
                            <span className="text-[10px] font-black uppercase text-purple-900 tracking-wider">Pickup Security PIN</span>
                            <p className="text-[11px] text-slate-600">Show this PIN to counter staff when collecting food</p>
                          </div>
                        </div>
                        <span className="text-xl font-black text-purple-900 tracking-widest font-mono bg-white px-3 py-1 rounded-lg border border-purple-200 shadow-2xs">
                          {pin}
                        </span>
                      </div>
                    )}

                    {/* Cancellation Reason Banner with Refund Support Contact */}
                    {order.status === 'cancelled' && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-2 text-xs text-red-950 font-medium">
                        <div className="flex items-center gap-2 text-red-700 font-black">
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Order Cancelled</span>
                        </div>
                        <p className="font-bold text-slate-900">
                          Reason: {cancellationReasonText}
                        </p>

                        {order.refund_status === 'refunded' ? (
                          // ✅ Refund has been processed — show confirmation
                          <div className="mt-1 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-[11px] space-y-1">
                            <span className="font-black text-emerald-800 block">✅ Refund Processed</span>
                            <p className="text-emerald-700 leading-relaxed">
                              Your refund has been processed by the canteen admin. The amount will reflect in your original payment method within <b>5–7 working days</b>.
                            </p>
                          </div>
                        ) : order.payment_status === 'paid' ? (
                          // 💸 Paid but not yet refunded — show support contact
                          <div className="mt-2 p-2.5 bg-white border border-red-200 rounded-xl text-[11px] text-slate-700 space-y-1">
                            <span className="font-black text-amber-800 block">💸 Refund Requested — Pending Admin Processing</span>
                            <p className="leading-relaxed">
                              For refund queries or support, please call/WhatsApp Canteen Admin at{' '}
                              <a href="tel:+919244217287" className="font-extrabold text-indigo-600 hover:underline">+91 92442 17287</a>{' '}
                              with your <b>Order ID ({orderIdStr})</b> &amp; Token #{order.token_number || order.id.slice(0, 4)}.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Customer Special Instruction Notes if present */}
                    {cleanUserNotes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-900 font-bold">
                        📝 Special Request: {cleanUserNotes}
                      </div>
                    )}

                    {/* Customer Self-Service Cancel Button for Pending Orders */}
                    {canCustomerCancel ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelModalOrder(order);
                        }}
                        className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Cancel Cash Order</span>
                      </button>
                    ) : order.status !== 'cancelled' ? (
                      isPaidOnline ? (
                        <div className="p-3 bg-slate-100/90 border border-slate-200 rounded-xl text-center text-[11px] text-slate-600 font-bold space-y-0.5">
                          <p>🔒 Online / UPI paid orders cannot be self-cancelled.</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Contact Canteen Counter (<a href="tel:+919244217287" className="text-indigo-600 font-extrabold hover:underline">+91 9244217287</a>) for assistance.
                          </p>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold text-center italic">
                          🔒 Food preparation started or completed. Order cannot be cancelled.
                        </p>
                      )
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
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Itemized Breakdown</span>
                      <div className="space-y-2">
                        {order.order_items?.map((item, idx) => {
                          const itemTotal = (Number(item.price_at_time) || 0) * (Number(item.quantity) || 1);
                          const emoji = item.inventory?.emoji || '🍽️';
                          const gradients = [
                            'from-amber-50 to-orange-50 border-amber-200/80',
                            'from-emerald-50 to-teal-50 border-emerald-200/80',
                            'from-violet-50 to-purple-50 border-violet-200/80',
                            'from-sky-50 to-blue-50 border-sky-200/80',
                            'from-rose-50 to-pink-50 border-rose-200/80',
                            'from-lime-50 to-green-50 border-lime-200/80',
                          ];
                          const gradient = gradients[idx % gradients.length];
                          return (
                            <div key={idx} className={`bg-gradient-to-r ${gradient} border rounded-2xl p-3 flex items-center gap-3 transition-all hover:shadow-sm`}>
                              {/* Emoji Container */}
                              <div className="relative shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-white/80 border border-white shadow-sm flex items-center justify-center backdrop-blur-sm">
                                  <span className="text-2xl drop-shadow-sm">{emoji}</span>
                                </div>
                                {/* Quantity Badge */}
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm ring-2 ring-white">
                                  {item.quantity}
                                </span>
                              </div>

                              {/* Item Details */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">
                                  {item.inventory?.name || item.item_name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-bold text-slate-500">
                                    ₹{item.price_at_time} × {item.quantity}
                                  </span>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="shrink-0 text-right">
                                <span className="text-sm font-black text-slate-900">₹{itemTotal}</span>
                              </div>
                            </div>
                          );
                        })}
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
                      {platformFee > 0 && (
                        <div className="flex justify-between text-amber-900 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <span>Platform Fee (UPI/Online)</span>
                          <span>+₹{platformFee}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100 text-xs">
                        <span>Total Paid</span>
                        <span className="text-emerald-700">₹{customerPaid}</span>
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
        isCustomer={true}
        onConfirm={handleCustomerCancelOrder}
        onClose={() => setCancelModalOrder(null)}
      />

    </div>
  );
}
