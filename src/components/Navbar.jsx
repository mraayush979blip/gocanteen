import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  UtensilsCrossed, LogOut, LogIn, ShoppingCart, UserCheck, Menu as MenuIcon, X, KeyRound, Shield, Globe, Maximize, Minimize, Bug, Lightbulb, Code, Sparkles
} from 'lucide-react';

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
            
            {/* Brand Logo */}
            <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={handleLogoClick}>
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-yellow-300 flex items-center justify-center shadow-sm shrink-0">
                <UtensilsCrossed className="w-5 h-5 font-black" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                    GO CANTEEN
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-extrabold bg-yellow-400 text-slate-950 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    FAST
                  </span>
                </div>
                <span className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">
                  {activePortal.toUpperCase()} PORTAL
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {activePortal === 'customer' && (
                <>
                  <button
                    onClick={() => navigate('/menu')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/' || pathname === '/menu' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Menu
                  </button>
                  <button
                    onClick={() => navigate('/orders')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/orders' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    My Orders
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/profile' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Profile
                  </button>
                </>
              )}



              {activePortal === 'admin' && (
                <>
                  <button
                    onClick={() => navigate('/admin/dashboard')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/admin' || pathname === '/admin/dashboard' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/admin/orders' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => navigate('/admin/inventory')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/admin/inventory' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => navigate('/admin/categories')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/admin/categories' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Categories
                  </button>
                  <button
                    onClick={() => navigate('/admin/offers')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/admin/offers' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Offers
                  </button>
                  <button
                    onClick={() => navigate('/admin/promos')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/admin/promos' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Coupons
                  </button>
                  <button
                    onClick={() => navigate('/admin/staff')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === '/admin/staff' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Staff
                  </button>
                  
                  {/* Change Unlock Passcode Button */}
                  <button
                    onClick={() => setShowChangeCodeModal(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 flex items-center gap-1 transition-all"
                    title="Change Admin Gate Unlock Passcode"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Unlock Code</span>
                  </button>
                </>
              )}
            </nav>

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

              {/* Cart Button */}
              {activePortal === 'customer' && (
                <button
                  onClick={onOpenCart}
                  className="relative p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm shrink-0 flex items-center gap-1.5"
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
                  <button
                    onClick={logout}
                    className="p-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* 3-Bar Menu Toggle Button (Desktop & Mobile) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="More Options & Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 font-bold" /> : <MenuIcon className="w-5 h-5 font-bold" />}
              </button>
            </div>

          </div>
        </div>

        {/* Three-Bar Dropdown Menu (Desktop & Mobile) */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white p-4 space-y-3 animate-fade-in shadow-xl text-slate-900">
            <div className="grid grid-cols-1 gap-1">
              {activePortal === 'customer' && (
                <>
                  <button
                    onClick={() => { navigate('/menu'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/' || pathname === '/menu' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    🍽️ Menu
                  </button>
                  <button
                    onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/orders' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    📦 My Orders & Live Tokens
                  </button>
                  <button
                    onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/profile' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    👤 My Profile
                  </button>
                </>
              )}

              {activePortal === 'staff' && (
                <>
                  <button
                    onClick={() => { navigate('/staff/kds'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/staff' || pathname === '/staff/kds' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    👨‍🍳 Live Kitchen Queue (KDS)
                  </button>
                  <button
                    onClick={() => { navigate('/staff/stock'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/staff/stock' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    📦 Quick Stock Availability Toggle
                  </button>
                  <button
                    onClick={() => { navigate('/staff/history'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/staff/history' ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    📋 Order History Log
                  </button>
                </>
              )}

              {activePortal === 'admin' && (
                <>
                  <button
                    onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/admin' || pathname === '/admin/dashboard' ? 'bg-purple-50 text-purple-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    📊 Executive Dashboard
                  </button>
                  <button
                    onClick={() => { navigate('/admin/orders'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/admin/orders' ? 'bg-purple-50 text-purple-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    💵 Sales Controls & Refund Applications
                  </button>
                  <button
                    onClick={() => { navigate('/admin/inventory'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/admin/inventory' ? 'bg-purple-50 text-purple-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    🍱 Menu Inventory
                  </button>
                  <button
                    onClick={() => { navigate('/admin/categories'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/admin/categories' ? 'bg-purple-50 text-purple-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    🏷️ Categories
                  </button>
                  <button
                    onClick={() => { navigate('/admin/offers'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/admin/offers' ? 'bg-purple-50 text-purple-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    🔥 Combo Deals & Banners
                  </button>
                  <button
                    onClick={() => { navigate('/admin/promos'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/admin/promos' ? 'bg-purple-50 text-purple-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    🎟️ Coupon Codes
                  </button>
                  <button
                    onClick={() => { navigate('/admin/staff'); setMobileMenuOpen(false); }}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold ${pathname === '/admin/staff' ? 'bg-purple-50 text-purple-700 font-extrabold' : 'text-slate-700'}`}
                  >
                    👨‍🍳 Staff Roles
                  </button>
                </>
              )}

              {/* Developer & Report Bug Action Links for All Users */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => { onOpenReportBug?.(); setMobileMenuOpen(false); }}
                  className="w-full text-left p-3 rounded-xl text-xs font-extrabold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 flex items-center justify-between transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span>🐞 Report Bug / Suggestions</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-md">Feedback</span>
                </button>

                <button
                  onClick={() => { onOpenAboutDev?.(); setMobileMenuOpen(false); }}
                  className="w-full text-left p-3 rounded-xl text-xs font-extrabold bg-indigo-950 hover:bg-indigo-900 text-indigo-100 flex items-center justify-between transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>💻 About Developer & Credits</span>
                  </div>
                  <span className="text-[10px] bg-indigo-500 text-white font-black px-2 py-0.5 rounded-md">Aayush Sharma</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </header>

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
