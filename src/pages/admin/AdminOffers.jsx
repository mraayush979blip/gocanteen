import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit3, Trash2, Save, X, Loader2, Sparkles, Megaphone } from 'lucide-react';
import EmojiPickerMenu from '../../components/EmojiPickerMenu';
import Cropper from 'react-easy-crop';
import { Upload } from 'lucide-react';

export default function AdminOffers() {
  const { showToast } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropState, setCropState] = useState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
  const [isDragging, setIsDragging] = useState(false);

  const [emoji1, setEmoji1] = useState('🍔');
  const [emoji2, setEmoji2] = useState('🥤');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    emoji: '🍔 + 🥤',
    tag: 'SPECIAL',
    items_included: '',
    is_active: true,
    image_url: ''
  });

  // Broadcast campaign states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      showToast('Title and message are required', true);
      return;
    }

    if (!window.confirm('⚠️ Are you sure you want to send this broadcast notification to all customer devices?')) {
      return;
    }

    setBroadcasting(true);
    try {
      const response = await fetch('/api/broadcast-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          body: broadcastBody.trim(),
          link: broadcastLink.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast(`🎉 Broadcast sent to ${result.totalCount || 0} devices! (Success: ${result.successCount || 0})`);
        setBroadcastTitle('');
        setBroadcastBody('');
        setBroadcastLink('');
      } else {
        showToast(`Failed to broadcast: ${result.reason || result.error || 'Unknown error'}`, true);
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, true);
    } finally {
      setBroadcasting(false);
    }
  };

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

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCropState(prev => ({ ...prev, croppedAreaPixels }));
  };

  const generateWebP = async (imageSrc, crop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => image.onload = resolve);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = 600;
    canvas.width = maxSize;
    canvas.height = maxSize;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      maxSize,
      maxSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
    });
  };

  const uploadCroppedImage = async () => {
    try {
      setUploadingImage(true);
      const blob = await generateWebP(cropState.image, cropState.croppedAreaPixels);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`;

      const { data, error } = await supabase.storage
        .from('menu_images')
        .upload(fileName, blob, { contentType: 'image/webp', upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('menu_images').getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      setCropState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
      showToast('Image uploaded successfully');
    } catch (err) {
      console.error('Image crop error:', err);
      showToast(err.message, true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setEmoji1('🍔');
    setEmoji2('🥤');
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      emoji: '🍔 + 🥤',
      tag: 'SPECIAL',
      items_included: '',
      is_active: true,
      image_url: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    const parts = (offer.emoji || '').split('+').map(p => p.trim());
    setEmoji1(parts[0] || '🍔');
    setEmoji2(parts[1] || '🥤');
    setFormData({
      name: offer.name || '',
      description: offer.description || '',
      price: offer.price || '',
      original_price: offer.original_price || '',
      emoji: offer.emoji || '🍔 + 🥤',
      tag: offer.tag || '',
      items_included: offer.items_included || '',
      is_active: offer.is_active !== false,
      image_url: offer.image_url || ''
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
      emoji: `${emoji1.trim()} + ${emoji2.trim()}`,
      tag: formData.tag.trim(),
      items_included: formData.items_included.trim(),
      is_active: formData.is_active,
      image_url: formData.image_url
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Combo Deals List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {offers.map(offer => (
              <div
                key={offer.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 font-bold text-slate-500 shrink-0">
                      {offer.emoji?.includes('+') ? (
                        (() => {
                          const parts = offer.emoji.split('+').map(p => p.trim());
                          return (
                            <>
                              <span className="text-2xl">{parts[0]}</span>
                              <span className="text-[11px] text-slate-400 font-extrabold">+</span>
                              <span className="text-2xl">{parts[1]}</span>
                            </>
                          );
                        })()
                      ) : (
                        <span className="text-2xl">{offer.emoji}</span>
                      )}
                    </div>
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
        </div>

        {/* Right Column: Broadcast Announcement panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                📢 Broadcast Push Campaign
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Send a real-time push notification to all customer phones & browsers</p>
            </div>
            
            <form onSubmit={handleBroadcastSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Notification Title</label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. 🍟 Free Fries Today!"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Notification Message</label>
                <textarea
                  rows={3}
                  required
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Order any item above ₹199 and get a free large fries. Valid till 4 PM!"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Target Action Link (Optional)</label>
                <input
                  type="text"
                  value={broadcastLink}
                  onChange={(e) => setBroadcastLink(e.target.value)}
                  placeholder="e.g. https://gocanteen.in/#/offers"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={broadcasting}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {broadcasting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Broadcasting Message...</span>
                  </>
                ) : (
                  <>
                    <span>📢 Send Broadcast Notification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      
      {cropState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/20 relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Crop Image</h3>
              <button onClick={() => setCropState(prev => ({ ...prev, isOpen: false }))} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full h-80 bg-slate-900">
              <Cropper
                image={cropState.image}
                crop={cropState.crop}
                zoom={cropState.zoom}
                aspect={1}
                onCropChange={crop => setCropState(prev => ({ ...prev, crop }))}
                onCropComplete={onCropComplete}
                onZoomChange={zoom => setCropState(prev => ({ ...prev, zoom }))}
              />
            </div>
            
            <div className="p-5 bg-white space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={cropState.zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setCropState(prev => ({ ...prev, zoom: e.target.value }))}
                  className="w-full accent-purple-600"
                />
              </div>
              <button
                onClick={uploadCroppedImage}
                disabled={uploadingImage}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crop & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <EmojiPickerMenu 
                    label="Emoji 1" 
                    value={emoji1} 
                    onChange={setEmoji1} 
                  />
                </div>
                <div>
                  <EmojiPickerMenu 
                    label="Emoji 2" 
                    value={emoji2} 
                    onChange={setEmoji2} 
                  />
                </div>
                <div className="col-span-2">
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

              <div className="col-span-4 mt-2 mb-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Image (WebP Compressed)</label>
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
