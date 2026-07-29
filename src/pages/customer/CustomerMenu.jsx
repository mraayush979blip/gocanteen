import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { MenuGridSkeleton } from '../../components/SkeletonLoader';

import { 
  Search, Flame, Plus, Minus, Loader2, ShoppingCart, 
  ArrowRight, Sparkles, Filter, Check, LayoutGrid, List,
  Clock, ShieldCheck, Zap, UtensilsCrossed, Award, ChevronRight, ChevronUp, ChevronLeft, X
} from 'lucide-react';

export default function CustomerMenu({ onOpenCart }) {
  const { cart, addToCart, updateCartQty, triggerHaptic, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const urlCat = searchParams.get('category') || 'all';

  const queryClient = useQueryClient();

  const { data: menuData, isLoading: loading } = useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const [catRes, invRes, offRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('inventory').select('*, categories(name)').eq('is_available', true).order('created_at'),
        supabase.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ]);
      return {
        categories: catRes.data || [],
        inventory: invRes.data || [],
        offers: offRes.data || []
      };
    },
  });

  const categories = menuData?.categories || [];
  const inventory = menuData?.inventory || [];
  const offers = menuData?.offers || [];

  const [activeCategory, setActiveCategory] = useState(urlCat);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'price-low' | 'price-high'

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  
  // New features state
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [recentOrders, setRecentOrders] = useState([]);
  const [featuredFilter, setFeaturedFilter] = useState(''); // 'popular' | 'new' | 'under99' | ''
  const [selectedItem, setSelectedItem] = useState(null); // Instamart-style item detail popup

  const sectionRefs = useRef({});

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      
      if (scrolled > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
      
      if (height > 0) {
        const rawProgress = (scrolled / height) * 100;
        const progress = Math.min(Math.max(rawProgress, 0), 100);
        setScrollProgress(isNaN(progress) ? 0 : progress);
      } else {
        setScrollProgress(0);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    triggerHaptic?.(10);
  };

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

    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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

  const triggerFlyingAnimation = (e, emoji) => {
    // Calculate start position from button click
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const animId = Date.now() + Math.random();
    setFlyingItems(prev => [...prev, { id: animId, emoji: emoji || '🍽️', startX, startY }]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(f => f.id !== animId));
    }, 750);
  };

  const handleAddToCartWithAnim = (e, item) => {
    const cat = categories.find(c => c.id === item.category_id);
    addToCart({ 
      id: item.id, 
      name: item.name, 
      price: Number(item.price), 
      emoji: item.emoji || '🍽️',
      has_packaging_charge: cat ? cat.has_packaging_charge : false
    });
    triggerFlyingAnimation(e, item.emoji);
  };

  useEffect(() => {
    const channel = supabase
      .channel('customer-menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => queryClient.invalidateQueries(['menu']))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => queryClient.invalidateQueries(['menu']))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => queryClient.invalidateQueries(['menu']))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      if (!session?.user?.id) return;
      try {
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (error || !ordersData?.length) return;
        
        const orderIds = ordersData.map(o => o.id);
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('inventory_id, item_name, inventory(name, emoji, price)')
          .in('order_id', orderIds);
          
        if (itemsData) {
          // Get unique items
          const uniqueItems = [];
          const seenIds = new Set();
          itemsData.forEach(item => {
            if (item.inventory_id && !seenIds.has(item.inventory_id)) {
              seenIds.add(item.inventory_id);
              // Find matching inventory item
              const invItem = inventory.find(i => i.id === item.inventory_id);
              if (invItem) uniqueItems.push(invItem);
            }
          });
          setRecentOrders(uniqueItems.slice(0, 5)); // Top 5 recent unique items
        }
      } catch (err) {
        console.error('Error fetching recent orders:', err);
      }
    };
    
    if (inventory.length > 0) {
      fetchRecentOrders();
    }
  }, [session?.user?.id, inventory]);

  // Fuzzy matching score calculator for canteen search queries
  const getFuzzyScore = (text, query) => {
    const cleanText = text.toLowerCase();
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return 1;
    if (cleanText.includes(cleanQuery)) return 10; // Exact substring match is highest score
    
    // Levenshtein / Token Distance calculation for typo correction
    let score = 0;
    const queryWords = cleanQuery.split(/\s+/);
    const textWords = cleanText.split(/\s+/);
    
    queryWords.forEach(qw => {
      textWords.forEach(tw => {
        if (tw.startsWith(qw)) score += 5; // Prefix match
        else if (tw.includes(qw)) score += 3; // Partial match
      });
    });
    return score;
  };

  const checkFeaturedFilter = (item) => {
    if (!featuredFilter) return true;
    const lowerTag = (item.tag || '').toLowerCase();
    switch (featuredFilter) {
      case 'popular':
        return lowerTag.includes('popular') || lowerTag.includes('bestseller') || lowerTag.includes('trending');
      case 'bestseller':
        return lowerTag.includes('bestseller');
      case 'new':
        return lowerTag.includes('new');
      case 'under99':
        return Number(item.price) < 99;
      default:
        return true;
    }
  };

  const filteredInventory = inventory
    .filter(item => {
      if (!checkFeaturedFilter(item)) return false;

      if (!searchQuery.trim()) {
        return activeCategory === 'all' || item.category_id === activeCategory;
      }
      // Apply fuzzy matching score thresholds (matches must score > 0)
      const nameScore = getFuzzyScore(item.name, searchQuery);
      const descScore = item.description ? getFuzzyScore(item.description, searchQuery) : 0;
      const tagScore = item.tag ? getFuzzyScore(item.tag, searchQuery) : 0;
      
      const matchesSearch = (nameScore + descScore + tagScore) > 0;
      const matchesCategory = activeCategory === 'all' || item.category_id === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // If a search query is active, sort primary results by fuzzy match score
      if (searchQuery.trim()) {
        const scoreA = getFuzzyScore(a.name, searchQuery) + (a.tag ? getFuzzyScore(a.tag, searchQuery) : 0);
        const scoreB = getFuzzyScore(b.name, searchQuery) + (b.tag ? getFuzzyScore(b.tag, searchQuery) : 0);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
      return 0;
    });

  // Grouped view: all items organised by category (Swiggy-style anchor sections)
  const groupedByCategory = categories.map(cat => ({
    ...cat,
    items: inventory
      .filter(i => i.category_id === cat.id && checkFeaturedFilter(i))
      .sort((a, b) => {
        if (sortBy === 'price-low') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-high') return Number(b.price) - Number(a.price);
        return 0;
      })
  })).filter(g => g.items.length > 0);

  const isGroupedMode = activeCategory === 'all' && !searchQuery.trim();

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

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>



        {/* 3. Sticky Scrollspy Category Bar */}
        <nav aria-label="Food Categories" className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none relative">

          {/* All Items pill — active when in grouped mode with no section highlighted */}
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            aria-selected={activeCategory === 'all'}
            className={`relative px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white border-transparent shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
            }`}
          >
            <span className="relative z-10">🍽️ All Items</span>
            <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeCategory === 'all' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-600'
            }`}>
              {inventory.length}
            </span>
          </button>

          {/* Special Offers pill */}
          {offers.length > 0 && (
            <button
              type="button"
              onClick={() => handleCategoryChange('offers')}
              aria-selected={activeCategory === 'offers'}
              className={`relative px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                activeCategory === 'offers'
                  ? 'bg-amber-500 text-slate-950 border-transparent shadow-md'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
              }`}
            >
              <span className="relative z-10 animate-pulse">🔥 Combo Deals</span>
              <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                activeCategory === 'offers' ? 'bg-amber-200 text-amber-950' : 'bg-amber-100 text-amber-900'
              }`}>
                {offers.length}
              </span>
            </button>
          )}

          {/* Dynamic Category pills — scroll anchors in grouped mode, filters otherwise */}
          {categories.map(cat => {
            const count = inventory.filter(i => i.category_id === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                aria-selected={isActive}
                className={`relative px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-transparent shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
              >
                <span className="relative z-10">{cat.emoji || '🍽️'} {cat.name}</span>
                <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                }`}>
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

              return (() => {
                const cardGradients = [
                  'from-amber-50/80 via-orange-50/40 to-white border-amber-200/60',
                  'from-violet-50/80 via-purple-50/40 to-white border-violet-200/60',
                  'from-rose-50/80 via-pink-50/40 to-white border-rose-200/60',
                ];
                const gradient = cardGradients[offers.indexOf(offer) % cardGradients.length];
                return (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedItem(offer)}
                    className={`bg-gradient-to-br ${gradient} border rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative group overflow-hidden shadow-2xs cursor-pointer`}
                  >
                    <div className="space-y-3">
                      <div className="h-32 rounded-xl bg-white/60 backdrop-blur-sm border border-white/85 flex items-center justify-center relative overflow-hidden group-hover:bg-white/80 transition-colors shadow-inner">
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
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

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
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
                          <button onClick={() => updateCartQty(offer.id, -1)} className="hover:opacity-85 p-0.5">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black px-1">{qty}</span>
                          <button onClick={() => updateCartQty(offer.id, 1)} className="hover:opacity-85 p-0.5">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart({ id: offer.id, name: offer.name, price: Number(offer.price), emoji: offer.emoji || '🔥', has_packaging_charge: true })}
                          className="px-5 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs transition-all shadow-2xs shrink-0"
                        >
                          + ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })();
            })}
          </div>
        </div>
      )}

      {/* 5. Main Canteen Menu Items Section */}
      {activeCategory !== 'offers' && (
        <div className="space-y-3">

          {/* ── GROUPED MODE (All + no search): Swiggy-style anchor sections ── */}
          {isGroupedMode ? (
            <div className="space-y-10">

              {/* Order Again Strip */}
              {recentOrders.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xl">🔄</span>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Order Again</h2>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                    {recentOrders.map((item, idx) => {
                      const qty = getItemCartQty(item.id);
                      return (
                        <div key={`recent-${item.id}`} className="snap-start shrink-0 w-40 bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between shadow-xs relative overflow-hidden">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">{item.emoji || '🍽️'}</div>
                            <div className="flex flex-col">
                              <h3 className="text-xs font-black text-slate-900 line-clamp-1">{item.name}</h3>
                              <span className="text-xs font-black text-slate-700">₹{item.price}</span>
                            </div>
                          </div>
                          {qty > 0 ? (
                            <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg px-2 py-1 font-bold shadow-sm justify-center mt-1">
                              <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5"><Minus className="w-3 h-3" /></button>
                              <span className="text-[10px] font-black px-1">{qty}</span>
                              <button onClick={(e) => { updateCartQty(item.id, 1); triggerFlyingAnimation(e, item.emoji); }} className="hover:opacity-85 p-0.5"><Plus className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <button onClick={(e) => handleAddToCartWithAnim(e, item)} className="w-full px-2 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 bg-emerald-50 font-black text-[10px] active:scale-95 mt-1 transition-transform">
                              + ADD
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Popular Today Strip */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xl">⭐</span>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">Popular Today</h2>
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                  {inventory
                    .filter(i => i.is_popular)
                    .map((item, idx) => {
                      const qty = getItemCartQty(item.id);
                      return (() => {
                        const cardGradients = [
                          'from-amber-50/80 via-orange-50/40 to-white border-amber-200/60',
                          'from-emerald-50/80 via-teal-50/40 to-white border-emerald-200/60',
                          'from-violet-50/80 via-purple-50/40 to-white border-violet-200/60',
                          'from-sky-50/80 via-blue-50/40 to-white border-sky-200/60',
                        ];
                        const gradient = cardGradients[idx % cardGradients.length];
                        return (
                          <div
                            key={`popular-${item.id}`}
                            onClick={() => setSelectedItem(item)}
                            className={`snap-start shrink-0 w-64 bg-gradient-to-br ${gradient} border rounded-2xl p-3 flex flex-col justify-between hover:shadow-xl transition-all duration-300 shadow-sm group relative overflow-hidden cursor-pointer`}
                          >
                            <div className="space-y-2">
                              <div className="h-28 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 flex items-center justify-center relative overflow-hidden group-hover:bg-white/80 transition-colors shadow-inner">
                                <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{item.emoji || '🍽️'}</span>
                                <span className="absolute top-2 right-2 text-[9px] uppercase font-black text-amber-900 bg-amber-300 px-2 py-0.5 rounded shadow-sm">Bestseller</span>
                              </div>
                              <h3 className="text-sm font-black text-slate-900 line-clamp-1">{item.name}</h3>
                              {item.description && <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>}
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                              <span className="text-sm font-black text-slate-900">₹{item.price}</span>
                              {qty > 0 ? (
                                <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg px-2 py-1.5 font-bold shadow-sm">
                                  <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5"><Minus className="w-3 h-3" /></button>
                                  <span className="text-xs font-black px-1">{qty}</span>
                                  <button onClick={(e) => { updateCartQty(item.id, 1); triggerFlyingAnimation(e, item.emoji); }} className="hover:opacity-85 p-0.5"><Plus className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-4 py-1.5 rounded-lg border-2 border-emerald-600 text-emerald-700 bg-emerald-50 font-black text-xs active:scale-95 transition-transform">
                                  + ADD
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })();
                  })}
                </div>
              </div>



              {/* Category sections */}
              {groupedByCategory.map(cat => (
                <div
                  key={cat.id}
                  data-cat-id={cat.id}
                  ref={el => { sectionRefs.current[cat.id] = el; }}
                  style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px' }}
                >
                  {/* Sticky section header */}
                  <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-sm py-2 mb-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.emoji || '🍽️'}</span>
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">{cat.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{cat.items.length} items</span>
                      <button 
                        onClick={() => {
                          setActiveCategory(cat.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-[11px] font-black text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        View All
                      </button>
                    </div>
                  </div>

                  {/* Items horizontal strip */}
                  <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
                    {cat.items.map((item) => {
                      const qty = getItemCartQty(item.id);
                      
                      const renderTag = (tag) => {
                        if (!tag) return null;
                        const lowerTag = tag.toLowerCase();
                        let colorClass = 'text-slate-700 bg-slate-100';
                        if (lowerTag.includes('bestseller') || lowerTag.includes('popular')) colorClass = 'text-amber-900 bg-amber-200';
                        else if (lowerTag.includes('trending')) colorClass = 'text-orange-900 bg-orange-200';
                        else if (lowerTag.includes('new')) colorClass = 'text-blue-900 bg-blue-100 border border-blue-200';
                        else if (lowerTag.includes('value') || lowerTag.includes('discount')) colorClass = 'text-emerald-900 bg-emerald-100 border border-emerald-200';
                        
                        return <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md shadow-2xs ${colorClass}`}>{tag}</span>;
                      };

                      return (() => {
                        const cardGradients = [
                          'from-amber-50/80 via-orange-50/50 to-white border-amber-200/70',
                          'from-emerald-50/80 via-teal-50/50 to-white border-emerald-200/70',
                          'from-violet-50/80 via-purple-50/50 to-white border-violet-200/70',
                          'from-sky-50/80 via-blue-50/50 to-white border-sky-200/70',
                          'from-rose-50/80 via-pink-50/50 to-white border-rose-200/70',
                          'from-lime-50/80 via-green-50/50 to-white border-lime-200/70',
                        ];
                        const gradient = cardGradients[cat.items.indexOf(item) % cardGradients.length];
                        return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`shrink-0 w-64 snap-start bg-gradient-to-br ${gradient} border rounded-2xl p-3 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-xs group relative cursor-pointer`}
                        >
                          <div className="space-y-2">
                            <div className="h-28 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 flex items-center justify-center relative overflow-hidden group-hover:bg-white/80 transition-colors shadow-inner">
                              <span className="text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{item.emoji || '🍽️'}</span>
                              <div className={`absolute top-2 left-2 w-3.5 h-3.5 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-sm ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}><div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></div>
                              <div className="absolute top-2 right-2">{renderTag(item.tag)}</div>
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-1">{item.name}</h3>
                              {item.description && <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>}
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-base font-black text-slate-900">₹{item.price}</span>
                            <div onClick={(e) => e.stopPropagation()}>
                              {qty > 0 ? (
                                <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-lg px-2 py-1 font-bold shadow-sm">
                                  <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5"><Minus className="w-3 h-3" /></button>
                                  <span className="text-xs font-black px-1">{qty}</span>
                                  <button onClick={(e) => { updateCartQty(item.id, 1); triggerFlyingAnimation(e, item.emoji); }} className="hover:opacity-85 p-0.5"><Plus className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <button onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-4 py-1.5 rounded-lg border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-[11px] active:scale-95 transition-transform shadow-2xs">+ ADD</button>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })();
                    })}
                  </div>
                </div>
              ))}
            </div>

          ) : (
            /* ── FILTERED / SEARCH MODE: flat grid (current behaviour) ── */
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeCategory !== 'all' && !searchQuery && activeCategory !== 'offers' ? (
                    <>
                      <button onClick={() => setActiveCategory('all')} className="p-1 -ml-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer" title="Back to All Menu">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <span className="text-xl ml-1">{categories.find(c => c.id === activeCategory)?.emoji}</span>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                        {categories.find(c => c.id === activeCategory)?.name || 'Category'}
                      </h2>
                    </>
                  ) : (
                    <>
                      <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">Results</h2>
                    </>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-500">Showing {filteredInventory.length} items</span>
              </div>

              {filteredInventory.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-2xs">
                  <span className="text-4xl">🍽️</span>
                  <h3 className="text-sm font-extrabold text-slate-900">No items match your filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Try searching for a different dish or reset filters.</p>
                  <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-extrabold text-xs shadow-sm hover:bg-emerald-700 transition-colors">Reset All Filters</button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5' : 'grid grid-cols-1 gap-3'}>
                  {filteredInventory.map((item, idx) => {
                    const qty = getItemCartQty(item.id);
                    if (viewMode === 'list') {
                      return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: Math.min(idx * 0.02, 0.25) }} onClick={() => setSelectedItem(item)} className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all shadow-2xs cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 flex items-center justify-center text-3xl shrink-0 shadow-inner">{item.emoji || '🍽️'}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className={`w-3.5 h-3.5 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-2xs ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}><div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></div>
                                <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                                {item.tag && <span className="text-[9px] uppercase font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{item.tag}</span>}
                              </div>
                              {item.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>}
                              <span className="text-sm font-black text-slate-900 mt-1 block">₹{item.price}</span>
                            </div>
                          </div>
                          <motion.div layout className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            {qty > 0 ? (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-3 py-1.5 font-bold shadow-md">
                                <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                                <span className="text-xs font-black px-1">{qty}</span>
                                <button onClick={() => updateCartQty(item.id, 1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                              </motion.div>
                            ) : (
                              <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-5 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95">+ ADD</motion.button>
                            )}
                          </motion.div>
                        </motion.div>
                      );
                    }
                    return (() => {
                      const cardGradients = [
                        'from-amber-50/80 via-orange-50/40 to-white border-amber-200/60',
                        'from-emerald-50/80 via-teal-50/40 to-white border-emerald-200/60',
                        'from-violet-50/80 via-purple-50/40 to-white border-violet-200/60',
                        'from-sky-50/80 via-blue-50/40 to-white border-sky-200/60',
                        'from-rose-50/80 via-pink-50/40 to-white border-rose-200/60',
                        'from-lime-50/80 via-green-50/40 to-white border-lime-200/60',
                      ];
                      const gradient = cardGradients[idx % cardGradients.length];
                      return (
                      <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: Math.min(idx * 0.025, 0.3) }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setSelectedItem(item)} className={`bg-gradient-to-br ${gradient} border rounded-2xl p-4 flex flex-col justify-between hover:shadow-xl transition-all duration-300 shadow-sm group relative overflow-hidden cursor-pointer`}>
                        <div className="space-y-3 z-10">
                          <div className="h-32 sm:h-40 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 flex items-center justify-center relative overflow-hidden group-hover:bg-white/80 transition-colors shadow-inner">
                            <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-5xl sm:text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">{item.emoji || '🍽️'}</motion.span>
                            <div className={`absolute top-3 left-3 w-5 h-5 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-sm ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}><div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></div>
                            {item.tag && <span className="absolute top-3 right-3 text-[10px] uppercase font-black text-slate-800 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-200/80 shadow-sm">{item.tag}</span>}
                          </div>
                          <div className="pt-2">
                            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">{item.name}</h3>
                            {item.categories?.name && <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest block mt-1">{item.categories.name}</span>}
                          </div>
                          {item.description && <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>}
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 z-10" onClick={(e) => e.stopPropagation()}>
                          <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">₹{item.price}</span>
                          <motion.div layout className="flex items-center">
                            {qty > 0 ? (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-3 py-1.5 font-bold text-sm shadow-md">
                                <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-4 h-4" /></button>
                                <span className="text-sm font-black px-1.5">{qty}</span>
                                <button onClick={(e) => { updateCartQty(item.id, 1); triggerFlyingAnimation(e, item.emoji); }} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-4 h-4" /></button>
                              </motion.div>
                            ) : (
                              <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-5 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs sm:text-sm transition-all shadow-sm shrink-0 cursor-pointer active:scale-95">+ ADD</motion.button>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                      );
                    })();
                  })}
                </div>
              )}
            </>
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
      <AnimatePresence>
        {totalCartCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scaleY: 0.5, transformOrigin: "bottom center" }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: 50, scaleY: 0.5 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-4 left-3 right-3 z-40 sm:hidden origin-bottom"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
      {/* 7. Instamart-Style Item Detail Popup (Mac Genie Lamp Animation) */}
      <AnimatePresence>
        {selectedItem && (() => {
          const item = selectedItem;
          const qty = getItemCartQty(item.id);
          const cat = categories.find(c => c.id === item.category_id);
          const detailGradients = [
            'from-amber-100 via-orange-50 to-amber-50',
            'from-emerald-100 via-teal-50 to-emerald-50',
            'from-violet-100 via-purple-50 to-violet-50',
            'from-sky-100 via-blue-50 to-sky-50',
            'from-rose-100 via-pink-50 to-rose-50',
          ];
          const heroGradient = detailGradients[item.name.length % detailGradients.length];
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ 
                  y: "100%", 
                  scaleX: 0.35, 
                  scaleY: 0.15, 
                  borderRadius: "100px",
                  opacity: 0 
                }}
                animate={{ 
                  y: 0, 
                  scaleX: 1, 
                  scaleY: 1, 
                  borderRadius: typeof window !== 'undefined' && window.innerWidth >= 640 ? "24px" : "24px 24px 0 0",
                  opacity: 1 
                }}
                exit={{ 
                  y: "100%", 
                  scaleX: 0.2, 
                  scaleY: 0.05, 
                  borderRadius: "100px",
                  opacity: 0 
                }}
                transition={{ 
                  type: "spring",
                  damping: 24,
                  stiffness: 240
                }}
                className="bg-white w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative origin-bottom"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Hero Emoji Section */}
                <div className={`bg-gradient-to-br ${heroGradient} px-6 pt-10 pb-8 flex flex-col items-center gap-3 relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0%, transparent 50%)' }} />
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                    transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
                    className="text-8xl sm:text-9xl drop-shadow-md relative z-10"
                  >
                    {item.emoji || '🍽️'}
                  </motion.span>
                  {item.tag && (
                    <span className="text-[10px] uppercase font-black bg-white/80 backdrop-blur-sm text-slate-800 px-3 py-1 rounded-full border border-slate-200/80 shadow-sm relative z-10">{item.tag}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                  {/* Title & Badges */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{item.name}</h2>
                      <div className={`w-6 h-6 rounded-sm border bg-white flex items-center justify-center p-0.5 shadow-sm shrink-0 mt-1 ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                        <div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {cat && (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 uppercase tracking-wider">
                          {cat.emoji || '🍽️'} {cat.name}
                        </span>
                      )}
                      {!item.is_veg && (
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider text-red-800 bg-red-50 border-red-200">
                          🍗 Non-Veg
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">About this item</span>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.description}</p>
                    </div>
                  )}

                  {/* Quick Info */}
                  <div className="flex items-center gap-3 py-3 border-y border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>10-15 min prep</span>
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hygiene certified</span>
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Add-to-Cart Bar */}
                <div className="border-t border-slate-100 bg-white px-6 py-4 flex items-center justify-between gap-4 shrink-0">
                  <div>
                    <span className="text-2xl font-black text-slate-900">₹{item.price}</span>
                    {item.tag && <span className="text-[10px] text-slate-400 font-bold block">{item.tag}</span>}
                  </div>
                  {qty > 0 ? (
                    <div className="flex items-center gap-3 bg-emerald-600 text-white rounded-2xl px-5 py-3 font-bold shadow-lg">
                      <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-5 h-5" /></button>
                      <span className="text-lg font-black px-2">{qty}</span>
                      <button onClick={(e) => { updateCartQty(item.id, 1); triggerFlyingAnimation(e, item.emoji); }} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-5 h-5" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { handleAddToCartWithAnim(e, item); }}
                      className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                      + ADD TO CART
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>



    </div>
  );
}
