import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Filter, DollarSign, Smartphone, Ticket, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Search, Download, User, ChevronDown, ChevronUp
} from 'lucide-react';


import PaymentConfirmModal from '../../components/PaymentConfirmModal';
import CancelOrderModal from '../../components/CancelOrderModal';
import { getOrderFinancials, getOrderPin, getUserSpecialInstructions, getPaymentId, getOrderId } from '../../lib/orderUtils';

export default function AdminOrders() {
  const { showToast, profile, session } = useAuth();
  const adminIdentifier = profile?.full_name || profile?.email || session?.user?.email || 'Admin';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Custom Payment Modal state

  const [payModalOrder, setPayModalOrder] = useState(null);
  const [payModalTargetStatus, setPayModalTargetStatus] = useState(null);

  // Cancellation Modal state
  const [cancelModalOrder, setCancelModalOrder] = useState(null);

  // Filters State — Defaults to Today
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'upi' | 'cash'
  const [couponFilter, setCouponFilter] = useState('all'); // 'all' | 'coupon_used' | 'no_coupon'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, item_name, inventory(name, emoji))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      showToast('Failed to load orders', true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);

    if (newStatus === 'cancelled') {
      setCancelModalOrder(targetOrder);
      return;
    }

    if (newStatus !== 'cancelled' && targetOrder && targetOrder.payment_status !== 'paid') {
      setPayModalOrder(targetOrder);
      setPayModalTargetStatus(newStatus);
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          handled_by_name: `${adminIdentifier} (ADMIN)`,
          handled_by_email: session?.user?.email || profile?.email || ''
        })
        .eq('id', orderId);

      if (error) throw error;
      showToast(`Order status updated to ${newStatus.toUpperCase()}`);
      fetchOrders();
    } catch (err) {
      showToast('Failed to update status: ' + err.message, true);
    }
  };

  const handleConfirmCancellation = async (cancelReason) => {
    if (!cancelModalOrder) return;

    try {
      const order = cancelModalOrder;
      const cancellationTag = `❌ Cancelled Reason: ${cancelReason} (by ${adminIdentifier} ADMIN)`;
      let updatedNotes = order.special_instructions ? `${order.special_instructions} | ${cancellationTag}` : cancellationTag;

      const baseUpdate = {
        status: 'cancelled',
        cancellation_reason: cancelReason,
        special_instructions: updatedNotes,
        handled_by_name: `${adminIdentifier} (ADMIN)`,
        handled_by_email: session?.user?.email || profile?.email || ''
      };

      const { error } = await supabase
        .from('orders')
        .update(baseUpdate)
        .eq('id', order.id);

      if (error) {
        console.warn('DB update failed, executing fallback update without cancellation_reason column:', error.message);
        delete baseUpdate.cancellation_reason;
        const { error: fbErr } = await supabase
          .from('orders')
          .update(baseUpdate)
          .eq('id', order.id);

        if (fbErr) throw fbErr;
      }

      showToast(`❌ Order #${order.token_number || order.id.slice(0,4)} CANCELLED: ${cancelReason}`);
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
          handled_by_name: `${adminIdentifier} (ADMIN)`,
          handled_by_email: session?.user?.email || profile?.email || ''
        })
        .eq('id', payModalOrder.id);

      if (error) throw error;
      showToast(`✓ Marked PAID (${method.toUpperCase()}) & Status updated to ${payModalTargetStatus.toUpperCase()}`);
      setPayModalOrder(null);
      setPayModalTargetStatus(null);
      fetchOrders();
    } catch (err) {
      showToast('Failed to update order: ' + err.message, true);
    }
  };

  const handleTogglePaymentStatus = async (orderId, currentStatus) => {
    const nextStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;
      showToast(`Payment marked as ${nextStatus.toUpperCase()}`);
      fetchOrders();
    } catch (err) {
      showToast('Failed to update payment status: ' + err.message, true);
    }
  };

  const setPresetDate = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'this_week') {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const orderDateStr = order.created_at ? order.created_at.split('T')[0] : '';

    if (startDate && orderDateStr < startDate) return false;
    if (endDate && orderDateStr > endDate) return false;

    if (paymentFilter !== 'all') {
      const pMethod = (order.payment_method || '').toLowerCase();
      if (paymentFilter === 'cash' && !pMethod.includes('cash')) return false;
      if (paymentFilter === 'upi' && (pMethod.includes('cash'))) return false;
    }

    const { discount } = getOrderFinancials(order);
    const hasCoupon = discount > 0 || Boolean(order.promo_code);
    if (couponFilter === 'coupon_used' && !hasCoupon) return false;
    if (couponFilter === 'no_coupon' && hasCoupon) return false;

    if (statusFilter === 'refund_requested') {
      if (!(order.refund_status === 'requested' || (order.status === 'cancelled' && order.payment_status === 'paid'))) return false;
    } else if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = order.customer_name?.toLowerCase().includes(q);
      const phoneMatch = order.phone?.includes(q);
      const tokenMatch = order.token_number?.toString().includes(q);
      const orderIdMatch = getOrderId(order).toLowerCase().includes(q) || order.id?.toLowerCase().includes(q);
      const pinMatch = getOrderPin(order).includes(q);
      const promoMatch = order.promo_code?.toLowerCase().includes(q);
      if (!nameMatch && !phoneMatch && !tokenMatch && !orderIdMatch && !pinMatch && !promoMatch) return false;
    }

    return true;
  });


  // Export Filtered Orders to Excel (CSV)
  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      showToast('No orders to export based on active filters', true);
      return;
    }

    const headers = [
      'Token #',
      'Pickup Security PIN',
      'Order ID',
      'Date & Time',
      'Customer Name',
      'Phone Number',
      'Ordered Items',
      'Payment Method',
      'Payment Status',
      'Gross Sales (Rs)',
      'Promo Code Used',
      'Coupon Discount (Rs)',
      'Net Sales Revenue (Rs)',
      'Order Status',
      'Cancellation Reason',
      'Processed / Cancelled By'
    ];

    const csvRows = [headers.join(',')];

    filteredOrders.forEach(o => {
      const { grossSale, couponDiscount, netPayable } = getOrderFinancials(o);
      const dateStr = new Date(o.created_at).toLocaleString('en-IN').replace(/,/g, '');
      const itemsStr = (o.order_items || []).map(i => `${i.quantity}x ${i.item_name || i.inventory?.name || 'Item'}`).join('; ');

      const row = [
        `"${o.token_number || ''}"`,
        `"${o.pickup_code || ''}"`,
        `"${o.id}"`,
        `"${dateStr}"`,
        `"${(o.customer_name || 'Guest').replace(/"/g, '""')}"`,
        `"${o.phone || ''}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        `"${(o.payment_method || 'CASH').toUpperCase()}"`,
        `"${(o.payment_status || 'UNPAID').toUpperCase()}"`,
        grossSale,
        `"${o.promo_code || 'None'}"`,
        couponDiscount,
        netPayable,
        `"${o.status.toUpperCase()}"`,
        `"${o.cancellation_reason || 'N/A'}"`,
        `"${o.handled_by_name || 'Unassigned'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const fileName = `canteen_orders_${startDate || 'start'}_to_${endDate || 'end'}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`📥 Exported ${filteredOrders.length} orders to Excel CSV!`);
  };

  // Financial Analytics Summaries
  const totalOrdersCount = filteredOrders.length;
  let totalGrossSales = 0;
  let totalCouponDiscounts = 0;
  let totalNetSales = 0;
  let totalUpiSales = 0;
  let totalCashSales = 0;

  filteredOrders.forEach(o => {
    if (o.status !== 'cancelled') {
      const { grossSale, couponDiscount, netPayable } = getOrderFinancials(o);
      totalGrossSales += grossSale;
      totalCouponDiscounts += couponDiscount;
      totalNetSales += netPayable;

      const pMethod = (o.payment_method || '').toLowerCase();
      if (pMethod.includes('cash')) {
        totalCashSales += netPayable;
      } else {
        totalUpiSales += netPayable;
      }
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Sales & Orders Control</h1>
            <span className="bg-purple-100 text-purple-900 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border border-purple-200 uppercase">
              Financial Reports & Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Filter sales, track staff processing/cancellations, and export full reports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0 self-start md:self-auto">
          <button
            onClick={exportToExcel}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" /> Export to Excel (CSV)
          </button>
          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Orders
          </button>
        </div>
      </div>

      {/* Financial Analytics Summary Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        
        {/* Gross Sale Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Gross Sales</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">₹{totalGrossSales.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-slate-500 font-semibold block">Full value before discounts</span>
        </div>

        {/* Coupon Discount Card */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block">Coupon Deductions</span>
            <Ticket className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900">-₹{totalCouponDiscounts.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-amber-700 font-bold block">Total promo discounts</span>
        </div>

        {/* Net Revenue Card */}
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider block">Net Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-800">₹{totalNetSales.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-emerald-700 font-bold block">Final money collected</span>
        </div>

        {/* Refund Applications Card */}
        <div 
          onClick={() => setStatusFilter('refund_requested')}
          className="bg-red-50 border border-red-300 rounded-2xl p-4 shadow-2xs space-y-1 cursor-pointer hover:bg-red-100/80 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-red-900 uppercase tracking-wider block">Refund Applications</span>
            <RefreshCw className="w-4 h-4 text-red-600 animate-spin" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-800">
            {orders.filter(o => o.refund_status === 'requested' || (o.status === 'cancelled' && o.payment_status === 'paid')).length}
          </div>
          <span className="text-[10px] text-red-700 font-bold block">Tap to view & process 💸</span>
        </div>

        {/* Payment Split Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Payment Breakdown</span>
          <div className="text-xs font-bold space-y-1 pt-0.5">
            <div className="flex justify-between text-slate-700">
              <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-blue-600" /> UPI/QR</span>
              <span className="font-extrabold text-slate-900">₹{totalUpiSales}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Cash</span>
              <span className="font-extrabold text-slate-900">₹{totalCashSales}</span>
            </div>
          </div>
        </div>

        {/* Orders Count Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">Filtered Orders</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{totalOrdersCount} <span className="text-xs font-bold text-slate-500">Orders</span></div>
          <span className="text-[10px] text-slate-500 font-semibold block">Matching active filters</span>
        </div>
      </div>

      {/* Filter Control Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Order & Date Filters</h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Presets:</span>
            <button onClick={() => setPresetDate('today')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${startDate === todayStr && endDate === todayStr ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Today</button>
            <button onClick={() => setPresetDate('yesterday')} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600">Yesterday</button>
            <button onClick={() => setPresetDate('this_week')} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600">This Week</button>
            <button onClick={() => setPresetDate('this_month')} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600">This Month</button>
            <button onClick={() => setPresetDate('all')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${!startDate && !endDate ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All Time</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI / QR Code Only</option>
              <option value="cash">Cash at Counter Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Coupon Usage</label>
            <select
              value={couponFilter}
              onChange={(e) => setCouponFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="all">All Orders</option>
              <option value="coupon_used">🎟️ Coupon Used Only</option>
              <option value="no_coupon">No Coupon</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="all">All Statuses</option>
              <option value="refund_requested">💸 Refund Applications ({orders.filter(o => o.refund_status === 'requested' || (o.status === 'cancelled' && o.payment_status === 'paid')).length})</option>
              <option value="pending">Pending ⏳</option>
              <option value="preparing">Preparing 👨‍🍳</option>
              <option value="ready">Ready ✅</option>
              <option value="completed">Delivered 🎉</option>
              <option value="cancelled">Cancelled ✕</option>
            </select>
          </div>
        </div>

        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, token # or staff name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading sales & orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 space-y-2 shadow-xs">
          <span className="text-4xl">📦</span>
          <h3 className="text-base font-bold text-slate-900">No orders match selected filters</h3>
          <p className="text-xs text-slate-500">Try adjusting the date range or status filters above.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map(order => {
            const { subtotal, discount, foodSalesAmount, platformFee, customerPaid, couponCode } = getOrderFinancials(order);
            const pin = getOrderPin(order);
            const paymentId = getPaymentId(order);
            const orderIdStr = getOrderId(order);
            const cleanNotes = getUserSpecialInstructions(order.special_instructions);
            const isExpanded = expandedOrderId === order.id;

            let attributionName = order.handled_by_name || '';
            if (attributionName.toLowerCase().includes('customer') || attributionName.toLowerCase().includes('student')) {
              attributionName = 'Customer';
            }

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-2xl transition-all shadow-2xs overflow-hidden ${
                  order.status === 'cancelled' ? 'border-red-200 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                {/* COMPACT LINEAR ROW */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/90 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Token Number, Order ID & PIN */}
                  <div className="flex items-center gap-2 flex-wrap min-w-[220px]">
                    <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                      Token #{order.token_number || order.id.slice(0, 4)}
                    </span>

                    {orderIdStr && (
                      <span className="text-xs font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                        🆔 {orderIdStr}
                      </span>
                    )}

                    {pin && (
                      <span className="text-[11px] font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-mono">
                        🔑 {pin}
                      </span>
                    )}
                  </div>

                  {/* Customer Name & Phone */}
                  <div className="min-w-[180px]">
                    <h4 className="text-xs font-black text-slate-900 truncate">{order.customer_name || 'Walk-in Guest'}</h4>
                    <span className="text-[11px] text-slate-500 font-bold block">{order.phone || 'No phone'}</span>
                  </div>

                  {/* Price (Rupees) & Payment Status */}
                  <div className="flex items-center gap-2 min-w-[170px]">
                    <span className="text-sm font-black text-slate-900">₹{customerPaid}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePaymentStatus(order.id, order.payment_status);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-all ${
                        order.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {order.payment_status === 'paid' ? 'PAID ✓' : 'UNPAID ✕'} ({order.payment_method?.toUpperCase() || 'CASH'})
                    </button>
                  </div>

                  {/* Status Selector & Tap Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={order.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold border focus:outline-none cursor-pointer ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                        order.status === 'ready' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        order.status === 'completed' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                        'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      <option value="pending">Pending ⏳</option>
                      <option value="preparing">Cooking 👨‍🍳</option>
                      <option value="ready">Ready ✅</option>
                      <option value="completed">Delivered 🎉</option>
                      <option value="cancelled">Cancelled ✕</option>
                    </select>

                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE DETAILED SUMMARY DRAWER */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-4 animate-fade-in text-xs">
                    
                    {/* Cancellation Reason Banner (If Cancelled) */}
                    {order.status === 'cancelled' && (
                      <div className="bg-red-100 border border-red-300 text-red-950 p-3 rounded-2xl text-xs space-y-1 font-bold">
                        <div className="flex items-center gap-1.5 text-red-700">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span>Order Cancelled</span>
                        </div>
                        <p className="text-[11px] text-slate-900">
                          Reason: <b>{order.cancellation_reason || 'Out of stock or customer cancellation'}</b>
                        </p>
                      </div>
                    )}

                    {/* Items & Financial Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                        <span className="text-[11px] uppercase font-extrabold text-slate-500 tracking-wider block">
                          Ordered Items ({order.order_items?.length || 0})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {order.order_items?.map((item, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-2xs"
                            >
                              <span className="text-emerald-700 font-extrabold">{item.quantity}x</span>
                              {item.inventory?.emoji || '🍽️'} {item.inventory?.name || item.item_name || 'Item'}
                              <span className="text-slate-400 font-medium">@ ₹{item.price_at_time}</span>
                            </span>
                          ))}
                        </div>
                        {cleanNotes && (
                          <p className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mt-2">
                            📝 Special Request: {cleanNotes}
                          </p>
                        )}
                      </div>

                      <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-4 space-y-2 text-xs">
                        <span className="text-[11px] uppercase font-extrabold text-purple-900 tracking-wider block">
                          Audit & Financial Breakdown
                        </span>

                        <div className="space-y-1.5 text-slate-700 font-semibold">
                          <div className="flex justify-between">
                            <span>Food Subtotal</span>
                            <span className="font-extrabold text-slate-900">₹{subtotal}</span>
                          </div>

                          {discount > 0 ? (
                            <div className="flex justify-between text-amber-700 font-extrabold bg-amber-100/60 px-2 py-1 rounded-lg">
                              <span>Discount {couponCode ? `(${couponCode})` : ''}</span>
                              <span>-₹{discount}</span>
                            </div>
                          ) : (
                            <div className="flex justify-between text-slate-400">
                              <span>Discount</span>
                              <span>No Coupon</span>
                            </div>
                          )}

                          <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-purple-200">
                            <span>Net Food Revenue</span>
                            <span className="text-emerald-700 text-base">₹{foodSalesAmount}</span>
                          </div>

                          {platformFee > 0 && (
                            <div className="flex justify-between text-amber-900 font-extrabold bg-amber-100/80 px-2 py-1 rounded-lg border border-amber-300">
                              <span>⚡ Platform Fee (UPI/Online)</span>
                              <span>+₹{platformFee}</span>
                            </div>
                          )}

                          {paymentId && (
                            <div className="flex justify-between text-purple-950 font-bold text-[10px] bg-white px-2 py-1 rounded-lg border border-purple-200 font-mono">
                              <span>💳 Payment ID</span>
                              <span className="truncate max-w-[140px]">{paymentId}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-xs font-black text-slate-900 pt-1 border-t border-slate-200">
                            <span>Customer Total Paid</span>
                            <span className="text-purple-950 font-black">₹{customerPaid}</span>
                          </div>

                          {/* STAFF / ADMIN ATTRIBUTION BADGE */}
                          <div className="pt-2 border-t border-purple-200/60">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Staff Audit Trail</span>
                            <div className="flex items-center gap-1 text-[11px] font-black text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-200 mt-1">
                              <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>
                                {order.status === 'cancelled'
                                  ? `Cancelled by ${attributionName || 'Staff'}`
                                  : `Handled by ${attributionName || 'Staff'}`}
                              </span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 pt-1">
                            Placed: {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
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

      {/* Cancellation Reason Modal */}
      <CancelOrderModal
        isOpen={!!cancelModalOrder}
        order={cancelModalOrder}
        onConfirm={handleConfirmCancellation}
        onClose={() => setCancelModalOrder(null)}
      />
    </div>
  );
}
