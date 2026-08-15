import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit3, Trash2, Search, X, Loader2, Save, Star, Copy, Image as ImageIcon, Upload } from 'lucide-react';

import EmojiPickerMenu from '../../components/EmojiPickerMenu';
import AdminOutletSelector from '../../components/AdminOutletSelector';
import { useAdmin } from '../../context/AdminContext';
import Cropper from 'react-easy-crop';

export default function AdminInventory() {
  const { showToast } = useAuth();
  const { selectedAdminOutlet, outlets } = useAdmin();
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropState, setCropState] = useState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
  const [isDragging, setIsDragging] = useState(false);
  const [quickEditItemId, setQuickEditItemId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    emoji: '🍽️',
    is_veg: true,
    description: '',
    tag: '',
    is_available: true,
    availableOutlets: [],
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedAdminOutlet]);

  const fetchData = async () => {
    try {
      const [invRes, catRes] = await Promise.all([
        supabase.from('inventory').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
      ]);

      let items = invRes.data || [];

      if (selectedAdminOutlet !== 'ALL' && items.length > 0) {
        // Fetch specific availability for this outlet
        const { data: availData, error: availErr } = await supabase
          .from('inventory_availability')
          .select('item_id, is_available')
          .eq('outlet_id', selectedAdminOutlet);
          
        if (!availErr && availData) {
          const availMap = {};
          availData.forEach(a => availMap[a.item_id] = a.is_available);
          items = items.map(item => ({
            ...item,
            is_available: availMap[item.id] !== undefined ? availMap[item.id] : item.is_available
          }));
        }
      }

      setInventory(items);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  
  const processImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropState(prev => ({ ...prev, isOpen: true, image: reader.result, crop: {x:0, y:0}, zoom: 1 }));
    };
  };

  const handleImageSelect = (e) => processImageFile(e.target.files[0]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    // 1. Try local files first
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      return processImageFile(file);
    }
    
    // 2. Try dragging from another browser tab (HTML/URL)
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      // Extract src from <img src="...">
      const match = html.match(/src="?([^"\s]+)"?\s*/);
      if (match && match[1]) {
        let src = match[1];
        src = src.replace(/&amp;/g, '&'); // decode HTML entities
        
        if (src.startsWith('data:image')) {
          // It's a base64 image (common for google image thumbnails)
          setCropState(prev => ({ ...prev, isOpen: true, image: src, crop: {x:0, y:0}, zoom: 1 }));
          return;
        } else if (src.startsWith('http')) {
          // It's a regular URL. We must proxy it to avoid CORS tainted canvas errors
          try {
            setUploadingImage(true);
            const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`;
            const response = await fetch(proxiedUrl);
            const blob = await response.blob();
            processImageFile(blob); // now we have a local blob!
          } catch (err) {
            // Error handling is tricky without showToast in scope if not defined, but we have showToast!
            if (typeof showToast === 'function') {
               showToast("Couldn't import image from website due to security restrictions.", true);
            }
          } finally {
            setUploadingImage(false);
          }
          return;
        }
      }
    }
  };

  
  const handleQuickAddImage = (item) => {
    setQuickEditItemId(item.id);
    document.getElementById('quick-image-upload').click();
  };

  const handleQuickDrop = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickEditItemId(item.id);
    await handleDrop(e);
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCropState(prev => ({ ...prev, croppedAreaPixels }));
  };

  const handleConfirmCrop = async () => {
    if (!cropState.image || !cropState.croppedAreaPixels) return;
    setUploadingImage(true);
    setCropState(prev => ({ ...prev, isOpen: false }));

    try {
      const img = new Image();
      img.src = cropState.image;
      await new Promise(resolve => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 600;
      canvas.width = MAX_SIZE;
      canvas.height = MAX_SIZE;

      ctx.drawImage(
        img,
        cropState.croppedAreaPixels.x,
        cropState.croppedAreaPixels.y,
        cropState.croppedAreaPixels.width,
        cropState.croppedAreaPixels.height,
        0,
        0,
        MAX_SIZE,
        MAX_SIZE
      );

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.8));
      const fileName = `item_${Date.now()}.webp`;
      
      const { data, error } = await supabase.storage
        .from('menu_images')
        .upload(fileName, blob, { contentType: 'image/webp', upsert: false });
        
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('menu_images').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      showToast('Image cropped & uploaded successfully!');
    } catch (err) {
      console.error('Image crop error:', err);
      showToast('Failed to process image.', true);
    } finally {
      setUploadingImage(false);
      setCropState(prev => ({ ...prev, image: null }));
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
      is_available: true,
      availableOutlets: outlets.map(o => o.id),
      image_url: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setEditingItem(item);
    
    let availOutlets = outlets.map(o => o.id);
    
    try {
      const { data, error } = await supabase
        .from('inventory_availability')
        .select('outlet_id, is_available')
        .eq('item_id', item.id);
        
      if (!error && data) {
        if (data.length > 0) {
          availOutlets = data.filter(a => a.is_available).map(a => a.outlet_id);
        }
      }
    } catch (e) {
      console.warn('Error fetching item availability', e);
    }

    setFormData({
      name: item.name || '',
      price: item.price || '',
      category_id: item.category_id || categories[0]?.id || '',
      emoji: item.emoji || '🍽️',
      is_veg: item.is_veg !== false,
      description: item.description || '',
      tag: item.tag || '',
      is_available: item.is_available !== false,
      availableOutlets: availOutlets,
      image_url: item.image_url || ''
    });
    setModalOpen(true);
  };

  const handleDuplicate = (item) => {
    setEditingItem(null); // Creating a new item, not editing
    setFormData({
      name: `${item.name} (Copy)`,
      price: item.price || '',
      category_id: item.category_id || categories[0]?.id || '',
      emoji: item.emoji || '🍽️',
      is_veg: item.is_veg !== false,
      description: item.description || '',
      tag: item.tag || '',
      is_available: item.is_available !== false,
      availableOutlets: outlets.map(o => o.id),
      image_url: item.image_url || ''
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
      is_available: formData.is_available,
      image_url: formData.image_url
    };

    try {
      let itemId = null;
      if (editingItem) {
        itemId = editingItem.id;
        const { error } = await supabase.from('inventory').update(payload).eq('id', itemId);
        if (error) throw error;
        showToast('✓ Item updated successfully!');
      } else {
        const { data, error } = await supabase.from('inventory').insert([payload]).select();
        if (error) throw error;
        itemId = data[0].id;
        showToast('✓ Item added to menu!');
      }

      if (itemId && outlets.length > 0) {
        const availabilityPayload = outlets.map(o => ({
          item_id: itemId,
          outlet_id: o.id,
          is_available: formData.availableOutlets.includes(o.id)
        }));
        
        await supabase
          .from('inventory_availability')
          .upsert(availabilityPayload, { onConflict: 'outlet_id,item_id' });
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

  const toggleAvailability = async (id, currentStatus) => {
    try {
      // Optimistic update
      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, is_available: !currentStatus } : item
      ));

      if (selectedAdminOutlet !== 'ALL') {
        const { error } = await supabase
          .from('inventory_availability')
          .upsert(
            { outlet_id: selectedAdminOutlet, item_id: id, is_available: !currentStatus },
            { onConflict: 'outlet_id,item_id' }
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventory')
          .update({ is_available: !currentStatus })
          .eq('id', id);
        if (error) throw error;
      }

      showToast(!currentStatus ? '✓ Marked In Stock' : '✕ Marked Out of Stock');
    } catch (err) {
      showToast(err.message, true);
      // Revert optimistic update
      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, is_available: currentStatus } : item
      ));
    }
  };

  const handleBulkAction = async (e) => {
    const action = e.target.value;
    if (!action) return;

    // action format: "enable_cat_123" or "disable_cat_123"
    const [type, ...rest] = action.split('_');
    const categoryId = rest.join('_');
    const isAvailable = type === 'enable';

    if (!window.confirm(`Are you sure you want to mark all items in this category as ${isAvailable ? 'In Stock' : 'Out of Stock'}?`)) {
      e.target.value = "";
      return;
    }

    try {
      if (selectedAdminOutlet !== 'ALL') {
        // Find all items in this category
        const categoryItems = inventory.filter(i => i.category_id === categoryId);
        const upsertPayload = categoryItems.map(item => ({
          outlet_id: selectedAdminOutlet,
          item_id: item.id,
          is_available: isAvailable
        }));
        
        if (upsertPayload.length > 0) {
          const { error } = await supabase
            .from('inventory_availability')
            .upsert(upsertPayload, { onConflict: 'outlet_id,item_id' });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from('inventory')
          .update({ is_available: isAvailable })
          .eq('category_id', categoryId);
        if (error) throw error;
      }

      showToast(`Category marked ${isAvailable ? 'In Stock' : 'Out of Stock'}`);
      fetchData();
    } catch (err) {
      showToast(err.message, true);
    }
    e.target.value = "";
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
      <AdminOutletSelector />
      
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

      {/* Search Input & Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-xs shadow-2xs focus:outline-none focus:border-purple-600 font-medium"
          />
        </div>

        {/* Bulk Action Dropdown */}
        <div className="sm:w-64">
          <select 
            onChange={handleBulkAction}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 text-xs shadow-2xs focus:outline-none focus:border-purple-600 font-medium cursor-pointer"
          >
            <option value="">⚡ Bulk Actions (Stock)...</option>
            <optgroup label="Mark All In Stock">
              {categories.map(cat => (
                <option key={`enable_${cat.id}`} value={`enable_${cat.id}`}>✓ {cat.name}</option>
              ))}
            </optgroup>
            <optgroup label="Mark All Out of Stock">
              {categories.map(cat => (
                <option key={`disable_${cat.id}`} value={`disable_${cat.id}`}>❌ {cat.name}</option>
              ))}
            </optgroup>
          </select>
        </div>
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
                {item.image_url ? (
                  <span className="text-[10px] font-extrabold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Image Added
                  </span>
                ) : (
                  <button 
                    onClick={() => handleQuickAddImage(item)}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => handleQuickDrop(e, item)}
                    className="text-[10px] font-extrabold text-slate-500 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 px-2 py-0.5 rounded border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Quick Add
                  </button>
                )}
                
                {item.tag && (
                  <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">
                    {item.tag}
                  </span>
                )}

                <button 
                  onClick={() => toggleAvailability(item.id, item.is_available)}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold border transition-colors cursor-pointer ${item.is_available ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'}`}>
                  {item.is_available ? '✓ In Stock' : '✕ Out of Stock'}
                </button>
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
                  onClick={() => handleDuplicate(item)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                  title="Duplicate Item"
                >
                  <Copy className="w-4 h-4" />
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
                <th className="p-3.5">Image</th>
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
                    {item.image_url ? (
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px] font-extrabold uppercase flex items-center gap-1 w-max">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Added
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleQuickAddImage(item)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => handleQuickDrop(e, item)}
                        className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-[10px] font-extrabold uppercase flex items-center gap-1 w-max transition-colors cursor-pointer"
                        title="Click to select or drag and drop an image here"
                      >
                        <Upload className="w-3 h-3" /> Quick Add
                      </button>
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
                    <button 
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold border transition-colors cursor-pointer ${item.is_available ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'}`}>
                      {item.is_available ? '✓ In Stock' : '✕ Out of Stock'}
                    </button>
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
                        onClick={() => handleDuplicate(item)}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                        title="Duplicate Item"
                      >
                        <Copy className="w-3.5 h-3.5" />
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

      
      {/* Crop Modal */}
      {cropState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-slate-900">Crop Image (1:1 Square)</h2>
              <button onClick={() => { setCropState(prev => ({ ...prev, isOpen: false })); setQuickEditItemId(null); }} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full h-[400px] bg-slate-100 rounded-xl overflow-hidden">
              <Cropper
                image={cropState.image}
                crop={cropState.crop}
                zoom={cropState.zoom}
                aspect={1}
                onCropChange={(crop) => setCropState(prev => ({ ...prev, crop }))}
                onCropComplete={onCropComplete}
                onZoomChange={(zoom) => setCropState(prev => ({ ...prev, zoom }))}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">Zoom</span>
              <input
                type="range"
                value={cropState.zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setCropState(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                className="w-full accent-purple-600"
              />
            </div>
            
            <button
              onClick={handleConfirmCrop}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-sm"
            >
              Confirm Crop & Upload
            </button>
          </div>
        </div>
      )}

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
                    label="Emoji (Fallback)"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Image (WebP Compressed)</label>
                  <div className="flex items-center gap-2">
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                    )}
                    <label 
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl cursor-pointer transition-colors text-[10px] font-bold h-10 ${
                        isDragging 
                          ? 'bg-purple-50 border-purple-400 text-purple-700 border-dashed' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 border-solid'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Upload className="w-4 h-4 shrink-0" />}
                      <span className="truncate">{uploadingImage ? 'Compressing...' : isDragging ? 'Drop Image Here' : 'Upload Image'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
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

              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_available_cb"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="is_available_cb" className="text-xs font-bold text-slate-700">
                    Item is Available for Ordering (Global Master Switch)
                  </label>
                </div>
                
                {outlets.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Available In Outlets:</label>
                    <div className="flex flex-col gap-2">
                      {outlets.map(outlet => (
                        <div key={outlet.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`outlet_${outlet.id}`}
                            checked={formData.availableOutlets.includes(outlet.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, availableOutlets: [...formData.availableOutlets, outlet.id] });
                              } else {
                                setFormData({ ...formData, availableOutlets: formData.availableOutlets.filter(id => id !== outlet.id) });
                              }
                            }}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <label htmlFor={`outlet_${outlet.id}`} className="text-xs font-medium text-slate-700 cursor-pointer">
                            {outlet.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
      <input type="file" id="quick-image-upload" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploadingImage} />
    </div>
  );
}
