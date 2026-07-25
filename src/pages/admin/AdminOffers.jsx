import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit3, Trash2, X, Loader2, Save } from 'lucide-react';

export default function AdminOffers() {
  const { showToast } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    emoji: '🔥',
    tag: 'SPECIAL',
    items_included: '',
    is_active: true
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (err) {
      console.error('Offers fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      emoji: '🔥',
      tag: 'SPECIAL',
      items_included: '',
      is_active: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name || '',
      description: offer.description || '',
      price: offer.price || '',
      original_price: offer.original_price || '',
      emoji: offer.emoji || '🔥',
      tag: offer.tag || '',
      items_included: offer.items_included || '',
      is_active: offer.is_active !== false
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      showToast('Name and offer price are required', true);
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      original_price: formData.original_price ? Number(formData.original_price) : null,
      emoji: formData.emoji || '🔥',
      tag: formData.tag.trim(),
      items_included: formData.items_included.trim(),
      is_active: formData.is_active
    };

    try {
      if (editingOffer) {
        const { error } = await supabase.from('offers').update(payload).eq('id', editingOffer.id);
        if (error) throw error;
        showToast('✓ Combo deal updated!');
      } else {
        const { error } = await supabase.from('offers').insert([payload]);
        if (error) throw error;
        showToast('✓ Combo deal created!');
      }
      setModalOpen(false);
      fetchOffers();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete combo deal "${name}"?`)) return;
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id);
      if (error) throw error;
      showToast('Deal deleted');
      fetchOffers();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading combo offers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Combo Offers & Schemes</h1>
          <p className="text-xs text-slate-500 font-medium">Create promotional food combos and discount packages</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Create Combo Deal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {offers.map(offer => (
          <div
            key={offer.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{offer.emoji}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {offer.tag || 'DEAL'}
                  </span>
                  <button onClick={() => handleOpenEdit(offer)} className="p-1 rounded bg-slate-100 text-slate-600 hover:text-slate-900">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(offer.id, offer.name)} className="p-1 rounded bg-slate-100 text-red-600 hover:text-red-700">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{offer.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{offer.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-base font-black text-slate-900">₹{offer.price}</span>
                {offer.original_price && (
                  <span className="text-xs text-slate-400 line-through ml-2">₹{offer.original_price}</span>
                )}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${offer.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                {offer.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-slate-900">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingOffer ? 'Edit Combo Deal' : 'Create Combo Deal'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    required
                    value={formData.emoji}
                    onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    className="w-full text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-xl text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offer Title</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Burger + Fries + Coke Combo"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Offer Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="249"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="350"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Items Included</label>
                <input
                  type="text"
                  value={formData.items_included}
                  onChange={(e) => setFormData({ ...formData, items_included: e.target.value })}
                  placeholder="1 Veg Burger, 1 Medium Fries, 1 Cold Coffee"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short marketing teaser..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Offer Deal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
