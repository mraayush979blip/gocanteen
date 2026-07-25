import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, Eye, EyeOff, Shield, ChefHat, UtensilsCrossed, ArrowRight, KeyRound } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAdminLoginSuccess, initialRole }) {
  const navigate = useNavigate();
  const { session, activePortal, setActivePortal, showToast } = useAuth();
  const [selectedRole, setSelectedRole] = useState(initialRole || activePortal || 'customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin Unlock Code Gate State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');

  // Sync selected role when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole || activePortal || 'customer');
      if (initialRole === 'admin') {
        setIsAdminUnlocked(false);
        setAdminPasscodeInput('');
      }
    }
  }, [isOpen, initialRole, activePortal]);

  if (!isOpen) return null;

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setIsAdminUnlocked(false);
      setAdminPasscodeInput('');
    }
  };

  const handleVerifyAdminPasscode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let validCode = '919191';
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'admin_unlock_code')
          .maybeSingle();

        if (data?.value) {
          validCode = data.value;
        }
      } catch (err) {
        console.warn('System settings read error, fallback to default 919191:', err);
      }

      if (adminPasscodeInput.trim() === validCode) {
        setIsAdminUnlocked(true);
        showToast('🔓 Admin Security Gate Unlocked! Please enter your Admin Login Credentials.');
      } else {
        showToast('❌ Incorrect Admin Unlock Code', true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (data?.user) {
        setActivePortal(selectedRole);
        if (selectedRole === 'admin') {
          if (onAdminLoginSuccess) onAdminLoginSuccess();
          navigate('/admin/dashboard');
        } else if (selectedRole === 'staff') {
          navigate('/staff/kds');
        } else {
          navigate('/menu');
        }
      }

      showToast(`Welcome! Logged into ${selectedRole.toUpperCase()} portal 🙌`);
      onClose();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleQuickSwitchPortal = () => {
    if (!session) {
      showToast('Please sign in first to switch portals!', true);
      return;
    }
    setActivePortal(selectedRole);
    if (selectedRole === 'admin') {
      if (onAdminLoginSuccess) onAdminLoginSuccess();
      navigate('/admin/dashboard');
    } else if (selectedRole === 'staff') {
      navigate('/staff/kds');
    } else {
      navigate('/menu');
    }
    showToast(`Switched to ${selectedRole.toUpperCase()} Portal!`);
    onClose();
  };

  const isAdminOnlyMode = initialRole === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in text-slate-900">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title & Icon Header */}
        <div className="text-center">
          {selectedRole === 'admin' ? (
            <div className="w-11 h-11 rounded-2xl bg-purple-100 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto mb-2">
              <Shield className="w-6 h-6" />
            </div>
          ) : selectedRole === 'staff' ? (
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <ChefHat className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
          )}

          <h2 className="text-xl font-extrabold text-slate-900">
            {session 
              ? 'Switch Portal Access' 
              : selectedRole === 'admin' 
                ? 'Go Canteen Admin Portal' 
                : selectedRole === 'staff'
                  ? 'Kitchen Staff Sign In'
                  : 'Sign In to Go Canteen'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {selectedRole === 'customer'
              ? 'Sign in with Google to place food orders and track live status'
              : `Official ${selectedRole.toUpperCase()} security credentials required`}
          </p>
        </div>

        {/* Customer & Kitchen Staff Tabs (Shown for non-admin sign in or portal switching) */}
        {!isAdminOnlyMode && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleSelect('customer')}
                className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'customer'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('staff')}
                className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                  selectedRole === 'staff'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ChefHat className="w-4 h-4 text-emerald-600" />
                <span>Kitchen Staff</span>
              </button>
            </div>

            {session && (
              <button
                type="button"
                onClick={handleQuickSwitchPortal}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all mt-1"
              >
                Switch to {selectedRole.toUpperCase()} Portal View <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* ADMIN UNLOCK CODE GATE: If Admin selected and not yet unlocked */}
        {selectedRole === 'admin' && !isAdminUnlocked ? (
          <form onSubmit={handleVerifyAdminPasscode} className="space-y-3 pt-1">
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center space-y-1">
              <KeyRound className="w-6 h-6 text-purple-600 mx-auto" />
              <h4 className="text-xs font-extrabold text-purple-900">Admin Security Passcode Gate</h4>
              <p className="text-[11px] text-purple-700 font-medium">
                Enter the Admin Unlock Passcode to unlock login credentials
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Unlock Passcode</label>
              <input
                type="password"
                required
                autoFocus
                value={adminPasscodeInput}
                onChange={(e) => setAdminPasscodeInput(e.target.value)}
                placeholder="Enter 6-digit passcode"
                className="w-full text-center text-lg font-black tracking-widest px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying Code...' : 'Unlock Admin Credentials Gate →'}
            </button>
          </form>
        ) : selectedRole === 'customer' ? (
          /* CUSTOMER: Google Sign In */
          <div className="space-y-3 text-center py-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Sign In with Google
            </button>
          </div>
        ) : (
          /* STAFF & UNLOCKED ADMIN: Credentials Form */
          <form onSubmit={handleAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official {selectedRole.toUpperCase()} Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${selectedRole}@gocanteen.com`}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-600 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Please wait...' : `Sign In as ${selectedRole.toUpperCase()}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
