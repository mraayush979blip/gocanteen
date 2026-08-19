import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { 
  UtensilsCrossed, LogOut, LogIn, ShoppingCart, UserCheck, Menu as MenuIcon, X, KeyRound, Shield, Globe, Maximize, Minimize, Bug, Lightbulb, Code, Sparkles, Instagram, ArrowLeft, ChevronRight, ArrowDownToLine, MapPin,
  Package, Banknote, ChefHat, Bell, ScrollText, TrendingUp, Receipt, PackageOpen, FolderOpen, Pizza, Ticket, Megaphone, Store, Users, Cloud
} from 'lucide-react';

function NavigationItem({ icon, iconBg, title, subtitle, rightElement, onClick, isActive }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer text-left group ${isActive ? 'bg-emerald-50/50 relative' : ''}`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-md"></div>}
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ${isActive ? 'ring-2 ring-emerald-500/30' : ''}`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className={`font-extrabold text-[13px] leading-tight mb-0.5 ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>{title}</span>
          <span className={`text-[11px] font-medium ${isActive ? 'text-emerald-600/80' : 'text-slate-500'}`}>{subtitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {rightElement}
        <ChevronRight className={`w-4 h-4 transition-colors shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-900'}`} />
      </div>
    </button>
  );
}

export default function Navbar({ onOpenAuth, onOpenCart, onOpenReportBug, onOpenAboutDev, onOpenOutletModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, userRole, activePortal, setActivePortal, cart, logout, showToast, staffLanguage, setStaffLanguage, staffT, selectedOutlet, outlets, refreshGlobalOutlets } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const currentOutlet = outlets?.find(o => o.id === selectedOutlet);
  const currentOutletName = currentOutlet?.name || 'Select Canteen';
  const currentOutletStatus = currentOutlet?.status || 'open';

  const staffOutletId = profile?.assigned_outlet_id;
  const staffOutlet = outlets?.find(o => String(o.id) === String(staffOutletId));
  const staffOutletStatus = staffOutlet?.status || 'open';

  // Lock background scroll when side drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => { 
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Change Admin Unlock Code Modal state
  const [showChangeCodeModal, setShowChangeCodeModal] = useState(false);
  const [newUnlockCode, setNewUnlockCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  const handleStatusChange = async (newStatus) => {
    const targetOutletId = userRole === 'staff' ? staffOutletId : selectedOutlet;
    if (!targetOutletId) {
      showToast('No assigned canteen to update status.', true);
      return;
    }
    
    setStatusUpdating(true);
    try {
      const { data, error } = await supabase
        .from('outlets')
        .update({ status: newStatus })
        .eq('id', targetOutletId)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Update blocked by database security (RLS).");
      await refreshGlobalOutlets();
      showToast(`Canteen status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      showToast('Failed to update status: ' + err.message, true);
    } finally {
      setStatusUpdating(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const pathname = location.pathname;

  const handleLogoClick = () => {
    setActivePortal('customer');
    navigate('/menu');
  };

  const handleSaveUnlockCode = async (e) => {
    e.preventDefault();
    const code = newUnlockCode.trim();
    if (!code || code.length < 4) {
      showToast('Passcode must be at least 4 characters long', true);
      return;
    }

    setSavingCode(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key: 'admin_unlock_code', value: code }, { onConflict: 'key' });

      if (error) throw error;
      showToast(`🔑 Admin Unlock Code updated to "${code}"!`);
      setNewUnlockCode('');
      setShowChangeCodeModal(false);
    } catch (err) {
      showToast('Failed to update unlock code: ' + err.message, true);
    } finally {
      setSavingCode(false);
    }
  };

  const isDeveloperRoute = pathname.endsWith('/developer') || pathname === '/about-developer';
  const currentPortal = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/staff')
    ? 'staff'
    : 'customer';

  const handleManualInstall = async () => {
    const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = () => ('standalone' in window.navigator) && window.navigator.standalone;
    
    if (isInStandaloneMode()) {
      showToast('App is already installed!', false);
      setMobileMenuOpen(false);
      return;
    }

    if (isIos()) {
      alert("📱 iPhone Install Guide:\n\n1. Tap the 'Share' icon at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
    } else if (window.deferredPromptEvent) {
      window.deferredPromptEvent.prompt();
      await window.deferredPromptEvent.userChoice;
      window.deferredPromptEvent = null; // Cannot be used again
    } else {
      showToast('Installation is not supported on this browser or already installed.', true);
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header 
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Top Header Logo with App Icon */}
            <div className="flex items-center gap-2">
              {isDeveloperRoute && (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-2xs mr-1 active:scale-95 border border-slate-200"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-800 font-bold" />
                </button>
              )}
              <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
                <img src="/header.webp?v=3" alt="Header" className="h-14 sm:h-16 object-contain drop-shadow-sm" />
              </div>
            </div>


            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Language Selector for Staff / Admin */}
              {(currentPortal === 'staff' || currentPortal === 'admin') && (
                <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                  <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                  <select
                    value={staffLanguage}
                    onChange={(e) => setStaffLanguage(e.target.value)}
                    className="bg-transparent text-slate-900 text-xs font-extrabold focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="en">English 🇬🇧</option>
                    <option value="hi">हिंदी 🇮🇳</option>
                    <option value="hinglish">Hinglish 🇮🇳</option>
                  </select>
                </div>
              )}

              {/* Outlet Selector (Customer Only) */}
              {currentPortal === 'customer' && (
                <button
                  onClick={onOpenOutletModal}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 transition-all shadow-2xs shrink-0"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-[11px] uppercase tracking-wider truncate max-w-[100px]">
                    {currentOutletName}
                  </span>
                </button>
              )}

              {/* Cart Button (Hidden on Mobile View, visible on Tablet/Desktop) */}
              {currentPortal === 'customer' && (
                <button
                  onClick={onOpenCart}
                  className="hidden sm:flex relative p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm shrink-0 items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5 font-bold" />
                  {cartCount > 0 && (
                    <span className="bg-yellow-400 text-slate-950 font-black text-[11px] px-1.5 py-0.2 rounded-full border border-slate-900 shadow-2xs">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}


              {/* Auth / Profile Actions */}
              {session ? (
                <div className="flex items-center gap-1.5">
                  <div className="hidden lg:flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-slate-800 truncate max-w-[120px]">
                      {profile?.full_name || session.user.email}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sign In</span>
                </button>
              )}

              {/* 3-Bar Menu Toggle Button (Hidden on Developer Page) */}
              {!isDeveloperRoute && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs relative w-10 h-10 flex items-center justify-center ${
                    mobileMenuOpen 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                  title="More Options & Menu"
                >
                  <div className="flex flex-col gap-1 w-5 h-3.5 justify-between items-center relative">
                    <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                    <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : ''}`}></span>
                    <span className={`w-5 h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                  </div>
                </button>
              )}
            </div>

          </div>
        </div>

      </motion.header>

      {/* Mobile / Side Drawer Menu */}
      {/* Backdrop overlay to close menu on outside click */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Full Screen Mobile / Side Drawer Desktop */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.35 }}
              className="fixed inset-y-0 right-0 z-[110] w-full sm:w-[420px] bg-slate-50 flex flex-col h-full max-h-screen overflow-hidden shadow-2xl"
              data-lenis-prevent="true"
            >
              {/* Dark Green Header matching aesthetic */}
              <div className="bg-[#0f4d43] text-white pt-6 pb-16 px-6 relative overflow-hidden shrink-0">
                <div className="flex items-center gap-4 relative z-10">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black tracking-tight leading-tight">Navigation</h2>
                    <p className="text-emerald-100/80 text-xs font-semibold">Go Canteen</p>
                  </div>
                </div>
              </div>

              {/* White Overlapping Content Card - this div scrolls independently for all portals */}
              <div className="flex-1 px-4 -mt-10 relative z-20 pb-16 overflow-y-auto overscroll-contain scrollbar-none" data-lenis-prevent="true">
                {/* User Profile Card */}
                {session && (
                  <div 
                    onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                    className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex items-center justify-between mb-6 group cursor-pointer hover:border-emerald-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xl uppercase shrink-0">
                        {profile?.full_name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                      </div>
                      <div className="truncate">
                        <div className="text-base font-black text-slate-900 truncate">
                          {profile?.full_name || 'Logged In User'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">{session.user.email}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                )}

                {/* Sections Wrapper */}
                <div className="space-y-6">
                  {/* Quick Admin Portal Access Card for Admins on Customer View */}
                  {userRole === 'admin' && currentPortal === 'customer' && (
                    <div className="bg-purple-900 text-white rounded-[20px] p-3.5 shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-800 flex items-center justify-center text-purple-200">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">Admin Account Logged In</p>
                          <p className="text-[10px] text-purple-200">Switch to Management Panel</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-900 font-extrabold text-xs shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        Admin Dashboard →
                      </button>
                    </div>
                  )}

                  {/* ORDERING / MANAGEMENT SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 px-2">
                      <div className="w-1 h-3.5 bg-emerald-600 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {currentPortal === 'customer' ? 'ORDERING' : currentPortal === 'admin' ? 'MANAGEMENT' : 'KITCHEN'}
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                      {currentPortal === 'customer' && (
                        <>
                          <NavigationItem 
                            icon={<MapPin className="w-5 h-5 text-emerald-600" />}
                            iconBg="bg-emerald-50"
                            title="Change Canteen"
                            subtitle={currentOutletName}
                            isActive={false}
                            onClick={() => { onOpenOutletModal?.(); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<UtensilsCrossed className="w-5 h-5 text-emerald-600" />}
                            iconBg="bg-emerald-50"
                            title="Explore Menu"
                            subtitle="Browse dishes & offers"
                            isActive={pathname === '/menu'}
                            onClick={() => { navigate('/menu'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<Package className="w-5 h-5 text-amber-600" />}
                            iconBg="bg-amber-50"
                            title="My Orders & Live Tokens"
                            subtitle="Track your orders"
                            isActive={pathname === '/orders'}
                            onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
                          />

                          <NavigationItem 
                            icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}
                            iconBg="bg-emerald-50"
                            title="View Order Cart"
                            subtitle="Review your cart items"
                            isActive={false}
                            rightElement={
                              cartCount > 0 ? (
                                <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  {cartCount} Items
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-0.5 rounded-full">Empty</span>
                              )
                            }
                            onClick={() => { onOpenCart?.(); setMobileMenuOpen(false); }}
                          />
                        </>
                      )}

                      {currentPortal === 'staff' && (
                        <>
                          <div className="p-3 bg-white border-b border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold text-slate-500">{staffT.canteenStatus}</p>
                              {staffOutlet && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{staffOutlet.name}</span>}
                            </div>
                            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                              <button 
                                onClick={() => handleStatusChange('open')}
                                disabled={statusUpdating || !staffOutletId}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${staffOutletStatus === 'open' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                              >
                                {staffT.statusOpen}
                              </button>
                              <button 
                                onClick={() => handleStatusChange('closed')}
                                disabled={statusUpdating || !staffOutletId}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${staffOutletStatus === 'closed' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                              >
                                {staffT.statusClosed}
                              </button>
                              <button 
                                onClick={() => handleStatusChange('holiday')}
                                disabled={statusUpdating || !staffOutletId}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${staffOutletStatus === 'holiday' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}
                              >
                                {staffT.statusHoliday}
                              </button>
                            </div>
                          </div>
                          
                          <NavigationItem 
                            icon={<Banknote className="w-5 h-5 text-blue-600" />}
                            iconBg="bg-blue-50"
                            title={staffT.navbarPOS}
                            subtitle="Create a manual order"
                            isActive={pathname === '/staff/pos'}
                            onClick={() => { navigate('/staff/pos'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<ChefHat className="w-5 h-5 text-orange-600" />}
                            iconBg="bg-orange-50"
                            title={staffT.navbarKitchen}
                            subtitle="Live incoming orders"
                            isActive={pathname === '/staff/kitchen'}
                            onClick={() => { navigate('/staff/kitchen'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<Bell className="w-5 h-5 text-amber-600" />}
                            iconBg="bg-amber-50"
                            title={staffT.navbarStock}
                            subtitle="Manage stock availability"
                            isActive={pathname === '/staff/stock'}
                            onClick={() => { navigate('/staff/stock'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<ScrollText className="w-5 h-5 text-indigo-600" />}
                            iconBg="bg-indigo-50"
                            title={staffT.navbarHistory}
                            subtitle="Past orders & analytics"
                            isActive={pathname === '/staff/history'}
                            onClick={() => { navigate('/staff/history'); setMobileMenuOpen(false); }}
                          />
                        </>
                      )}

                       {currentPortal === 'admin' && (
                        <>
                          <NavigationItem 
                            icon={<TrendingUp className="w-5 h-5 text-purple-600" />} 
                            iconBg="bg-purple-50" 
                            title="Dashboard Overview" 
                            subtitle="Key metrics & stats" 
                            isActive={pathname === '/admin/dashboard'}
                            onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }} 
                          />
                          <NavigationItem 
                            icon={<Receipt className="w-5 h-5 text-blue-600" />} 
                            iconBg="bg-blue-50" 
                            title="Order Management" 
                            subtitle="All canteen orders" 
                            isActive={pathname === '/admin/orders'}
                            onClick={() => { navigate('/admin/orders'); setMobileMenuOpen(false); }} 
                          />
                          <NavigationItem 
                            icon={<PackageOpen className="w-5 h-5 text-amber-600" />} 
                            iconBg="bg-amber-50" 
                            title="Inventory Control" 
                            subtitle="Manage menu items" 
                            isActive={pathname === '/admin/inventory'}
                            onClick={() => { navigate('/admin/inventory'); setMobileMenuOpen(false); }} 
                          />
                          <NavigationItem icon={<FolderOpen className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Menu Categories" subtitle="Manage categories" isActive={pathname === '/admin/categories'} onClick={() => { navigate('/admin/categories'); setMobileMenuOpen(false); }} />
                          <NavigationItem 
                            icon={<Megaphone className="w-5 h-5 text-pink-600" />}
                            iconBg="bg-pink-50"
                            title="Combo Deals"
                            subtitle="Promotions & combos"
                            isActive={pathname === '/admin/offers'}
                            onClick={() => { navigate('/admin/offers'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<Ticket className="w-5 h-5 text-orange-600" />}
                            iconBg="bg-orange-50"
                            title="Promo Codes"
                            subtitle="Discount coupons"
                            isActive={pathname === '/admin/promo-codes'}
                            onClick={() => { navigate('/admin/promo-codes'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem icon={<Store className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Canteen Outlets" subtitle="Manage physical locations" isActive={pathname === '/admin/outlets'} onClick={() => { navigate('/admin/outlets'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<Users className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Manage Staff" subtitle="Accounts & Access" isActive={pathname === '/admin/staff'} onClick={() => { navigate('/admin/staff'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<Cloud className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Storage & Images" subtitle="Clean unused photos" isActive={pathname === '/admin/storage'} onClick={() => { navigate('/admin/storage'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<KeyRound className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Change Admin Passcode" subtitle="Security settings" isActive={false} onClick={() => { setShowChangeCodeModal(true); setMobileMenuOpen(false); }} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* MORE SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 px-2">
                      <div className="w-1 h-3.5 bg-slate-600 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">MORE</span>
                    </div>
                    
                    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                      {currentPortal === 'customer' && (
                        <NavigationItem 
                          icon={<Instagram className="w-5 h-5 text-pink-500" />}
                          iconBg="bg-pink-50"
                          title="Instagram (@gocanteen.in)"
                          subtitle="Follow us on Instagram"
                          isActive={false}
                          onClick={() => window.open('https://www.instagram.com/gocanteen.in/', '_blank')}
                        />
                      )}
                      
                      <NavigationItem 
                        icon={<ArrowDownToLine className="w-5 h-5 text-blue-600" />}
                        iconBg="bg-blue-50"
                        title="Install App"
                        subtitle="Add to home screen"
                        isActive={false}
                        onClick={handleManualInstall}
                      />
                      {currentPortal === 'customer' && (
                        <>
                          <NavigationItem 
                            icon={<Bug className="w-5 h-5 text-amber-600" />}
                            iconBg="bg-amber-50"
                            title="Report Bug / Suggestions"
                            subtitle="Help us improve"
                            isActive={pathname === '/report-bug'}
                            onClick={() => { navigate('/report-bug'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<Code className="w-5 h-5 text-indigo-600" />}
                            iconBg="bg-indigo-50"
                            title="About Developer (Aayush Sharma)"
                            subtitle="Know more about the developer"
                            isActive={pathname === '/customer/developer'}
                            onClick={() => {
                              navigate(`/${currentPortal}/developer`);
                              setMobileMenuOpen(false);
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="mt-8 mb-4">
                  {session ? (
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false); }}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-[20px] p-4 flex items-center justify-between transition-colors cursor-pointer group border border-red-100"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5" />
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-[13px] leading-tight mb-0.5">{currentPortal === 'staff' ? staffT.navbarLogout : 'Sign Out'}</span>
                          <span className="text-[11px] text-red-400 font-medium">Log out from your account</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500 transition-colors" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { onOpenAuth?.('customer'); setMobileMenuOpen(false); }}
                      className="w-full bg-[#0f4d43] hover:bg-[#0c4038] text-white rounded-[20px] p-4 flex items-center justify-between transition-colors cursor-pointer group shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5" />
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-[13px] leading-tight mb-0.5">Sign In</span>
                          <span className="text-[11px] text-emerald-100/80 font-medium">Access your account</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:text-white transition-colors" />
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Change Admin Unlock Passcode Modal */}
      {showChangeCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in text-slate-900">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Admin Gate Passcode</h3>
              </div>
              <button onClick={() => setShowChangeCodeModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnlockCode} className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Set a security passcode to unlock the Admin Portal.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Passcode *</label>
                <input
                  type="text"
                  required
                  value={newUnlockCode}
                  onChange={(e) => setNewUnlockCode(e.target.value)}
                  placeholder="e.g. 1234 or GO2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangeCodeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCode}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{savingCode ? 'Saving...' : 'Save Passcode'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
