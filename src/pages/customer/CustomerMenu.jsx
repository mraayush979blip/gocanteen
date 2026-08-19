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
import { optimizeImage } from '../../lib/imageOptimizer';

export default function CustomerMenu({ onOpenCart }) {
  const { cart, addToCart, updateCartQty, triggerHaptic, session, selectedOutlet, outlets } = useAuth();
  const currentOutlet = outlets?.find(o => o.id === selectedOutlet);
  const isOutletOpen = currentOutlet?.status === 'open' || !currentOutlet?.status; // default to open if undefined
  const outletStatus = currentOutlet?.status;
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') || '';
  const urlCat = searchParams.get('category') || 'all';

  const queryClient = useQueryClient();

  const { data: menuData, isLoading: loading } = useQuery({
    queryKey: ['menu', selectedOutlet],
    queryFn: async () => {
      const [catRes, invRes, offRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('inventory').select('*, categories(name)').order('created_at'), // Fetch all, we filter after
        supabase.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false })
      ]);

      let items = invRes.data || [];

      if (selectedOutlet && items.length > 0) {
        const { data: availData, error: availErr } = await supabase
          .from('inventory_availability')
          .select('item_id, is_available')
          .eq('outlet_id', selectedOutlet);

        if (!availErr && availData) {
          const availMap = {};
          availData.forEach(a => availMap[a.item_id] = a.is_available);
          items = items.map(item => ({
            ...item,
            is_available: availMap[item.id] !== undefined ? availMap[item.id] : item.is_available
          }));
        }
      }

      // Filter to only show available items
      items = items.filter(item => item.is_available);

      return {
        categories: catRes.data || [],
        inventory: items,
        offers: offRes.data || []
      };
    },
    staleTime: 1000 * 30, // 30 seconds (instantly loads from cache, but fetches fresh data in bg)
    gcTime: 1000 * 60 * 60, // 1 hour cache
    refetchOnWindowFocus: false, // Prevents aggressive refetching
    retry: 2 // Retry a few times if the network is flaky
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
  const [selectedItem, setSelectedItem] = useState(null);
  const [popupTouchStart, setPopupTouchStart] = useState(null); // Instamart-style item detail popup
  const [isCartExpanded, setIsCartExpanded] = useState(false); // Floating circular cart state

  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    
    // Check if horizontal swipe is dominant to avoid triggering during scroll
    if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      const filterTabs = ['all', 'offers', ...categories.map(c => c.id)];
      const currentIndex = filterTabs.indexOf(activeCategory);
      
      if (isLeftSwipe && currentIndex < filterTabs.length - 1) {
        setActiveCategory(filterTabs[currentIndex + 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (isRightSwipe && currentIndex > 0) {
        setActiveCategory(filterTabs[currentIndex - 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const [visibleCount, setVisibleCount] = useState(12);
  const observerTarget = useRef(null);

  useEffect(() => {
    setVisibleCount(12);
  }, [activeCategory, searchQuery, featuredFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 12);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget.current]);

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

  // Lock body scrolling & touch movement when item detail popup is active to prevent background scrolling
  useEffect(() => {
    if (selectedItem) {
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    };
  }, [selectedItem]);

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
    setFlyingItems(prev => [...prev, { id: animId, emoji: emoji || '', startX, startY }]);

    setTimeout(() => {
      setFlyingItems(prev => prev.filter(f => f.id !== animId));
    }, 750);
  };

  const handleAddToCartWithAnim = (e, item) => {
    if (!isOutletOpen) return;
    const cat = categories.find(c => c.id === item.category_id);
    addToCart({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      emoji: item.emoji || '',
      image_url: item.image_url,
      has_packaging_charge: cat ? cat.has_packaging_charge : false
    });
    triggerFlyingAnimation(e, item.emoji);
  };

  // Removed Supabase Realtime subscription here to protect Supabase Free Tier limits.
  // The 30-second staleTime background refetching is much safer and scales better for 200+ students.

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
      <div className="space-y-6 pb-24 text-slate-900 max-w-7xl mx-auto px-4 sm:px-0">
        {/* Flashing Instamart-style Banner */}
        <div className="h-32 sm:h-40 bg-slate-300/60 rounded-3xl w-full animate-pulse mt-4 shadow-sm" />
        
        {/* Flashing Search Bar */}
        <div className="h-14 bg-slate-300/60 rounded-2xl w-full animate-pulse mt-6 shadow-sm" />
        
        {/* Flashing Category Pills */}
        <div className="flex gap-3 overflow-hidden mt-6 pb-2">
           <div className="h-11 w-28 bg-slate-300/60 rounded-full animate-pulse flex-shrink-0 shadow-sm" />
           <div className="h-11 w-36 bg-slate-300/60 rounded-full animate-pulse flex-shrink-0 shadow-sm" />
           <div className="h-11 w-24 bg-slate-300/60 rounded-full animate-pulse flex-shrink-0 shadow-sm" />
           <div className="h-11 w-32 bg-slate-300/60 rounded-full animate-pulse flex-shrink-0 shadow-sm" />
           <div className="h-11 w-28 bg-slate-300/60 rounded-full animate-pulse flex-shrink-0 shadow-sm" />
        </div>
        
        {/* Flashing Menu Items */}
        <div className="mt-8 space-y-4">
           <div className="h-6 w-40 bg-slate-300/80 rounded-md animate-pulse" />
           <MenuGridSkeleton count={8} />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-24 text-slate-900 max-w-7xl mx-auto">

      {/* 1. Minimal Header */}
      <div className="bg-white rounded-[1.5rem] p-4 sm:p-6 border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Welcome to Go Canteen</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Express campus pickup • Zero wait time.</p>
          </div>
        </div>
      </div>

      {/* Outlet Status Banner */}
      {!isOutletOpen && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm border ${
          currentOutlet?.status === 'holiday' 
            ? 'bg-amber-50 border-amber-200 text-amber-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span className="text-2xl">{currentOutlet?.status === 'holiday' ? '🏖️' : '🔒'}</span>
          <div>
            <h3 className="font-black text-lg leading-tight">
              {currentOutlet?.status === 'holiday' ? 'Canteen is on Holiday' : 'Canteen is Closed'}
            </h3>
            <p className="text-sm font-medium opacity-90">
              You cannot place orders at this time.
            </p>
          </div>
        </div>
      )}

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
              <option value="popular">Sort: Popular</option>
              <option value="price-low">Price: Low to High</option>
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
            className={`relative px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${activeCategory === 'all'
                ? 'bg-slate-900 text-white border-transparent shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              }`}
          >
            <span className="relative z-10">All Items</span>
            <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeCategory === 'all' ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-600'
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
              className={`relative px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${activeCategory === 'offers'
                  ? 'bg-amber-500 text-slate-950 border-transparent shadow-md'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200'
                }`}
            >
              <span className="relative z-10 animate-pulse">Combo Deals</span>
              <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeCategory === 'offers' ? 'bg-amber-200 text-amber-950' : 'bg-amber-100 text-amber-900'
                }`}>
              {offers.length}
              </span>
            </button>
          )}

          {/* Dynamic Category pills — scroll anchors in grouped mode, filters otherwise */}
          {categories.map(cat => {
            const count = inventory.filter(i => i.category_id === cat.id).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                aria-selected={isActive}
                className={`relative px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${isActive
                    ? 'bg-emerald-600 text-white border-transparent shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
              >
                <span className="relative z-10">{cat.emoji ? cat.emoji + ' ' : ''}{cat.name}</span>
                <span className={`relative z-10 text-[10px] px-1.5 py-0.5 rounded-full font-black ${isActive ? 'bg-yellow-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

      </div>


      {/* 4. Special Combo Offers Section */}
      {(activeCategory === 'all' || activeCategory === 'offers') && !searchQuery.trim() && offers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 overflow-x-auto scrollbar-none pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 sm:pb-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">SPECIAL COMBO DEALS</h2>
            </div>
            <span className="text-[10px] sm:text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 whitespace-nowrap shrink-0">
              Limited Period Canteen Offers
            </span>
          </div>

          <div className={activeCategory === 'offers' ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-2 gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"}>
            {offers.map(offer => {
              const qty = getItemCartQty(offer.id);
              const savings = Number(offer.original_price || offer.price) - Number(offer.price);
              const hasPlus = offer.emoji?.includes('+');
              const parts = hasPlus ? offer.emoji.split('+').map(p => p.trim()) : [offer.emoji];

              return (() => {
                const cardGradients = [
                  'from-amber-50 via-orange-50/20 to-white border-amber-300 shadow-md shadow-amber-200/20 hover:border-amber-400',
                  'from-violet-50 via-purple-50/20 to-white border-purple-300 shadow-md shadow-purple-200/20 hover:border-purple-400',
                  'from-rose-50 via-pink-50/20 to-white border-pink-300 shadow-md shadow-pink-200/20 hover:border-pink-400',
                ];
                const hash = String(offer.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const gradient = cardGradients[hash % cardGradients.length];
                return (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedItem(offer)}
                    className={`${activeCategory === 'offers' ? 'w-auto flex-row p-3' : 'shrink-0 w-[85vw] md:w-auto snap-start flex-row p-4 sm:p-5'} bg-white border border-slate-200/90 rounded-[1.25rem] sm:rounded-2xl gap-3 sm:gap-4 items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden cursor-pointer flex`}
                  >
                    {/* Left: Emojis Box & Tags */}
                    <div className={`shrink-0 w-24 sm:w-36 aspect-square rounded-[1rem] sm:rounded-xl bg-slate-100 flex flex-col items-center justify-center relative shadow-sm gap-2 overflow-hidden`}>
                      
                      {offer.image_url ? (
                        <img src={optimizeImage(offer.image_url)} alt={offer.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-0 transition-opacity duration-500" onLoad={(e) => e.target.classList.remove('opacity-0')} loading="lazy" decoding="async" />
                      ) : (
                        <div className="relative z-10 flex items-center gap-1.5 font-bold text-slate-500">
                          <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">{parts[0]}</span>
                          {hasPlus && (
                            <>
                              <span className="text-base text-amber-500 font-extrabold animate-pulse">+</span>
                              <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform duration-300">{parts[1]}</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="relative z-10 flex flex-wrap items-center justify-center gap-1 mt-1">
                        {offer.tag && (
                          <span className="text-[9px] uppercase font-black text-amber-900 bg-amber-300 px-2 py-0.5 rounded-md shadow-xs">
                            {offer.tag}
                          </span>
                        )}

                        {savings > 0 && (
                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                            Save ₹{savings}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Info & Action */}
                    <div className="flex-1 w-full flex flex-col justify-between h-full min-w-0 space-y-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {offer.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                          {offer.description || offer.items_included}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1 w-full" onClick={(e) => e.stopPropagation()}>
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
                            onClick={(e) => { e.stopPropagation(); if (isOutletOpen) addToCart({ id: offer.id, name: offer.name, price: Number(offer.price), emoji: offer.emoji || '', image_url: offer.image_url, has_packaging_charge: true, is_offer: true }); }}
                            disabled={!isOutletOpen}
                            className={`px-5 py-2 rounded-xl border text-xs sm:text-sm font-black transition-all cursor-pointer tracking-wider shrink-0 ${isOutletOpen ? 'border-emerald-300 text-emerald-800 bg-gradient-to-b from-emerald-50 to-emerald-200 hover:from-emerald-400 hover:to-emerald-600 hover:text-white hover:border-emerald-500 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 shadow-[0_4px_6px_rgba(0,100,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)]' : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'}`}
                          >
                            + ADD
                          </button>
                        )}
                      </div>
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
                            {item.image_url ? (
                              <img src={optimizeImage(item.image_url)} alt={item.name} className="w-10 h-10 rounded-xl object-cover shrink-0 opacity-0 transition-opacity duration-500" onLoad={(e) => e.target.classList.remove('opacity-0')} loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">{item.emoji || ''}</div>
                            )}
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
              {inventory.some(i => i.is_popular) && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xl">⭐</span>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">Popular Today</h2>
                  </div>
                  <div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                          const hash = String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const gradient = cardGradients[hash % cardGradients.length];
                          return (
                            <div
                              key={`popular-${item.id}`}
                              onClick={() => setSelectedItem(item)}
                              className={`w-[140px] md:w-auto shrink-0 snap-start bg-white border border-slate-200/90 rounded-[1.25rem] md:rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer`}
                            >
                              <div className="space-y-2">
                                <div className="aspect-square w-full rounded-xl border border-white/80 flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-slate-100">
                                  
                                  {item.image_url ? (
                                    <img src={optimizeImage(item.image_url)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-0 transition-opacity duration-500" onLoad={(e) => e.target.classList.remove('opacity-0')} loading="lazy" decoding="async" />
                                  ) : (
                                    <span className="relative z-10 text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">{item.emoji || ''}</span>
                                  )}
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
                                  <button onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-5 py-2 rounded-xl border border-emerald-300 text-emerald-800 bg-gradient-to-b from-emerald-50 to-emerald-200 hover:from-emerald-400 hover:to-emerald-600 hover:text-white hover:border-emerald-500 font-black text-xs sm:text-sm active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all shadow-[0_4px_6px_rgba(0,100,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)] cursor-pointer tracking-wider shrink-0">
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


              {/* Category sections */}
              {groupedByCategory.map(cat => (
                <div
                  key={cat.id}
                  data-cat-id={cat.id}
                  ref={el => { sectionRefs.current[cat.id] = el; }}
                >
                  {/* Sticky section header */}
                  <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-sm py-2 mb-4 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">{cat.emoji || ''}</span>
                      <h2 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">{cat.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline-block text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">{cat.items.length} items</span>
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
                  <div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                        const hash = String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const gradient = cardGradients[hash % cardGradients.length];
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col justify-between hover:shadow-md transition-all duration-300 cursor-pointer w-[140px] md:w-auto shrink-0 snap-start"
                          >
                            <div className="space-y-2">
                              <div className="aspect-square w-full rounded-xl bg-slate-100 flex items-center justify-center relative overflow-hidden">
                                {item.image_url ? (
                                  <img src={optimizeImage(item.image_url)} alt={item.name} className="w-full h-full object-cover rounded-xl opacity-0 transition-opacity duration-500" onLoad={(e) => e.target.classList.remove('opacity-0')} loading="lazy" decoding="async" />
                                ) : (
                                  <span className="relative z-10 text-6xl drop-shadow-xl">{item.emoji || ''}</span>
                                )}
                                <div className={`absolute top-2 left-2 w-4 h-4 rounded-sm border bg-white flex items-center justify-center p-0.5 shadow-sm ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}><div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></div>
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
                                  <button onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-4 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 bg-gradient-to-b from-emerald-50 to-emerald-200 hover:from-emerald-400 hover:to-emerald-600 hover:text-white hover:border-emerald-500 font-black text-[11px] active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all shadow-[0_4px_6px_rgba(0,100,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)] cursor-pointer tracking-wider">+ ADD</button>
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
                  <span className="text-4xl">📦</span>
                  <h3 className="text-sm font-extrabold text-slate-900">No items match your filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Try searching for a different dish or reset filters.</p>
                  <button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-extrabold text-xs shadow-sm hover:bg-emerald-700 transition-colors">Reset All Filters</button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense gap-3 sm:gap-5' : 'grid grid-cols-1 gap-3'}>
                  {(activeCategory === 'all' ? filteredInventory.slice(0, visibleCount) : filteredInventory).map((item, idx) => {
                    const qty = getItemCartQty(item.id);
                    if (viewMode === 'list') {
                      return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} onClick={() => setSelectedItem(item)} className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all shadow-2xs cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl border border-white/40 flex items-center justify-center text-3xl shrink-0 shadow-inner bg-slate-100 relative overflow-hidden">
                              
                              {item.image_url ? (
                                <img src={optimizeImage(item.image_url)} alt={item.name} className="w-full h-full object-cover opacity-0 transition-opacity duration-500" onLoad={(e) => e.target.classList.remove('opacity-0')} loading="lazy" decoding="async" />
                              ) : (
                                <span className="relative z-10 drop-shadow-md text-4xl">{item.emoji || ''}</span>
                              )}
                            </div>
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
                          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                            {qty > 0 ? (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-3 py-1.5 font-bold shadow-md">
                                <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                                <span className="text-xs font-black px-1">{qty}</span>
                                <button onClick={() => updateCartQty(item.id, 1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                              </motion.div>
                            ) : (
                              <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-5 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95">+ ADD</motion.button>
                            )}
                          </div>
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
                      const hash = String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const gradient = cardGradients[hash % cardGradients.length];
                      
                      return (
                        <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} onClick={() => setSelectedItem(item)} className="bg-white border border-slate-200/90 rounded-[1.25rem] md:rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300 cursor-pointer">
                          <div className="flex-1 flex flex-col z-10">
                            <div className="w-full aspect-square shrink-0 rounded-xl bg-slate-100 flex items-center justify-center relative overflow-hidden mb-3">
                              
                              {item.image_url ? (
                                <img src={optimizeImage(item.image_url)} alt={item.name} className="w-full h-full object-cover opacity-0 transition-opacity duration-500" onLoad={(e) => e.target.classList.remove('opacity-0')} loading="lazy" decoding="async" />
                              ) : (
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">{item.emoji || ''}</motion.span>
                              )}
                              <div className={`absolute top-2 left-2 w-4 h-4 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-sm ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}><div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} /></div>
                              {item.tag && <span className="absolute top-2 right-2 text-[9px] uppercase font-black text-slate-950 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200/80 shadow-sm">{item.tag}</span>}
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1">
                              {item.categories?.name && <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest">{item.categories.name}</span>}
                              <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">{item.name}</h3>
                              {item.description && <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>}
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight shrink-0">₹{item.price}</span>
                            <div className="flex items-center shrink-0">
                              {qty > 0 ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-3 py-1.5 font-bold text-sm shadow-md">
                                  <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-4 h-4" /></button>
                                  <span className="text-sm font-black px-1.5">{qty}</span>
                                  <button onClick={(e) => { updateCartQty(item.id, 1); triggerFlyingAnimation(e, item.emoji); }} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-4 h-4" /></button>
                                </motion.div>
                              ) : (
                                <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-5 py-2 rounded-xl border border-emerald-300 text-emerald-800 bg-gradient-to-b from-emerald-50 to-emerald-200 hover:from-emerald-400 hover:to-emerald-600 hover:text-white hover:border-emerald-500 font-black text-xs sm:text-sm active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.2)] active:translate-y-0.5 transition-all shadow-[0_4px_6px_rgba(0,100,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.9)] cursor-pointer tracking-wider shrink-0">+ ADD</motion.button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })();
                  })}
                </div>
              )}
              {viewMode === 'grid' && activeCategory === 'all' && visibleCount < filteredInventory.length && (
                <div ref={observerTarget} className="flex flex-col items-center justify-center py-12 mt-4 animate-fade-in">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin shadow-sm mb-3" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200/50 px-3 py-1 rounded-full shadow-inner">Loading more...</p>
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

      {/* 6. Mobile Expandable Floating Cart (FAB) */}
      <AnimatePresence>
        {totalCartCount > 0 && (
          <div className="fixed z-40 sm:hidden bottom-0 left-0 right-0 p-3 pointer-events-none flex flex-col items-end justify-end">
            <motion.div
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              onClick={() => { if (!isCartExpanded) setIsCartExpanded(true); }}
              className={`pointer-events-auto shadow-[0_10px_30px_rgba(5,150,105,0.4)] relative overflow-hidden flex items-center ${
                isCartExpanded 
                  ? 'w-full rounded-2xl p-3.5 justify-between bg-emerald-700 border border-emerald-500/40 mb-1' 
                  : 'w-16 h-16 rounded-[32px] justify-center bg-emerald-600 hover:bg-emerald-700 cursor-pointer mb-3 mr-3'
              }`}
            >
              <AnimatePresence mode="wait">
                {isCartExpanded ? (
                  <motion.div 
                    key="expanded"
                    initial={{ opacity: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between w-full"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={onOpenCart}
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-800 text-yellow-400 flex items-center justify-center font-black shadow-xs shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
                          <span>{totalCartCount} {totalCartCount === 1 ? 'ITEM' : 'ITEMS'}</span>
                          <span className="text-emerald-300">•</span>
                          <span className="text-yellow-300 text-sm font-black">₹{totalCartPrice}</span>
                        </div>
                        <div className="text-[10px] text-emerald-200 font-medium">Tap to review & checkout</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div 
                        onClick={onOpenCart}
                        className="flex items-center gap-1 text-[11px] font-black bg-emerald-800 text-emerald-100 px-3 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Cart</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsCartExpanded(false); }}
                        className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-300 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center w-full h-full relative"
                  >
                    <ShoppingCart className="w-6 h-6 text-white" />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 right-0 bg-yellow-400 text-slate-950 text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-emerald-600 shadow-sm"
                    >
                      {totalCartCount}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
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
          const isOffer = offers.some(o => o.id === item.id);
          const isPopular = inventory.some(i => i.is_popular && i.id === item.id);

          let categoryItems = [];
          let categoryLabel = "More in this Category";

          if (isOffer) {
            categoryItems = offers;
            categoryLabel = "More Combo Offers 🎁";
          } else if (item.category_id) {
            categoryItems = inventory.filter(i => i.category_id === item.category_id);
            categoryLabel = cat ? `More in ${cat.name}` : "More in this Category";
          } else if (isPopular) {
            categoryItems = inventory.filter(i => i.is_popular);
            categoryLabel = "More Special Today ⭐";
          } else {
            categoryItems = inventory;
            categoryLabel = "More Items";
          }

          const currentIndex = categoryItems.findIndex(i => i.id === item.id);
          const handleNextSibling = (e) => {
            e?.stopPropagation();
            if (categoryItems.length <= 1) return;
            const nextIdx = (currentIndex + 1) % categoryItems.length;
            setSelectedItem(categoryItems[nextIdx]);
          };

          const handlePrevSibling = (e) => {
            e?.stopPropagation();
            if (categoryItems.length <= 1) return;
            const prevIdx = (currentIndex - 1 + categoryItems.length) % categoryItems.length;
            setSelectedItem(categoryItems[prevIdx]);
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end justify-center px-3 sm:px-4 pb-2 sm:pb-5 pt-4 bg-slate-900/60 backdrop-blur-xs touch-none overscroll-none"
              onClick={() => setSelectedItem(null)}
            >
              <div className="flex flex-col items-center gap-3 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
                {/* Floating Previous Item Arrow (Desktop/Tablet) */}
                {categoryItems.length > 1 && (
                  <button
                    onClick={handlePrevSibling}
                    className="hidden sm:flex absolute -left-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200 items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title="Previous Item in Category"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-800" />
                  </button>
                )}

                {/* Floating Next Item Arrow (Desktop/Tablet) */}
                {categoryItems.length > 1 && (
                  <button
                    onClick={handleNextSibling}
                    className="hidden sm:flex absolute -right-14 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-xl border border-slate-200 items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title="Next Item in Category"
                  >
                    <ChevronRight className="w-6 h-6 text-slate-800" />
                  </button>
                )}

                <motion.div
                  onTouchStart={(e) => setPopupTouchStart(e.touches[0].clientX)}
                  onTouchEnd={(e) => {
                    if (popupTouchStart === null) return;
                    const diffX = popupTouchStart - e.changedTouches[0].clientX;
                    if (diffX > 45) {
                      handleNextSibling(e);
                    } else if (diffX < -45) {
                      handlePrevSibling(e);
                    }
                    setPopupTouchStart(null);
                  }}
                  initial={{ 
                    y: 20, 
                    opacity: 0,
                    scale: 0.96 
                  }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    scale: 1 
                  }}
                  exit={{ 
                    y: 15, 
                    opacity: 0,
                    scale: 0.96 
                  }}
                  transition={{ 
                    duration: 0.18, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  className="bg-white/90 backdrop-blur-2xl border border-white/80 w-full sm:max-w-md max-h-[85vh] flex flex-col shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative origin-bottom rounded-[36px]"
                >
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/90 flex items-center justify-center text-slate-700 hover:text-slate-900 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Hero Emoji Section */}
                  <div className={`bg-gradient-to-br ${heroGradient} px-6 pt-10 pb-8 flex flex-col items-center gap-3 relative overflow-hidden rounded-t-[36px] border-b border-white/60 backdrop-blur-md`}>
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6) 0%, transparent 50%)' }} />
                    
                    {item.image_url ? (
                      <motion.img 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        src={optimizeImage(item.image_url, 800, 90)} 
                        alt={item.name}
                        className="w-40 h-40 sm:w-48 sm:h-48 rounded-[32px] object-cover shadow-2xl relative z-10 border-4 border-white/80"
                      />
                    ) : (
                      (() => {
                        const hasPlus = item.emoji?.includes('+');
                        const parts = hasPlus ? item.emoji.split('+').map(p => p.trim()) : [item.emoji];
                        return (
                          <div className="flex items-center gap-1.5 relative z-10">
                            <motion.span
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                              transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
                              className="text-8xl sm:text-9xl drop-shadow-md"
                            >
                              {parts[0]}
                            </motion.span>
                            {hasPlus && (
                              <>
                                <span className="text-4xl text-amber-600 font-extrabold">+</span>
                                <motion.span
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
                                  transition={{ scale: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.6 } }}
                                  className="text-8xl sm:text-9xl drop-shadow-md"
                                >
                                  {parts[1]}
                                </motion.span>
                              </>
                            )}
                          </div>
                        );
                      })()
                    )}

                    {item.tag && (
                      <span className="text-[10px] uppercase font-black bg-white/70 backdrop-blur-md text-slate-800 px-3.5 py-1.5 rounded-full border border-white/90 shadow-md relative z-10">{item.tag}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 overscroll-contain touch-pan-y" data-lenis-prevent="true">
                    {/* Title & Badges */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{item.name}</h2>
                        {typeof item.is_veg === 'boolean' && (
                          <div className={`w-6 h-6 rounded-sm border bg-white flex items-center justify-center p-0.5 shadow-sm shrink-0 mt-1 ${item.is_veg ? 'border-emerald-600' : 'border-red-600'}`}>
                            <div className={`w-full h-full rounded-full ${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {cat && (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 uppercase tracking-wider">
                            {cat.emoji ? cat.emoji + ' ' : ''}{cat.name}
                          </span>
                        )}
                        {item.is_veg === false && (
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider text-red-800 bg-red-50 border-red-200">
                            🍗 Non-Veg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description / Combo Details */}
                    <div className="space-y-3">
                      {item.description && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">About this item</span>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.description}</p>
                        </div>
                      )}

                      {item.items_included && (
                        <div className="space-y-1 bg-amber-500/10 backdrop-blur-md border border-amber-300/60 rounded-2xl p-4 shadow-2xs">
                          <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">Items Included in Combo:</span>
                          <p className="text-xs text-amber-900 font-bold leading-relaxed">{item.items_included}</p>
                        </div>
                      )}

                      {item.original_price && (
                        <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-300/60 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Combo Discount</span>
                            <span className="text-xs text-slate-500 font-semibold">Original Price: <span className="line-through">₹{item.original_price}</span></span>
                          </div>
                          <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl">Save ₹{Number(item.original_price) - Number(item.price)}!</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center gap-3 py-3 border-y border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>10-15 min prep</span>
                      </div>
                      <div className="w-px h-4 bg-slate-200" />
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Freshly prepared</span>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Bottom Add-to-Cart Bar */}
                  <div className="border-t border-white/60 bg-white/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between gap-4 shrink-0 shadow-lg rounded-b-[36px]">
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

                {/* Category items strip at the bottom (Instamart style) */}
                {categoryItems.length > 1 && (
                  <div className="w-full flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black text-white/90 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-md uppercase tracking-wider">
                      {categoryLabel}
                    </span>
                    <div className="w-full flex items-center justify-center gap-3.5 overflow-x-auto py-2 px-1 scrollbar-none snap-x snap-mandatory">
                      {categoryItems.map(sibling => {
                        const isSelected = sibling.id === item.id;
                        const hasPlus = sibling.emoji?.includes('+');
                        const parts = hasPlus ? sibling.emoji.split('+').map(p => p.trim()) : [sibling.emoji];
                        return (
                          <div
                            key={sibling.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(sibling);
                            }}
                            className={`shrink-0 w-14 h-14 rounded-full bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300 ${isSelected
                                ? 'ring-4 ring-emerald-500 scale-110 shadow-lg shadow-emerald-500/30'
                                : 'border border-slate-200 opacity-60 hover:opacity-100 hover:scale-105'
                              }`}
                          >
                            <span className="text-2xl drop-shadow-xs">{parts[0]}</span>
                            {hasPlus && <span className="absolute -top-1 -right-1 text-[9px] bg-amber-400 text-slate-950 font-black rounded-full px-1.5 shadow-xs">+</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>



    </div>
  );
}
