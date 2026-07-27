import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit3, Trash2, Search, X, Loader2, Save, Star } from 'lucide-react';

import EmojiPickerMenu from '../../components/EmojiPickerMenu';

export default function AdminInventory() {
  const { showToast } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    emoji: '🍽️',
    is_veg: true,
    description: '',
    tag: '',
    is_available: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, catRes] = await Promise.all([
        supabase.from('inventory').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      ]);

      setInventory(invRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      price: '',
      category_id: categories[0]?.id || '',
      emoji: '🍽️',
      is_veg: true,
      description: '',
      tag: '',
      is_available: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      price: item.price || '',
      category_id: item.category_id || categories[0]?.id || '',
      emoji: item.emoji || '🍽️',
      is_veg: item.is_veg !== false,
      description: item.description || '',
      tag: item.tag || '',
      is_available: item.is_available !== false
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showToast('Please enter item name and price', true);
      return;
    }

    // ✅ Price must be a positive number greater than zero
    if (Number(formData.price) <= 0) {
      showToast('⚠️ Item price must be greater than ₹0. Please enter a valid price.', true);
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      category_id: formData.category_id || null,
      emoji: formData.emoji || '🍽️',
      is_veg: formData.is_veg,
      description: formData.description.trim(),
      tag: formData.tag.trim(),
      is_available: formData.is_available
    };

    try {
      if (editingItem) {
        const { error } = await supabase.from('inventory').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        showToast('✓ Item updated successfully!');
      } else {
        const { error } = await supabase.from('inventory').insert([payload]);
        if (error) throw error;
        showToast('✓ Item added to menu!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('inventory').delete().eq('id', id);
      if (error) throw error;
      showToast('Item deleted successfully');
      fetchData();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const togglePopular = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ is_popular: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      showToast(!currentStatus ? 'Marked as Popular' : 'Removed from Popular');
      
      // Optimistic update
      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, is_popular: !currentStatus } : item
      ));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const filtered = inventory.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading inventory list...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Menu & Inventory Manager</h1>
          <p className="text-xs text-slate-500 font-medium">Add, edit, or remove food & drink items</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items by name..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-xs shadow-2xs focus:outline-none focus:border-purple-600 font-medium"
        />
      </div>

      {/* Mobile View: Stacked Card List */}
      <div className="block md:hidden space-y-3">
        {filtered.map(item => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.emoji || '🍽️'}</span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {item.categories?.name || 'Uncategorized'}
                  </span>
                </div>
              </div>
              <span className="text-base font-black text-slate-900">₹{item.price}</span>
            </div>

            {item.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.is_veg ? (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">🌱 Veg</span>
                ) : (
                  <span className="text-[10px] font-extrabold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">🍗 Non-Veg</span>
                )}
                
                {item.tag && (
                  <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">
                    {item.tag}
                  </span>
                )}

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${item.is_available ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                  {item.is_available ? 'Active' : 'Hidden'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => togglePopular(item.id, item.is_popular)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    item.is_popular 
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                      : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={item.is_popular ? "Remove from Popular" : "Mark as Popular Today"}
                >
                  <Star className="w-4 h-4" fill={item.is_popular ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                  title="Edit Item"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  className="p-2 rounded-xl bg-slate-100 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Desktop View: Inventory Table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Item</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Diet</th>
                <th className="p-3.5">Tag</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji || '🍽️'}</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{item.name}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700">{item.categories?.name || 'Uncategorized'}</td>
                  <td className="p-3.5 font-black text-slate-900">₹{item.price}</td>
                  <td className="p-3.5 font-bold">
                    {item.is_veg ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Veg</span>
                    ) : (
                      <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">Non-Veg</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {item.tag ? (
                      <span className="text-[10px] font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded uppercase">
                        {item.tag}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${item.is_available ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => togglePopular(item.id, item.is_popular)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          item.is_popular 
                            ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                            : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title={item.is_popular ? "Remove from Popular" : "Mark as Popular Today"}
                      >
                        <Star className="w-3.5 h-3.5" fill={item.is_popular ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 rounded-lg bg-slate-100 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-slate-900">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <EmojiPickerMenu
                    value={formData.emoji}
                    onChange={(emoji) => setFormData({ ...formData, emoji })}
                    label="Emoji Menu"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cheese Burst Pizza"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="199"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Diet Preference</label>
                  <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-extrabold flex items-center gap-1.5">
                    🌱 Pure Veg
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tag (Optional)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="e.g. Bestseller"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients or details about the item..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_available_cb"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="is_available_cb" className="text-xs font-bold text-slate-700">
                  Item is Available for Ordering
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingItem ? 'Save Item Changes' : 'Create Menu Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
