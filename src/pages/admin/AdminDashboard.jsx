import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  IndianRupee, ShoppingBag, Clock, TrendingUp, Loader2, RefreshCw, Ticket, 
  Smartphone, DollarSign, Award, Flame, CheckCircle2, User, Phone, KeyRound, Sparkles, ArrowRight
} from 'lucide-react';
import { getOrderFinancials, getOrderId, getOrderPin } from '../../lib/orderUtils';
import { playAlertSound, initAudioContext } from '../../lib/audio';


export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    grossSales: 0,
    totalDiscounts: 0,
    ordersToday: 0,
    pendingOrders: 0,
    itemsSold: 0,
    avgOrderValue: 0,
    upiSales: 0,
    cashSales: 0
  });
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unlock AudioContext on first user interaction to bypass autoplay policies
  useEffect(() => {
    const unlockAudio = () => {
      initAudioContext();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    fetchDashboard();

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playAlertSound();
        }
        fetchDashboard();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchDashboard())
      .subscribe();

    // 🔄 Backup polling fallback every 45 seconds in case WebSocket drops
    const pollInterval = setInterval(() => fetchDashboard(), 45000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const fetchDashboard = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_time, item_name, inventory(name, emoji))')
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      let orders = ordersData || [];

      // Direct fallback fetch for order_items to guarantee complete item details
      const orderIds = orders.map(o => o.id).filter(Boolean);
      if (orderIds.length > 0) {
        const { data: directItems } = await supabase
          .from('order_items')
          .select('*, inventory(name, emoji)')
          .in('order_id', orderIds);

        if (directItems && directItems.length > 0) {
          orders = orders.map(o => {
            const matchedItems = directItems.filter(i => i.order_id === o.id);
            const existingItems = o.order_items || [];
            return {
              ...o,
              order_items: existingItems.length > 0 ? existingItems : matchedItems
            };
          });
        }
      }

      let rev = 0;
      let gross = 0;
      let discounts = 0;
      let pending = 0;
      let itemsCount = 0;
      let upi = 0;
      let cash = 0;
      let paidOrdersCount = 0;

      const itemAggregator = {};

      orders.forEach(o => {
        const financials = getOrderFinancials(o);
        const isPaid = o.payment_status === 'paid';
        const isNotCancelled = o.status !== 'cancelled';

        if (o.status === 'pending' || o.status === 'preparing') {
          pending += 1;
        }

        if (isPaid && isNotCancelled) {
          gross += financials.subtotal;
          discounts += financials.discount;
          rev += financials.customerPaid;
          paidOrdersCount += 1;

          const pMethod = (o.payment_method || '').toLowerCase();
          if (pMethod.includes('cash')) {
            cash += financials.customerPaid;
          } else {
            upi += financials.customerPaid;
          }

          // Aggregate Items Sold & Top Sellers (ONLY FOR PAID ORDERS)
          if (o.order_items && Array.isArray(o.order_items)) {
            o.order_items.forEach(item => {
              const qty = Number(item.quantity || 1);
              itemsCount += qty;

              const itemName = item.inventory?.name || item.item_name || 'Delicious Item';
              const emoji = item.inventory?.emoji || '🍽️';
              const itemPrice = Number(item.price_at_time || 0);

              if (!itemAggregator[itemName]) {
                itemAggregator[itemName] = { name: itemName, emoji, qty: 0, revenue: 0 };
              }
              itemAggregator[itemName].qty += qty;
              itemAggregator[itemName].revenue += qty * itemPrice;
            });
          }
        }
      });


      const sortedTop = Object.values(itemAggregator)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      const avg = paidOrdersCount > 0 ? Math.round(rev / paidOrdersCount) : 0;

      setStats({
        revenue: rev,
        grossSales: gross,
        totalDiscounts: discounts,
        ordersToday: orders.length,
        pendingOrders: pending,
        itemsSold: itemsCount,
        avgOrderValue: avg,
        upiSales: upi,
        cashSales: cash
      });

      setTopItems(sortedTop);
      setRecentOrders(orders.slice(0, 12));
    } catch (err) {
      console.error('Error fetching executive dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ready': return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold';
      case 'completed': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading executive analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Executive Dashboard
              <span className="flex items-center gap-1 text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" /> Real-time
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live revenue performance, item insights & customer fulfillment metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-4 h-4 text-purple-600" /> Refresh Live
          </button>
        </div>
      </div>

      {/* KPI Stats Strip — Compact Single Row */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex flex-wrap divide-x divide-slate-100">

          {/* Net Revenue */}
          <div className="flex items-center gap-3 px-4 py-3 min-w-[140px] flex-1 bg-emerald-50/60">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider leading-none mb-0.5">Net Revenue</div>
              <div className="text-base font-black text-emerald-800 leading-tight">₹{stats.revenue.toLocaleString('en-IN')}</div>
              <div className="text-[10px] text-emerald-600 font-bold">Gross ₹{stats.grossSales.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Discounts */}
          <div className="flex items-center gap-3 px-4 py-3 min-w-[130px] flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider leading-none mb-0.5">Discounts</div>
              <div className="text-base font-black text-amber-900 leading-tight">-₹{stats.totalDiscounts.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Orders Today */}
          <div className="flex items-center gap-3 px-4 py-3 min-w-[120px] flex-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Orders</div>
              <div className="text-base font-black text-slate-900 leading-tight">{stats.ordersToday}</div>
            </div>
          </div>

          {/* Pending KDS */}
          <div className={`flex items-center gap-3 px-4 py-3 min-w-[120px] flex-1 ${stats.pendingOrders > 0 ? 'bg-amber-50/60' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 relative ${stats.pendingOrders > 0 ? 'bg-amber-100' : 'bg-slate-100'}`}>
              <Clock className={`w-4 h-4 ${stats.pendingOrders > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              {stats.pendingOrders > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                  {stats.pendingOrders}
                </span>
              )}
            </div>
            <div>
              <div className={`text-[10px] font-extrabold uppercase tracking-wider leading-none mb-0.5 ${stats.pendingOrders > 0 ? 'text-amber-700' : 'text-slate-400'}`}>KDS Queue</div>
              <div className={`text-base font-black leading-tight ${stats.pendingOrders > 0 ? 'text-amber-900' : 'text-slate-400'}`}>
                {stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : 'Queue clear ✓'}
              </div>
            </div>
          </div>

          {/* Items Sold */}
          <div className="flex items-center gap-3 px-4 py-3 min-w-[120px] flex-1">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none mb-0.5">Items Sold</div>
              <div className="text-base font-black text-slate-900 leading-tight">{stats.itemsSold}</div>
            </div>
          </div>

          {/* Avg Order + Payment Split */}
          <div className="flex items-center gap-3 px-4 py-3 min-w-[200px] flex-1">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-xs font-bold space-y-0.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none mb-1">Avg / Split</div>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-extrabold text-slate-900">₹{stats.avgOrderValue} avg</span>
                <span className="text-slate-300">|</span>
                <span className="text-blue-700">UPI</span>
                <span className="font-extrabold text-slate-900">₹{stats.upiSales.toLocaleString('en-IN')}</span>
                <span className="text-slate-300">|</span>
                <span className="text-emerald-700">Cash</span>
                <span className="font-extrabold text-slate-900">₹{stats.cashSales.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Middle Grid: Top Selling Items & Payment Channel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Top 5 Selling Items Today */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-extrabold text-slate-900">Top Selling Items Today</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Ranked by volume sold</span>
          </div>

          {topItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-bold">No items sold today yet</div>
          ) : (
            <div className="space-y-2.5">
              {topItems.map((item, idx) => (
                <div
                  key={item.name}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 hover:bg-purple-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-xl text-xs font-black flex items-center justify-center border ${
                      idx === 0 ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      idx === 1 ? 'bg-slate-200 text-slate-800 border-slate-300' :
                      idx === 2 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <span className="text-[11px] text-slate-500 font-medium">Revenue Generated: ₹{item.revenue}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-emerald-700 shadow-2xs">
                      {item.qty} Sold
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Channels Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900">Payment Channels</h2>
              <span className="text-[10px] uppercase font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Today
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {/* UPI */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4 text-blue-600" /> UPI / QR Code</span>
                  <span className="text-sm font-black text-blue-950">₹{stats.upiSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-blue-200/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-500"
                    style={{ width: `${stats.revenue > 0 ? (stats.upiSales / stats.revenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Cash */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-600" /> Cash at Counter</span>
                  <span className="text-sm font-black text-emerald-950">₹{stats.cashSales.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-500"
                    style={{ width: `${stats.revenue > 0 ? (stats.cashSales / stats.revenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center text-xs font-bold text-slate-600">
            Total Money Collected: <b className="text-slate-900">₹{stats.revenue}</b>
          </div>
        </div>

      </div>

      {/* Enhanced Recent Today's Orders Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs space-y-3">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Recent Today's Orders Feed</h2>
            <p className="text-xs text-slate-500 font-medium">Real-time stream of incoming and processed canteen tickets</p>
          </div>
          <span className="text-[11px] font-extrabold bg-purple-50 text-purple-700 px-3 py-1 rounded-xl border border-purple-200 self-start sm:self-auto">
            ⚡ Live Activity Feed
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-bold">No orders recorded today yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Token / ID</th>
                  <th className="p-3.5">Customer & Phone</th>
                  <th className="p-3.5">Items Ordered</th>
                  <th className="p-3.5">Amount & Discount</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map(order => {
                  const financials = getOrderFinancials(order);
                  const orderIdStr = getOrderId(order);
                  const pin = getOrderPin(order);

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        order.status === 'cancelled'
                          ? 'bg-red-50/70 hover:bg-red-100/70 border-l-4 border-l-red-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >

                      {/* Token, Order ID & PIN */}
                      <td className="p-3.5 font-black text-slate-900">
                        <div>#{order.token_number || order.id.slice(0, 4)}</div>
                        {orderIdStr && (
                          <span className="text-[10px] font-extrabold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 block w-fit mt-0.5 font-mono">
                            🆔 {orderIdStr}
                          </span>
                        )}
                        {pin && (
                          <span className="text-[10px] font-extrabold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 block w-fit mt-0.5 font-mono">
                            🔑 PIN: {pin}
                          </span>
                        )}
                      </td>


                      {/* Customer Name & Phone */}
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{order.customer_name || 'Walk-in Customer'}</span>
                        </div>
                        {order.phone && (
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" /> {order.phone}
                          </span>
                        )}
                      </td>

                      {/* Items List */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {order.order_items && order.order_items.length > 0 ? (
                            order.order_items.map((item, idx) => (
                              <span key={idx} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800">
                                <span className="text-emerald-700 font-extrabold">{item.quantity}x</span> {item.inventory?.emoji || '🍽️'} {item.inventory?.name || item.item_name}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Standard order</span>
                          )}
                        </div>
                      </td>

                      {/* Amount & Discount */}
                      <td className="p-3.5">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">₹{financials.finalAmount}</span>
                          {financials.discount > 0 && (
                            <span className="text-xs text-slate-400 line-through font-bold">₹{financials.subtotal}</span>
                          )}
                        </div>
                        {financials.discount > 0 && (
                          <div className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 mt-0.5 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">
                            <Ticket className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Saved ₹{financials.discount} {financials.couponCode ? `(${financials.couponCode})` : ''}</span>
                          </div>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="p-3.5 uppercase text-[11px]">
                        <span className={`px-2.5 py-1 rounded-xl font-extrabold border ${
                          order.payment_status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                            : 'bg-red-50 text-red-700 border-red-300'
                        }`}>
                          {(order.payment_method || 'CASH').toUpperCase()} ({order.payment_status?.toUpperCase()})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border capitalize ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="p-3.5 text-slate-500 font-medium">
                        {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

