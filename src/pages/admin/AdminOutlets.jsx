import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../context/AdminContext';
import { Store, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminOutlets() {
  const { outlets, refreshOutlets } = useAdmin();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', code: '', is_active: true, status: 'open' });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', code: '', is_active: true, status: 'open' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (outlet) => {
    setFormData({ name: outlet.name, code: outlet.code, is_active: outlet.is_active, status: outlet.status || 'open' });
    setEditingId(outlet.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('outlets')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('outlets')
          .insert([formData]);
        if (error) throw error;
      }
      await refreshOutlets();
      resetForm();
    } catch (err) {
      alert("Error saving outlet: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
            <Store className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Canteen Outlets</h1>
            <p className="text-sm font-medium text-slate-500">Manage physical locations and branches</p>
          </div>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Outlet</span>
          </button>
        )}
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Outlet' : 'Add New Outlet'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Outlet Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none"
                  placeholder="e.g. South Campus Canteen"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Short Code (Unique)</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none uppercase"
                  placeholder="e.g. SOUTH"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Operating Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-medium"
                >
                  <option value="open">Open (Running)</option>
                  <option value="closed">Closed</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded text-purple-600"
                />
                <label htmlFor="isActive" className="font-bold text-slate-700 cursor-pointer">Active in System</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Outlet'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outlets.map((outlet) => (
          <div key={outlet.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 rounded-full opacity-10 transition-transform group-hover:scale-110 ${outlet.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <h3 className="text-lg font-black text-slate-900">{outlet.name}</h3>
                <div className="inline-block px-2 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-500 mt-1">
                  Code: {outlet.code}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(outlet)}
                  className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-500">System Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${outlet.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {outlet.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {outlet.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-500">Operation</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${outlet.status === 'open' ? 'bg-blue-100 text-blue-700' : outlet.status === 'holiday' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                {outlet.status === 'open' ? '🟢 Open' : outlet.status === 'holiday' ? '🏖️ Holiday' : '🔴 Closed'}
              </span>
            </div>
          </div>
        ))}
        {outlets.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-slate-500">
            <Store className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-lg">No outlets found.</p>
            <p className="text-sm">Click "Add Outlet" to create your first canteen location.</p>
          </div>
        )}
      </div>
    </div>
  );
}
