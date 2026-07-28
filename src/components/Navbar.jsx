import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UtensilsCrossed, LogOut, LogIn, ShoppingCart, UserCheck, Menu as MenuIcon, X, KeyRound, Shield, Globe, Maximize, Minimize, Bug, Lightbulb, Code, Sparkles, Instagram, ArrowLeft, ChevronRight
} from 'lucide-react';

function NavigationItem({ icon, iconBg, title, subtitle, rightElement, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-[13px] text-slate-900 leading-tight mb-0.5">{title}</span>
          <span className="text-[11px] text-slate-500 font-medium">{subtitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {rightElement}
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors shrink-0" />
      </div>
    </button>
  );
}

export default function Navbar({ onOpenAuth, onOpenCart, onOpenReportBug, onOpenAboutDev }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, profile, activePortal, setActivePortal, cart, logout, showToast, staffLanguage, setStaffLanguage } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Sync fullscreen state with browser escape / exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close mobile menu automatically on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        showToast('Fullscreen mode not available', true);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Change Admin Unlock Code Modal state
  const [showChangeCodeModal, setShowChangeCodeModal] = useState(false);
  const [newUnlockCode, setNewUnlockCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Top Header Logo with App Icon */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 overflow-hidden flex items-center justify-center shadow-md active:scale-95 transition-transform p-0.5 shrink-0">
                <img src="/app-icon.png" alt="Go Canteen Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-slate-900 leading-none">GO CANTEEN</span>
                  <span className="bg-yellow-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                    FAST
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">
                  {activePortal === 'admin' ? 'Executive Admin' : activePortal === 'staff' ? 'Kitchen Staff KDS' : 'Customer Portal'}
                </span>
              </div>
            </div>


            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Fullscreen Toggle Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all shrink-0 flex items-center justify-center cursor-pointer shadow-2xs"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 text-purple-600 font-bold" />
                ) : (
                  <Maximize className="w-4 h-4 text-slate-700 font-bold" />
                )}
              </button>

              {/* Language Selector for Staff / Admin */}
              {(activePortal === 'staff' || activePortal === 'admin') && (
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

              {/* Cart Button (Hidden on Mobile View, visible on Tablet/Desktop) */}
              {activePortal === 'customer' && (
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

              {/* 3-Bar Menu Toggle Button (Desktop & Mobile) */}
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
            </div>

          </div>
        </div>

      </header>

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
              transition={{ type: 'spring', damping: 28, stiffness: 250 }}
              className="fixed inset-y-0 right-0 z-[110] w-full sm:w-[420px] bg-slate-50 flex flex-col overflow-y-auto shadow-2xl"
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

              {/* White Overlapping Content Card */}
              <div className="flex-1 px-4 -mt-10 relative z-20 pb-8 flex flex-col">
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
                  {/* ORDERING SECTION */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 px-2">
                      <div className="w-1 h-3.5 bg-emerald-600 rounded-full"></div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {activePortal === 'customer' ? 'ORDERING' : activePortal === 'admin' ? 'MANAGEMENT' : 'KITCHEN'}
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                      {activePortal === 'customer' && (
                        <>
                          <NavigationItem 
                            icon={<UtensilsCrossed className="w-5 h-5 text-emerald-600" />}
                            iconBg="bg-emerald-50"
                            title="Explore Menu"
                            subtitle="Browse dishes & offers"
                            onClick={() => { navigate('/menu'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<span className="text-lg">📦</span>}
                            iconBg="bg-amber-50"
                            title="My Orders & Live Tokens"
                            subtitle="Track your orders"
                            onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<UserCheck className="w-5 h-5 text-sky-600" />}
                            iconBg="bg-sky-50"
                            title="My Profile"
                            subtitle="Manage your details"
                            onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}
                            iconBg="bg-emerald-50"
                            title="View Order Cart"
                            subtitle="Review your cart items"
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

                      {activePortal === 'staff' && (
                        <>
                          <NavigationItem 
                            icon={<span className="text-lg">👨‍🍳</span>}
                            iconBg="bg-emerald-50"
                            title="Live Kitchen Queue (KDS)"
                            subtitle="Manage live orders"
                            onClick={() => { navigate('/staff/kds'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<span className="text-lg">📦</span>}
                            iconBg="bg-emerald-50"
                            title="Quick Stock Availability"
                            subtitle="Update item stock"
                            onClick={() => { navigate('/staff/stock'); setMobileMenuOpen(false); }}
                          />
                          <NavigationItem 
                            icon={<span className="text-lg">📋</span>}
                            iconBg="bg-emerald-50"
                            title="Order History Log"
                            subtitle="Past orders"
                            onClick={() => { navigate('/staff/history'); setMobileMenuOpen(false); }}
                          />
                        </>
                      )}

                      {activePortal === 'admin' && (
                        <>
                          <NavigationItem icon={<span className="text-lg">📊</span>} iconBg="bg-purple-50" title="Executive Dashboard" subtitle="Sales analytics" onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<span className="text-lg">💵</span>} iconBg="bg-purple-50" title="Sales Controls & Refunds" subtitle="Manage payments" onClick={() => { navigate('/admin/orders'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<span className="text-lg">🍱</span>} iconBg="bg-purple-50" title="Menu Inventory" subtitle="Manage items" onClick={() => { navigate('/admin/inventory'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<span className="text-lg">📂</span>} iconBg="bg-purple-50" title="Menu Categories" subtitle="Manage categories" onClick={() => { navigate('/admin/categories'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<span className="text-lg">🎟️</span>} iconBg="bg-purple-50" title="Combo Offers" subtitle="Manage coupons" onClick={() => { navigate('/admin/promos'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<span className="text-lg">👥</span>} iconBg="bg-purple-50" title="Manage Staff" subtitle="Accounts & Access" onClick={() => { navigate('/admin/staff'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<KeyRound className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50" title="Change Admin Passcode" subtitle="Security settings" onClick={() => { setShowChangeCodeModal(true); setMobileMenuOpen(false); }} />
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
                      {activePortal !== 'admin' && (
                        <NavigationItem 
                          icon={<Instagram className="w-5 h-5 text-pink-500" />}
                          iconBg="bg-pink-50"
                          title="Instagram (@gocanteen.in)"
                          subtitle="Follow us on Instagram"
                          onClick={() => window.open('https://www.instagram.com/gocanteen.in/', '_blank')}
                        />
                      )}
                      <NavigationItem 
                        icon={<Bug className="w-5 h-5 text-amber-600" />}
                        iconBg="bg-amber-50"
                        title="Report Bug / Suggestions"
                        subtitle="Help us improve"
                        onClick={() => { navigate('/report-bug'); setMobileMenuOpen(false); }}
                      />
                      {activePortal !== 'admin' && (
                        <NavigationItem 
                          icon={<Code className="w-5 h-5 text-indigo-600" />}
                          iconBg="bg-indigo-50"
                          title="About Developer (Aayush Sharma)"
                          subtitle="Know more about the developer"
                          onClick={() => { navigate('/about-developer'); setMobileMenuOpen(false); }}
                        />
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
                          <span className="font-extrabold text-[13px] leading-tight mb-0.5">Sign Out</span>
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
