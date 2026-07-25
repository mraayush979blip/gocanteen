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
                className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  mobileMenuOpen 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
                title="More Options & Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 font-bold" /> : <MenuIcon className="w-5 h-5 font-bold" />}
              </button>
            </div>

          </div>
        </div>

        {/* Backdrop overlay to close menu on outside click */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Standard Professional 3-Bar Floating Popover Menu */}
        {mobileMenuOpen && (
          <div className="absolute right-4 sm:right-6 top-16 z-50 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-2 font-medium animate-fade-in text-slate-900 space-y-1">
            
            {/* User Profile Header if signed in */}
            {session && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm uppercase shrink-0">
                  {profile?.full_name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {profile?.full_name || 'Logged In User'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">{session.user.email}</div>
                </div>
              </div>
            )}

            {/* Section 1: Navigation Links */}
            <div className="px-2 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Navigation
            </div>

            <div className="space-y-0.5">
              {activePortal === 'customer' && (
                <>
                  <button
                    onClick={() => { navigate('/menu'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/' || pathname === '/menu' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🍽️</span>
                    <span>Explore Menu</span>
                  </button>

                  <button
                    onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/orders' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📦</span>
                    <span>My Orders & Live Tokens</span>
                  </button>

                  <button
                    onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/profile' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </button>
                </>
              )}

              {activePortal === 'staff' && (
                <>
                  <button
                    onClick={() => { navigate('/staff/kds'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/staff' || pathname === '/staff/kds' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>👨‍🍳</span>
                    <span>Live Kitchen Queue (KDS)</span>
                  </button>
                  <button
                    onClick={() => { navigate('/staff/stock'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/staff/stock' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📦</span>
                    <span>Quick Stock Availability</span>
                  </button>
                  <button
                    onClick={() => { navigate('/staff/history'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/staff/history' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📋</span>
                    <span>Order History Log</span>
                  </button>
                </>
              )}

              {activePortal === 'admin' && (
                <>
                  <button
                    onClick={() => { navigate('/admin/dashboard'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/admin' || pathname === '/admin/dashboard' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>📊</span>
                    <span>Executive Dashboard</span>
                  </button>
                  <button
                    onClick={() => { navigate('/admin/orders'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/admin/orders' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>💵</span>
                    <span>Sales Controls & Refunds</span>
                  </button>
                  <button
                    onClick={() => { navigate('/admin/inventory'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/admin/inventory' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🍱</span>
                    <span>Menu Inventory</span>
                  </button>
                  <button
                    onClick={() => { navigate('/admin/promos'); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 transition-all ${
                      pathname === '/admin/promos' ? 'bg-purple-50 text-purple-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🎟️</span>
                    <span>Coupon Codes</span>
                  </button>
                  <button
                    onClick={() => { setShowChangeCodeModal(true); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center gap-2.5 transition-all"
                  >
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    <span>Change Admin Passcode</span>
                  </button>
                </>
              )}
            </div>

            {/* Section 2: Quick Cart Action */}
            <div className="pt-2 border-t border-slate-100 space-y-0.5">
              <button
                onClick={() => { onOpenCart?.(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center justify-between transition-colors border border-emerald-200/60"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>View Order Cart</span>
                </div>
                {cartCount > 0 ? (
                  <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                    {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-600 font-bold">Empty</span>
                )}
              </button>
            </div>

            {/* Section 3: Support & Developer Credits */}
            <div className="pt-2 border-t border-slate-100 space-y-0.5">
              <button
                onClick={() => { onOpenReportBug?.(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
              >
                <Bug className="w-4 h-4 text-amber-600" />
                <span>Report Bug / Suggestions</span>
              </button>

              <button
                onClick={() => { onOpenAboutDev?.(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
              >
                <Code className="w-4 h-4 text-indigo-600" />
                <span>About Developer (Aayush Sharma)</span>
              </button>
            </div>

            {/* Section 4: Account Actions */}
            <div className="pt-2 border-t border-slate-100">
              {session ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>Sign Out</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => { onOpenAuth?.('customer'); setMobileMenuOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Sign In / Register</span>
                  </div>
                </button>
              )}
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
