import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  ChefHat, Clock, CheckCircle2, DollarSign, Loader2, 
  AlertCircle, Ticket, KeyRound, Flame, ArrowRight, RefreshCw, Zap, XCircle
} from 'lucide-react';
import PaymentConfirmModal from '../../components/PaymentConfirmModal';
import CancelOrderModal from '../../components/CancelOrderModal';
import { sendOrderReadyEmail, sendRefundNotificationEmail } from '../../lib/emailNotifier';
import { sendPushNotification } from '../../lib/notificationHelper';
import { getOrderFinancials, getOrderPin, getUserSpecialInstructions, getPaymentId, getOrderId } from '../../lib/orderUtils';
import { playAlertSound, initAudioContext } from '../../lib/audio';

export default function KitchenQueue() {



  const { showToast, profile, session, staffT } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'preparing' | 'ready'

  // Custom Payment Modal state
  const [payModalOrder, setPayModalOrder] = useState(null);
  const [payModalTargetStatus, setPayModalTargetStatus] = useState(null);

  // Cancellation Modal state
  const [cancelModalOrder, setCancelModalOrder] = useState(null);

  // Expanded cards state for clean mobile layout
  const [expandedCards, setExpandedCards] = useState({});
  const toggleCard = (orderId) => {
    setExpandedCards(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const staffIdentifier = profile?.full_name && !profile.full_name.includes('@') ? profile.full_name : 'Kitchen Staff';
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);


  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('staff-kitchen-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (soundEnabledRef.current) {
            playAlertSound();
          }
          showToast('🔔 New Order Received!');
        }
        fetchOrders();
      })
      .subscribe();

    // Backup polling fallback every 20 seconds in case websocket goes to standby mode
    const backupPoll = setInterval(() => {
      fetchOrders();
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(backupPoll);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, item_name, inventory(name, emoji))')
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: true });

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
    } catch (err) {
      console.error('Error fetching kitchen queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (order, newStatus) => {
    // ENFORCE PAYMENT VERIFICATION VIA CUSTOM CENTERED MODAL FOR UNPAID ORDERS
    if (newStatus !== 'cancelled' && order.payment_status !== 'paid') {
      setPayModalOrder(order);
      setPayModalTargetStatus(newStatus);
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          handled_by_name: staffIdentifier,
          handled_by_email: session?.user?.email || profile?.email || ''
        })
        .eq('id', order.id);

      if (error) throw error;
      showToast(`✓ Ticket #${order.token_number || order.id.slice(0,4)} updated to ${newStatus.toUpperCase()}`);

      if (order.customer_id) {
        let title = '';
        let body = '';
        if (newStatus === 'preparing') {
          title = '👨‍🍳 Preparing Order';
          body = `Canteen has started cooking your order (Token #${order.token_number || order.id.slice(0, 4)}).`;
        } else if (newStatus === 'ready') {
          title = '✅ Order Ready for Pickup!';
          body = `Your order is ready! Use Security PIN: ${order.pickup_code || ''} (Token #${order.token_number || order.id.slice(0, 4)}).`;
        } else if (newStatus === 'completed') {
          title = '🎉 Order Delivered!';
          body = `Thank you for ordering with GoCanteen! Your order (Token #${order.token_number || order.id.slice(0, 4)}) has been completed.`;
        }
        if (title && body) {
          sendPushNotification(order.customer_id, order.id, title, body, newStatus);
        }
      }

      if (newStatus === 'ready') {
        sendOrderReadyEmail(order).then(res => {
          if (res.success && res.email) {
            showToast(`📧 Pickup Ready Email sent to ${res.email} (Token #${order.token_number || order.id.slice(0,4)}, PIN ${order.pickup_code || ''})!`);
          }
        });
      }

      fetchOrders();
    } catch (err) {
      showToast('Failed to update status: ' + err.message, true);
    }
  };

  const handleConfirmCancellation = async (cancelReason) => {
    if (!cancelModalOrder) return;

    try {
      const order = cancelModalOrder;
      const isPaidUpi = order.payment_status === 'paid' && (order.payment_method || '').toLowerCase() !== 'cash';
      const refundStatusValue = isPaidUpi ? 'requested' : 'none';

      const cancellationTag = isPaidUpi
        ? `❌ Cancelled Reason: ${cancelReason} (by ${staffIdentifier}) | 💸 Refund Requested (5-7 Days)`
        : `❌ Cancelled Reason: ${cancelReason} (by ${staffIdentifier})`;

      let updatedNotes = order.special_instructions ? `${order.special_instructions} | ${cancellationTag}` : cancellationTag;

      const baseUpdate = {
        status: 'cancelled',
        cancellation_reason: cancelReason,
        refund_status: refundStatusValue,
        special_instructions: updatedNotes,
        handled_by_name: staffIdentifier,
        handled_by_email: session?.user?.email || profile?.email || ''
      };

      const { error } = await supabase
        .from('orders')
        .update(baseUpdate)
        .eq('id', order.id);

      if (error) {
        console.warn('DB update fallback executed without extra columns:', error.message);
        delete baseUpdate.cancellation_reason;
        delete baseUpdate.refund_status;
        const { error: fbErr } = await supabase
          .from('orders')
          .update(baseUpdate)
          .eq('id', order.id);

        if (fbErr) throw fbErr;
      }

      // Trigger Refund Notice Email to customer ONLY for paid UPI orders
      if (isPaidUpi) {
        sendRefundNotificationEmail(order, cancelReason).then(res => {
          if (res.success && res.email) {
            showToast(`📧 Refund Notice Email sent to ${res.email} (Amount: ₹${order.total_amount}, 5-7 Days process)`);
          }
        });
        showToast(`❌ Order #${order.token_number || order.id.slice(0,4)} CANCELLED & Refund Application submitted to Admin!`);
      } else {
        showToast(`❌ Unpaid Order #${order.token_number || order.id.slice(0,4)} CANCELLED: ${cancelReason}`);
      }

      if (order.customer_id) {
        sendPushNotification(
          order.customer_id,
          order.id,
          '❌ Order Cancelled',
          `Your order (Token #${order.token_number || order.id.slice(0, 4)}) has been cancelled. Reason: ${cancelReason}`,
          'cancelled'
        );
      }

      setCancelModalOrder(null);
      fetchOrders();
    } catch (err) {
      showToast('Failed to cancel order: ' + err.message, true);
    }
  };

  const handleConfirmPaymentModal = async (method) => {
    if (!payModalOrder || !payModalTargetStatus) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: payModalTargetStatus,
          payment_status: 'paid',
          payment_method: method,
          handled_by_name: staffIdentifier,
          handled_by_email: session?.user?.email || profile?.email || ''
        })
        .eq('id', payModalOrder.id);

      if (error) throw error;
      showToast(`✓ Marked PAID (${method.toUpperCase()}) & Order updated to ${payModalTargetStatus.toUpperCase()}`);

      if (payModalOrder.customer_id) {
        let title = '';
        let body = '';
        if (payModalTargetStatus === 'preparing') {
          title = '👨‍🍳 Preparing Order';
          body = `Canteen has started cooking your order (Token #${payModalOrder.token_number || payModalOrder.id.slice(0, 4)}).`;
        } else if (payModalTargetStatus === 'ready') {
          title = '✅ Order Ready for Pickup!';
          body = `Your order is ready! Use Security PIN: ${payModalOrder.pickup_code || ''} (Token #${payModalOrder.token_number || payModalOrder.id.slice(0, 4)}).`;
        } else if (payModalTargetStatus === 'completed') {
          title = '🎉 Order Delivered!';
          body = `Thank you for ordering with GoCanteen! Your order (Token #${payModalOrder.token_number || payModalOrder.id.slice(0, 4)}) has been completed.`;
        }
        if (title && body) {
          sendPushNotification(payModalOrder.customer_id, payModalOrder.id, title, body, payModalTargetStatus);
        }
      }

      if (payModalTargetStatus === 'ready') {
        sendOrderReadyEmail(payModalOrder).then(res => {
          if (res.success && res.email) {
            showToast(`📧 Pickup Ready Email sent to ${res.email} (Token #${payModalOrder.token_number || payModalOrder.id.slice(0,4)}, PIN ${payModalOrder.pickup_code || ''})!`);
          }
        });
      }

      setPayModalOrder(null);
      setPayModalTargetStatus(null);
      fetchOrders();
    } catch (err) {
      showToast('Failed to update order: ' + err.message, true);
    }
  };

  const getTimeAgo = (timestamp) => {
    const mins = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
  };

  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'pending') return o.status === 'pending';
    if (statusFilter === 'preparing') return o.status === 'preparing';
    if (statusFilter === 'ready') return o.status === 'ready';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading live kitchen queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 text-slate-900 max-w-7xl mx-auto">
      
      {/* 1. Header Bar & Quick Counters */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Kitchen Live Queue (KDS)</h1>
              <span className="flex items-center gap-1 text-[10px] uppercase font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" /> REALTIME
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Logged in staff: <b className="text-slate-900">{staffIdentifier}</b></p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={() => {
              if (!soundEnabled) {
                initAudioContext();
                playAlertSound(); // Play test sound when enabling
              }
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              soundEnabled 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' 
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle Audio Alerts for New Orders"
          >
            {soundEnabled ? (
              <>🔊 Alerts On</>
            ) : (
              <>🔈 Alerts Off</>
            )}
          </button>
          
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* 2. Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          📋 All Live Tickets ({orders.length})
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          ⏳ Pending ({counts.pending})
        </button>

        <button
          onClick={() => setStatusFilter('preparing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 ${
            statusFilter === 'preparing'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          👨‍🍳 Preparing ({counts.preparing})
        </button>

        <button
          onClick={() => setStatusFilter('ready')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          ✅ Ready for Pickup ({counts.ready})
        </button>
      </div>

      {/* 3. Kitchen Order Cards */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 space-y-3 shadow-2xs">
          <span className="text-5xl">🍳</span>
          <h3 className="text-base font-black text-slate-900">No orders in this status</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Great job! Kitchen queue is clear. New orders will pop up here with instant audio chime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredOrders.map(order => {
            const isUnpaid = order.payment_status !== 'paid';
            const isCash = (order.payment_method || '').toLowerCase().includes('cash');
            const financials = getOrderFinancials(order);
            const pin = getOrderPin(order);
            const paymentId = getPaymentId(order);
            const orderIdStr = getOrderId(order);
            const cleanNotes = getUserSpecialInstructions(order.special_instructions);

            // Rule 1: ANY Unpaid order (whether created as cash or abandoned UPI window) can be cancelled directly with a reason.
            // Rule 2: Paid UPI orders can be cancelled with a refund request.
            // Rule 3: Confirmed Cash orders once cooking starts cannot be cancelled.
            const canCancelUnpaid = isUnpaid;
            const canCancelPaidUpi = !isUnpaid && !isCash;
            const canCancel = canCancelUnpaid || canCancelPaidUpi;

            return (
              <div
                key={order.id}
                className={`bg-white border-2 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs relative flex flex-col justify-between transition-all ${
                  isUnpaid
                    ? 'border-red-400 bg-red-50/20'
                    : order.is_parcel
                    ? 'border-orange-400 bg-orange-50/20'
                    : order.status === 'pending'
                    ? 'border-amber-300 bg-amber-50/20'
                    : order.status === 'preparing'
                    ? 'border-blue-300 bg-blue-50/20'
                    : 'border-emerald-400 bg-emerald-50/30'
                }`}
              >
                {/* Header: TOKEN NUMBER, ORDER ID & PIN */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 font-mono tracking-tight shadow-2xs">
                          Token #{order.token_number || order.id.slice(0, 4)}
                        </span>

                        {orderIdStr && (
                          <span className="hidden sm:inline-block text-xs font-extrabold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 font-mono shadow-2xs">
                            🆔 {orderIdStr}
                          </span>
                        )}

                        {pin && (
                          <span className="text-xs font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-xl border border-purple-300 tracking-wider font-mono shadow-2xs">
                            🔑 PIN: {pin}
                          </span>
                        )}

                        {order.is_parcel && (
                          <span className="text-xs font-black text-orange-900 bg-orange-100 px-2.5 py-1 rounded-xl border border-orange-300 tracking-wider shadow-2xs flex items-center gap-1">
                            📦 PARCEL
                          </span>
                        )}
                      </div>


                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                        <h3 className="text-xs font-black text-slate-900">{order.customer_name || 'Walk-in Customer'}</h3>
                        {order.phone && (
                          <>
                            <span className="text-[10px] text-slate-400 font-bold">•</span>
                            <a href={`tel:${order.phone}`} className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-0.5">
                              📞 {order.phone}
                            </a>
                          </>
                        )}
                        <span className="text-[10px] text-slate-400 font-bold">•</span>
                        <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {getTimeAgo(order.created_at)}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shrink-0 ${
                        order.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : order.status === 'preparing'
                          ? 'bg-blue-100 text-blue-900 border-blue-300 font-black'
                          : 'bg-emerald-500 text-slate-950 border-emerald-400 font-black animate-pulse'
                      }`}
                    >
                      {order.status === 'pending' ? '⏳ Pending' : order.status === 'preparing' ? '👨‍🍳 Cooking' : '✅ Ready'}
                    </span>
                  </div>

                  {/* Unpaid Warning Banner */}
                  {isUnpaid && (
                    <div className="bg-red-500 text-white text-xs p-2.5 rounded-xl font-black flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>UNPAID • Collect ₹{financials.finalAmount} Cash</span>
                      </div>
                      <span className="text-[10px] bg-white text-red-700 px-2 py-0.5 rounded font-extrabold uppercase">
                        Pay at counter
                      </span>
                    </div>
                  )}

                  {/* Kitchen Ticket Items List */}
                  <div className="bg-slate-50 rounded-xl p-3 sm:p-3.5 border border-slate-200 space-y-2 flex-1">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider block">Items to Prepare</span>
                    <ul className="space-y-2">
                      {order.order_items?.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between text-xs sm:text-sm text-slate-900 bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {item.inventory?.emoji || '🍽️'} {item.inventory?.name || item.item_name}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-500">₹{(Number(item.price_at_time) || 0) * Number(item.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    {cleanNotes && (
                      <div className="mt-2 text-[11px] text-amber-900 bg-amber-100/80 p-2.5 rounded-lg border border-amber-300 font-bold leading-relaxed">
                        📝 Special Request: {cleanNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls & Financial Details */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100">
                  <div className="space-y-2">
                    {order.payment_status === 'paid' ? (
                      <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-xl font-bold flex items-center justify-between border border-emerald-200/65 shadow-2xs">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>PAID ({order.payment_method?.toUpperCase() || 'UPI'}) ✓</span>
                        </span>
                        <span className="font-extrabold text-sm text-emerald-700">₹{financials.customerPaid}</span>
                      </div>
                    ) : (
                      <div className="bg-red-50 text-red-900 text-xs p-2.5 rounded-xl font-bold flex items-center justify-between border border-red-200/70 shadow-2xs">
                        <span className="flex items-center gap-1.5 animate-pulse">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>UNPAID • COLLECT CASH ✕</span>
                        </span>
                        <span className="font-extrabold text-sm text-red-700">₹{financials.finalAmount}</span>
                      </div>
                    )}

                    {/* Collapsible Details Button */}
                    <button
                      onClick={() => toggleCard(order.id)}
                      className="w-full py-1 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase flex items-center justify-center gap-1 hover:text-slate-600 cursor-pointer transition-colors"
                    >
                      <span>{expandedCards[order.id] ? 'Hide Details ▲' : 'Show Details ▼'}</span>
                    </button>

                    {/* Detailed financials shown only when expanded */}
                    {expandedCards[order.id] && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1 text-xs text-slate-600 animate-slide-down">
                        <div className="flex items-center justify-between">
                          <span>Food Amount</span>
                          <span>₹{financials.foodSalesAmount}</span>
                        </div>
                        {financials.parcelCharge > 0 && (
                          <div className="flex items-center justify-between text-orange-900 font-extrabold">
                            <span>Packaging Charge</span>
                            <span>+₹{financials.parcelCharge}</span>
                          </div>
                        )}
                        {financials.platformFee > 0 && (
                          <div className="flex items-center justify-between text-amber-900 font-extrabold">
                            <span>Platform Fee</span>
                            <span>+₹{financials.platformFee}</span>
                          </div>
                        )}
                        {paymentId && (
                          <div className="flex items-center justify-between text-purple-900 font-mono text-[9px]">
                            <span>Payment ID</span>
                            <span className="truncate max-w-[120px]">{paymentId}</span>
                          </div>
                        )}
                        {orderIdStr && (
                          <div className="flex items-center justify-between text-slate-400 font-mono text-[9px]">
                            <span>Order UUID</span>
                            <span className="truncate max-w-[120px]">{orderIdStr}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 1-TAP BIG ACTION BUTTONS */}
                  <div className="space-y-1.5">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order, 'preparing')}
                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>👨‍🍳 START PREPARING</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateStatus(order, 'ready')}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99] animate-pulse"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✅ MARK READY FOR PICKUP</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateStatus(order, 'completed')}
                        className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>🎉 HANDOVER COMPLETE (CLOSE)</span>
                      </button>
                    )}

                    {/* CANCELLATION & REFUND ACTION BUTTONS */}
                    {canCancel ? (
                      <button
                        onClick={() => setCancelModalOrder(order)}
                        className="w-full py-1 text-[11px] text-red-600 hover:underline text-center font-bold flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {canCancelPaidUpi ? 'Cancel & Apply for Refund 💸' : 'Cancel Unpaid Order'}
                      </button>
                    ) : isCash && order.payment_status === 'paid' ? (
                      <p className="text-[10px] text-slate-400 text-center font-semibold italic pt-1">
                        🔒 Confirmed Cash orders cannot be cancelled after cooking starts
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Centered Payment Confirmation Modal */}
      <PaymentConfirmModal
        isOpen={!!payModalOrder}
        order={payModalOrder}
        targetStatus={payModalTargetStatus || 'preparing'}
        onConfirm={handleConfirmPaymentModal}
        onClose={() => {
          setPayModalOrder(null);
          setPayModalTargetStatus(null);
        }}
      />

      {/* Cancellation & Refund Application Modal */}
      <CancelOrderModal
        isOpen={!!cancelModalOrder}
        order={cancelModalOrder}
        onConfirm={handleConfirmCancellation}
        onClose={() => setCancelModalOrder(null)}
      />
    </div>
  );
}
