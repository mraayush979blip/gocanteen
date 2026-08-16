import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Shield, ChefHat, KeyRound } from 'lucide-react';

export default function AdminStaffLogin() {
  const navigate = useNavigate();
  const { session, userRole, loading: authLoading, setActivePortal, showToast } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin Unlock Code Gate State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');

  // If they are already logged in and try to access this page, redirect them appropriately or let them switch
  // But for simplicity, we just handle login here
  
  useEffect(() => {
    if (!authLoading && session?.user) {
      if (userRole === 'admin') {
        setActivePortal('admin');
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'staff') {
        setActivePortal('staff');
        navigate('/staff/kds', { replace: true });
      } else {
        setActivePortal('customer');
        navigate('/menu', { replace: true });
      }
    }
  }, [session, userRole, authLoading, navigate, setActivePortal]);

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
        // Fetch database profile role to ensure strict enforcement
        const { data: dbProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_temporary, valid_till')
          .eq('id', data.user.id)
          .single();

        let actualRole = 'customer';
        if (!profileError && dbProfile) {
          actualRole = dbProfile.role || 'customer';

          if (dbProfile.is_temporary && dbProfile.valid_till && new Date(dbProfile.valid_till) < new Date()) {
            await supabase.auth.signOut();
            throw new Error(`Access Denied: Your temporary access expired on ${new Date(dbProfile.valid_till).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Please contact the administrator.`);
          }
        }

        // Strict role validation: user cannot sign in as a different role
        if (actualRole !== selectedRole) {
          await supabase.auth.signOut();
          throw new Error(`Access Denied: This account is registered as ${actualRole.toUpperCase()}. Please select the correct portal view to log in.`);
        }

        setActivePortal(selectedRole);
        if (selectedRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (selectedRole === 'staff') {
          navigate('/staff/kds');
        } else {
          navigate('/menu');
        }
      }

      showToast(`Welcome! Logged into ${selectedRole.toUpperCase()} portal 🙌`);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl animate-fade-in relative space-y-5">
        
        {/* Header */}
        <div className="text-center">
          {selectedRole === 'admin' ? (
            <div className="relative w-16 h-16 mx-auto mb-3 shrink-0">
              <div className="w-full h-full rounded-2xl bg-white border border-slate-200/90 overflow-hidden flex items-center justify-center shadow-xs p-1">
                <img src="/app-icon.png" alt="Go Canteen Admin Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-purple-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md border border-white shadow-2xs uppercase tracking-wider">
                Admin
              </span>
            </div>
          ) : (
            <div className="relative w-16 h-16 mx-auto mb-3 shrink-0">
              <div className="w-full h-full rounded-2xl bg-white border border-slate-200/90 overflow-hidden flex items-center justify-center shadow-xs p-1">
                <img src="/app-icon.png" alt="Go Canteen Staff Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md border border-white shadow-2xs uppercase tracking-wider">
                Staff
              </span>
            </div>
          )}
          
          <h2 className="text-xl font-extrabold text-slate-900">
            {selectedRole === 'admin' 
              ? 'Go Canteen Admin Portal' 
              : 'Kitchen Staff Sign In'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {`Official ${selectedRole.toUpperCase()} security credentials required`}
          </p>
        </div>

        {/* Toggle */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'admin'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Admin</span>
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
        </div>

        {/* Form Container */}
        <div>
          {selectedRole === 'admin' && !isAdminUnlocked ? (
            <form onSubmit={handleVerifyAdminPasscode} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Passcode
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPasscodeInput}
                    onChange={(e) => setAdminPasscodeInput(e.target.value)}
                    placeholder="Enter 6-digit passcode"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-purple-600 font-medium tracking-widest"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                  First layer security. Passcode is required before exposing the actual Admin Login form.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying Code...' : 'Unlock Admin Credentials Gate →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-3 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {`Official ${selectedRole.toUpperCase()} Email`}
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
                className={`w-full py-3 rounded-xl text-white font-extrabold text-xs shadow-sm transition-all disabled:opacity-50 ${
                  selectedRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? 'Please wait...' : `Sign In as ${selectedRole.toUpperCase()}`}
              </button>
            </form>
          )}
        </div>
        
        <div className="pt-2 text-center">
          <button
            onClick={() => navigate('/menu')}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to Customer Menu
          </button>
        </div>
      </div>
    </div>
  );
}
