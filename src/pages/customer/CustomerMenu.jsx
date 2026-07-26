import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MenuGridSkeleton } from '../../components/SkeletonLoader';

import { 
  Search, Flame, Plus, Minus, Loader2, ShoppingCart, 
  ArrowRight, Sparkles, Filter, Check, LayoutGrid, List,
  Clock, ShieldCheck, Zap, UtensilsCrossed, Award, ChevronRight
} from 'lucide-react';

export default function CustomerMenu({ onOpenCart }) {
  const { cart, addToCart, updateCartQty, triggerHaptic } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const urlCat = searchParams.get('category') || 'all';

  const [categories, setCategories] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cg-cache-categories') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [inventory, setInventory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cg-cache-inventory') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [offers, setOffers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cg-cache-offers') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [activeCategory, setActiveCategory] = useState(urlCat);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'price-low' | 'price-high'
  const [loading, setLoading] = useState(() => {
    try {
      const cachedInv = localStorage.getItem('cg-cache-inventory');
      return !cachedInv || JSON.parse(cachedInv).length === 0;
    } catch (e) {
      return true;
    }
  });

  // Sync state when URL params change externally
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
    setActiveCategory(searchParams.get('category') || 'all');
  }, [searchParams]);

  // Update URL params when search query or category changes
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    const params = new URLSearchParams(searchParams);
    if (val.trim()) {
      params.set('q', val);
    } else {
      params.delete('q');
    }
    setSearchParams(params, { replace: true });
  };

  const handleCategoryChange = (catId) => {
    triggerHaptic?.(12);
    setActiveCategory(catId);
    const params = new URLSearchParams(searchParams);
    if (catId && catId !== 'all') {
      params.set('category', catId);
    } else {
      params.delete('category');
    }
    setSearchParams(params, { replace: true });
  };

  // Dynamic Google SEO Document Title
  useEffect(() => {
    if (searchQuery.trim()) {
      document.title = `Search "${searchQuery}" — Go Canteen Menu`;
    } else if (activeCategory !== 'all') {
      const catObj = categories.find(c => c.id === activeCategory);
      document.title = `${catObj ? catObj.name : 'Category'} — Go Canteen Menu`;
    } else {
      document.title = 'Go Canteen — Fresh Campus Food Ordering & Express Counter Pickup';
    }
  }, [searchQuery, activeCategory, categories]);


  // Framer-motion Flying Add-to-Cart Particles State
  const [flyingItems, setFlyingItems] = useState([]);

  const handleAddToCartWithAnim = (e, item) => {
    addToCart({ id: item.id, name: item.name, price: Number(item.price), emoji: item.emoji || '🍽️' });

    // Calculate start position from button click
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const animId = Date.now() + Math.random();
    setFlyingItems(prev => [...prev, { id: animId, emoji: item.emoji || '🍽️', startX, startY }]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(f => f.id !== animId));
    }, 750);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('customer-menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => fetchData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, invRes, offRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('inventory').select('*, categories(name)').eq('is_available', true).order('created_at'),
        supabase.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ]);

      const catData = catRes.data || [];
      const invData = invRes.data || [];
      const offData = offRes.data || [];

      setCategories(catData);
      setInventory(invData);
      setOffers(offData);

      localStorage.setItem('cg-cache-categories', JSON.stringify(catData));
      localStorage.setItem('cg-cache-inventory', JSON.stringify(invData));
      localStorage.setItem('cg-cache-offers', JSON.stringify(offData));
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || item.category_id === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
      return 0;
    });

  const getItemCartQty = (id) => {
    const item = cart.find(c => c.id === id);
    return item ? item.qty : 0;
  };

  const totalCartCount = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);

  if (loading) {

    return (
      <div className="space-y-6 pb-24 text-slate-900 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl animate-pulse">
          <div className="h-10 bg-slate-200 rounded-xl w-full" />
        </div>
        <MenuGridSkeleton count={8} />
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-24 text-slate-900 max-w-7xl mx-auto">
      
      {/* 1. Hero Promo Banner Showcase (Blinkit / Swiggy Desktop Header) */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl overflow-hidden border border-emerald-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent skew-x-12 transform translate-x-10 pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
              <span>Campus Counter Pickup • Express 10 Mins</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Fresh Canteen Eats, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-yellow-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Zero Waiting in Line.
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-lg leading-relaxed">
              Order delicious wraps, pizzas, beverages & combos online. Collect directly from counter with your unique token PIN!
            </p>
          </div>

          {/* Quick Stats Highlights */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl text-center">
              <span className="text-xl sm:text-2xl font-black text-yellow-400 block">10-15 Min</span>
              <span className="text-[10px] text-slate-300 uppercase font-extrabold tracking-wider">Avg Prep Time</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl text-center">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 block">100% Fresh</span>
              <span className="text-[10px] text-slate-300 uppercase font-extrabold tracking-wider">Hygienic Canteen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Search Engine Schema.org ItemList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": searchQuery ? `Search results for "${searchQuery}"` : "Go Canteen Food Menu",
            "description": "Order fresh fast food, wraps, beverages, rolls, and snacks online from Go Canteen.",
            "itemListElement": filteredInventory.map((item, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "MenuItem",
                "name": item.name,
                "description": item.description || `Fresh ${item.name} at Go Canteen`,
                "image": item.image_url || "https://gocanteen.in/aayush-profile.jpg",
                "offers": {
                  "@type": "Offer",
                  "price": item.price,
                  "priceCurrency": "INR",
                  "availability": item.is_available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                }
              }
            }))
          })
        }}
      />

      {/* 2. Modern Search & Multi-Filter Control Bar with Google SEO Integration */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="search"
              name="q"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search snacks, meals, cold drinks, combos (e.g. pizza, wrap)..."
              aria-label="Search canteen food menu"
              autoComplete="off"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 font-bold bg-slate-200 px-1.5 py-0.5 rounded-md cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
            
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-extrabold focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="popular">🔥 Sort: Popular</option>
              <option value="price-low">💰 Price: Low to High</option>
              <option value="price-high">💎 Price: High to Low</option>
            </select>

            {/* View Mode Toggle (Grid vs Compact List) */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>
        </form>

        {/* 3. Sleek Horizontal Category Bar (SEO Accessible Navigation) */}
        <nav aria-label="Food Categories" className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          
          {/* All Category Pill */}
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            aria-selected={activeCategory === 'all'}
            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <span>🍽️ All Items</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeCategory === 'all' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
              {inventory.length}
            </span>
          </button>

          {/* Hot Deals Category Pill */}
          {offers.length > 0 && (
            <button
              type="button"
              onClick={() => handleCategoryChange('offers')}
              aria-selected={activeCategory === 'offers'}
              className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeCategory === 'offers'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="animate-pulse">🔥 Special Offers</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-950 font-black">
                {offers.length}
              </span>
            </button>
          )}

          {/* Dynamic Categories */}
          {categories.map(cat => {
            const isSel = activeCategory === cat.id;
            const count = inventory.filter(i => i.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                aria-selected={isSel}
                className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSel
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{cat.emoji || '🍽️'} {cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isSel ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

      </div>


      {/* 4. Special Combo Offers Section */}
      {(activeCategory === 'all' || activeCategory === 'offers') && offers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">SPECIAL COMBO DEALS</h2>
            </div>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Limited Period Canteen Offers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => {
              const qty = getItemCartQty(offer.id);
              const savings = Number(offer.original_price || offer.price) - Number(offer.price);

              return (
                <div
                  key={offer.id}
                  className="bg-white border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl hover:border-amber-300 transition-all duration-300 relative group overflow-hidden shadow-2xs"
                >
                  <div className="space-y-3">
                    <div className="h-32 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-100/50 to-slate-50 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                      <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                        {offer.emoji || '🔥'}
                      </span>
                      
                      {offer.tag && (
                        <span className="absolute top-2.5 right-2.5 text-[10px] uppercase font-black text-amber-900 bg-amber-300 px-2 py-0.5 rounded-md shadow-xs">
                          {offer.tag}
                        </span>
                      )}

                      {savings > 0 && (
                        <span className="absolute bottom-2.5 left-2.5 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                          Save ₹{savings}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {offer.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                        {offer.description || offer.items_included}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900">₹{offer.price}</span>
                        {offer.original_price && (
                          <span className="text-xs line-through text-slate-400 font-semibold">₹{offer.original_price}</span>
                        )}
                      </div>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-3 py-1.5 font-bold shadow-md">
                        <button onClick={() => updateCartQty(offer.id, -1)} className="hover:opacity-80 p-0.5">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black px-1">{qty}</span>
                        <button onClick={() => updateCartQty(offer.id, 1)} className="hover:opacity-80 p-0.5">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart({ id: offer.id, name: offer.name, price: Number(offer.price), emoji: offer.emoji || '🔥' })}
                        className="px-5 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs transition-all shadow-2xs shrink-0"
                      >
                        + ADD
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Main Canteen Menu Items Section (Blinkit Desktop & Mobile Grid) */}
      {activeCategory !== 'offers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                {activeCategory === 'all' ? 'CANTEEN MENU ITEMS' : 'CATEGORY ITEMS'}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredInventory.length} fresh items
            </span>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
              <span className="text-4xl">🍽️</span>
              <h3 className="text-sm font-extrabold text-slate-900">No items match your filter</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try searching for a different dish or reset your Veg/Category filters.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-extrabold text-xs shadow-sm hover:bg-emerald-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Responsive Grid: 2 Columns on Mobile, 3 Columns on Tablet, 4 Columns on Laptop */
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
                : "grid grid-cols-1 gap-3"
            }>
              {filteredInventory.map((item, idx) => {
                const qty = getItemCartQty(item.id);

                if (viewMode === 'list') {
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: Math.min(idx * 0.02, 0.25) }}
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-3xl shrink-0">
                          {item.emoji || '🍽️'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-2xs ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                              <div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                            {item.tag && (
                              <span className="text-[9px] uppercase font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                          )}
                          <span className="text-sm font-black text-slate-900 mt-1 block">₹{item.price}</span>
                        </div>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-3 py-1.5 font-bold shadow-md">
                          <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-80 p-0.5">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black px-1">{qty}</span>
                          <button onClick={() => updateCartQty(item.id, 1)} className="hover:opacity-80 p-0.5">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCartWithAnim(e, item)}
                          className="px-5 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95"
                        >
                          + ADD
                        </button>
                      )}
                    </motion.div>
                  );
                }

                return (
                  /* Premium Bento Box Grid Card Layout with framer-motion */
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(idx * 0.025, 0.3) }}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:shadow-xl hover:border-emerald-300 transition-all duration-300 shadow-2xs group relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      
                      {/* Top Visual Container with subtle gradient & hover zoom */}
                      <div className="h-28 sm:h-36 rounded-xl bg-gradient-to-br from-emerald-500/5 via-slate-100 to-amber-500/5 flex items-center justify-center relative overflow-hidden group-hover:from-emerald-500/10 group-hover:to-teal-500/10 transition-colors">
                        <span className="text-4xl sm:text-6xl group-hover:scale-110 transition-transform duration-300">
                          {item.emoji || '🍽️'}
                        </span>

                        {/* Veg / Non-Veg Indicator Dot */}
                        <div className={`absolute top-2.5 left-2.5 w-4 h-4 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-xs ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                          <div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                        </div>

                        {/* Tag Badge */}
                        {item.tag && (
                          <span className="absolute top-2.5 right-2.5 text-[9px] uppercase font-black text-slate-800 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs">
                            {item.tag}
                          </span>
                        )}
                      </div>

                      {/* Title & Category Tag */}
                      <div className="pt-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
                            {item.name}
                          </h3>
                        </div>
                        {item.categories?.name && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                            {item.categories.name}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Row: Price & Stepper / ADD Button */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-sm sm:text-base font-black text-slate-900">
                          ₹{item.price}
                        </span>
                      </div>

                      {qty > 0 ? (
                        <div className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-2.5 py-1.5 font-bold text-xs shadow-md">
                          <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-80 p-0.5">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black px-1">{qty}</span>
                          <button
                            onClick={(e) => {
                              updateCartQty(item.id, 1);
                              handleAddToCartWithAnim(e, item);
                            }}
                            className="hover:opacity-80 p-0.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleAddToCartWithAnim(e, item)}
                          className="px-4 py-1.5 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Framer-Motion Enhanced Flying Cart Emoji Particles & Floating +1 Badge */}
      <AnimatePresence>
        {flyingItems.map(f => {
          const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;
          const targetX = isMobileView ? window.innerWidth / 2 : window.innerWidth - 65;
          const targetY = isMobileView ? window.innerHeight - 50 : 22;
          const midX = (f.startX + targetX) / 2;
          const midY = isMobileView
            ? Math.min(window.innerHeight - 20, (f.startY + targetY) / 2 + 30)
            : Math.max(20, f.startY - 140);

          return (
            <div key={f.id}>
              {/* Flying Food Emoji with Responsive Arc (Downward on Mobile, Upward on Desktop) */}
              <motion.div
                initial={{
                  x: f.startX - 24,
                  y: f.startY - 24,
                  scale: 1,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  x: [f.startX - 24, midX, targetX],
                  y: [f.startY - 24, midY, targetY],
                  scale: [1.2, 1.6, 0.25],
                  rotate: [0, 180, 360],
                  opacity: [1, 1, 0.2]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 z-50 pointer-events-none text-2xl bg-gradient-to-tr from-yellow-400 to-amber-300 border-2 border-slate-900 rounded-full p-2.5 shadow-2xl flex items-center justify-center ring-4 ring-yellow-400/40"
              >
                {f.emoji}
              </motion.div>

              {/* Floating +1 Added Badge */}
              <motion.div
                initial={{
                  x: f.startX - 20,
                  y: f.startY - 35,
                  scale: 0.8,
                  opacity: 1
                }}
                animate={{
                  y: isMobileView ? f.startY + 40 : f.startY - 80,
                  scale: 1.2,
                  opacity: 0
                }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="fixed top-0 left-0 z-50 pointer-events-none text-[11px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-400 px-2.5 py-0.5 rounded-full shadow-lg backdrop-blur-xs flex items-center gap-1"
              >
                <span>+1</span>
                <span>Added</span>
              </motion.div>
            </div>
          );
        })}

      </AnimatePresence>

      {/* 6. Mobile Floating Sticky Cart Bar (Swiggy / Blinkit style) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-3 right-3 z-40 sm:hidden animate-fade-in">
          <div
            onClick={onOpenCart}
            className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-emerald-500/40 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-xs">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                  <span>{totalCartCount} {totalCartCount === 1 ? 'ITEM' : 'ITEMS'}</span>
                  <span className="text-emerald-300">•</span>
                  <span className="text-yellow-300 text-sm font-black">₹{totalCartPrice}</span>
                </div>
                <div className="text-[10px] text-emerald-200 font-medium">Tap to review cart & checkout</div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-black bg-yellow-400 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-xs">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
