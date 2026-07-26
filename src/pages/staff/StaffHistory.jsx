import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Loader2, RefreshCw, Calendar, Filter, User, Ticket } from 'lucide-react';
import { getOrderFinancials, getOrderPin } from '../../lib/orderUtils';

export default function StaffHistory() {

  const { staffT } = useAuth();
  const [historyOrders, setHistoryOrders] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'cancelled'
  const [timeScope, setTimeScope] = useState('all'); // 'today' | 'all'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel('staff-history-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, item_name, inventory(name, emoji))')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setHistoryOrders(data || []);
    } catch (err) {
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const historyOnlyOrders = historyOrders.filter(o => {
    const st = (o.status || '').toLowerCase();
    return st === 'completed' || st.includes('cancel') || st === 'delivered';
  });

  const scopedOrders = historyOnlyOrders.filter(o => {
    if (timeScope === 'today') return isToday(o.created_at);
    return true;
  });

  const filtered = scopedOrders.filter(o => {
    const st = (o.status || '').toLowerCase();
    if (filter === 'completed') return st === 'completed' || st === 'delivered';
    if (filter === 'cancelled') return st.includes('cancel');
    return true;
  });

  const totalCompletedOrders = scopedOrders.filter(o => (o.status || '').toLowerCase() === 'completed');
  const totalCompletedRevenue = totalCompletedOrders.reduce((sum, o) => sum + getOrderFinancials(o).finalAmount, 0);
  const totalDiscountsGiven = totalCompletedOrders.reduce((sum, o) => sum + getOrderFinancials(o).discount, 0);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading order history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16 text-slate-900">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">{staffT.orderHistory}</h1>
          <p className="text-xs text-slate-500 font-medium">Full audit trail of completed and cancelled tickets with staff attribution</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Refresh History Log"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" /> {staffT.refresh}
          </button>

          {totalDiscountsGiven > 0 && (
            <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-right">
              <span className="text-[11px] text-amber-800 block font-semibold">Discounts Given</span>
              <span className="text-sm font-black text-amber-700">-₹{totalDiscountsGiven}</span>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[11px] text-slate-500 block font-semibold">{staffT.revenue} ({timeScope === 'today' ? "Today" : "All Time"})</span>
            <span className="text-lg font-black text-emerald-700">₹{totalCompletedRevenue}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Scope Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs">
        
        {/* Status Filter Buttons */}
        <div className="flex gap-2">
          {['all', 'completed', 'cancelled'].map(f => {
            const count = f === 'all'
              ? scopedOrders.length
              : scopedOrders.filter(o => {
                  const st = (o.status || '').toLowerCase();
                  return f === 'completed' ? (st === 'completed' || st === 'delivered') : st.includes('cancel');
                }).length;

            const label = f === 'all' ? 'All' : (staffT[f] || f);

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Time Scope Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setTimeScope('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeScope === 'today' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {staffT.todayOnly}
          </button>
          <button
            onClick={() => setTimeScope('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeScope === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {staffT.allTime}
          </button>
        </div>
      </div>

      {/* History Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 space-y-2 shadow-2xs">
          <span className="text-4xl">📋</span>
          <h3 className="text-base font-bold text-slate-900">No {filter} tickets found</h3>
          <p className="text-xs text-slate-500 font-medium">
            {filter === 'cancelled'
              ? 'Any orders cancelled will appear right here with staff attribution in real-time.'
              : 'Completed orders will appear here as staff hands them over.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Mobile View: Stacked Card List */}
          <div className="block md:hidden space-y-3.5">
            {filtered.map(order => {
              const isCancelled = (order.status || '').toLowerCase().includes('cancel');
              const { subtotal, discount, finalAmount, platformFee, customerPaid, couponCode } = getOrderFinancials(order);
              const pin = getOrderPin(order);
              let attributionText = order.handled_by_name || '';
              if (attributionText.toLowerCase().includes('customer') || attributionText.toLowerCase().includes('student')) {
                attributionText = 'Customer';
              }

              return (
                <div
                  key={order.id}
                  className={`bg-white border rounded-2xl p-4 space-y-3 shadow-2xs transition-all ${
                    isCancelled ? 'border-red-200 bg-red-50/20' : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Card Header: Token & Status */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 font-mono">
                        Token #{order.token_number || order.id.slice(0, 4)}
                      </span>
                      {pin && (
                        <span className="text-[10px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono">
                          🔑 PIN: {pin}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border capitalize ${
                        isCancelled
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {staffT[order.status] || order.status}
                    </span>
                  </div>

                  {/* Customer & Timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                    <span>👤 {order.customer_name || 'Walk-in'}</span>
                    <span>🕒 {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>

                  {/* Items List */}
                  <div className="flex flex-wrap gap-1">
                    {order.order_items?.map((item, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-800">
                        {item.quantity}x {item.inventory?.emoji || '🍽️'} {item.inventory?.name || item.item_name}
                      </span>
                    ))}
                  </div>

                  {/* Special notes if cancelled */}
                  {order.cancellation_reason && (
                    <div className="text-[10px] font-extrabold text-red-800 bg-red-50 px-2 py-1 rounded border border-red-200 w-fit">
                      ❌ Cancel Reason: {order.cancellation_reason}
                    </div>
                  )}

                  {/* Card Footer: Amount, Paid Status, and Handler */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-black text-slate-900">₹{finalAmount}</span>
                        {discount > 0 && (
                          <span className="text-[10px] text-slate-400 line-through">₹{subtotal}</span>
                        )}
                      </div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">
                        {order.payment_method || 'CASH'} • {order.payment_status === 'paid' ? staffT.paid : staffT.unpaid}
                      </span>
                    </div>

                    <div>
                      {attributionText ? (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                          isCancelled ? 'bg-red-50 text-red-900 border-red-200' : 'bg-purple-50 text-purple-900 border-purple-200'
                        }`}>
                          👤 {isCancelled ? `By ${attributionText}` : `By ${attributionText}`}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[10px] italic">System</span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Desktop View: Full Audit Table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Token / ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Items</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Discount</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">{staffT.processedBy}</th>
                    <th className="p-3.5">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(order => {
                    const isCancelled = (order.status || '').toLowerCase().includes('cancel');
                    const { subtotal, discount, finalAmount, platformFee, customerPaid, couponCode } = getOrderFinancials(order);
                    const pin = getOrderPin(order);

                    let attributionText = order.handled_by_name || '';
                    if (attributionText.toLowerCase().includes('customer') || attributionText.toLowerCase().includes('student')) {
                      attributionText = 'Customer';
                    }

                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors ${
                          isCancelled
                            ? 'bg-red-50/70 hover:bg-red-100/70 border-l-4 border-l-red-500'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="p-3.5 font-black text-slate-900">
                          <div>#{order.token_number || order.id.slice(0, 6)}</div>
                          {pin && (
                            <span className="text-[10px] font-extrabold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 block w-fit mt-0.5 font-mono">
                              🔑 {staffT.pin}: {pin}
                            </span>
                          )}
                          {order.cancellation_reason && (
                            <span className="text-[10px] font-extrabold text-red-800 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 block w-fit mt-0.5">
                              ❌ Reason: {order.cancellation_reason}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{order.customer_name || 'Walk-in'}</td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {order.order_items?.map((item, idx) => (
                              <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-800">
                                {item.quantity}x {item.inventory?.emoji || '🍽️'} {item.inventory?.name || item.item_name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 font-black text-slate-900">
                          <div>₹{finalAmount}</div>
                          {platformFee > 0 && (
                            <span className="text-[10px] text-amber-800 font-extrabold block bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit mt-0.5">
                              + ₹{platformFee} (Fee)
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="text-[10px] text-slate-400 line-through font-medium block">₹{subtotal}</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {discount > 0 ? (
                            <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[11px] shrink-0 whitespace-nowrap">
                              <Ticket className="w-3 h-3 text-emerald-600 shrink-0" />
                              -₹{discount} {couponCode ? `(${couponCode})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 uppercase text-[11px] font-semibold text-slate-500">
                          {order.payment_method || 'CASH'} ({order.payment_status === 'paid' ? staffT.paid : staffT.unpaid})
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border capitalize ${
                              isCancelled
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {staffT[order.status] || order.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {attributionText ? (
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 w-fit border ${
                              isCancelled ? 'bg-red-50 text-red-900 border-red-200' : 'bg-purple-50 text-purple-900 border-purple-200'
                            }`}>
                              <User className="w-3.5 h-3.5 shrink-0" />
                              {isCancelled ? `Cancelled by ${attributionText}` : `Done by ${attributionText}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium text-[11px] italic">System / Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
