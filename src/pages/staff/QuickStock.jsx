import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function QuickStock() {
  const { showToast, staffT } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, categories(name)')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Stock fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    const updated = !currentStatus;
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ is_available: updated })
        .eq('id', id);

      if (error) throw error;
      showToast(`Item set to ${updated ? staffT.inStock : staffT.outOfStock}`);
      fetchStock();
    } catch (err) {
      showToast('Failed to update availability: ' + err.message, true);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.categories?.name && item.categories.name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading stock status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">{staffT.quickStockManage || 'Quick Stock Management'}</h1>
          <p className="text-xs text-slate-500 font-medium">{staffT.toggleAvail || 'Instantly toggle availability'}</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={staffT.searchItems || 'Search items...'}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-xs shadow-2xs focus:outline-none focus:border-emerald-600 font-medium"
        />
      </div>

      {/* Grid of items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`bg-white border rounded-2xl p-4 flex items-center justify-between shadow-2xs transition-all ${
              item.is_available ? 'border-slate-200' : 'border-red-200 bg-red-50/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{item.emoji || '🍽️'}</span>
              <div>
                <h3 className="text-xs font-bold text-slate-900">{item.name}</h3>
                <span className="text-[11px] text-slate-500 font-semibold">₹{item.price} • {item.categories?.name || 'General'}</span>
              </div>
            </div>

            <button
              onClick={() => toggleAvailability(item.id, item.is_available)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                item.is_available
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100'
              }`}
            >
              {item.is_available ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {staffT.inStock || 'In Stock'}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600" /> {staffT.outOfStock || 'Out of Stock'}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
