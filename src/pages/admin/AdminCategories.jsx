import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit3, Trash2, X, Loader2, Save } from 'lucide-react';

import EmojiPickerMenu from '../../components/EmojiPickerMenu';

export default function AdminCategories() {
  const { showToast } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    emoji: '🍽️',
    sort_order: 0,
    is_active: true,
    has_packaging_charge: false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Category fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCat(null);
    setFormData({ name: '', emoji: '🍽️', sort_order: categories.length + 1, is_active: true, has_packaging_charge: false });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCat(cat);
    setFormData({
      name: cat.name || '',
      emoji: cat.emoji || '🍽️',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active !== false,
      has_packaging_charge: cat.has_packaging_charge === true
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', true);
      return;
    }

    setSaving(true);
    const payload = {
      name: formData.name.trim(),
      emoji: formData.emoji || '🍽️',
      sort_order: Number(formData.sort_order),
      is_active: formData.is_active,
      has_packaging_charge: formData.has_packaging_charge
    };

    try {
      if (editingCat) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editingCat.id);
        if (error) throw error;
        showToast('✓ Category updated!');
      } else {
        const { error } = await supabase.from('categories').insert([payload]);
        if (error) throw error;
        showToast('✓ Category created!');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      showToast('Category deleted');
      fetchCategories();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div>
          <h1 className="text-xl font-black text-slate-900">Categories Manager</h1>
          <p className="text-xs text-slate-500 font-medium">Organize menu items into categories</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map(cat => (
          <div
            key={cat.id}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{cat.emoji}</span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-400 font-semibold">Sort Order: {cat.sort_order}</span>
                  {cat.has_packaging_charge && (
                    <span className="text-[9px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                      + Packaging
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="p-1.5 rounded-lg bg-slate-100 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs text-slate-900">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingCat ? 'Edit Category' : 'Create Category'}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Cold Beverages"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                  />
                </div>
                
                <div className="flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.has_packaging_charge}
                      onChange={(e) => setFormData({ ...formData, has_packaging_charge: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all relative"></div>
                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 select-none">
                      Packaging Charge
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
