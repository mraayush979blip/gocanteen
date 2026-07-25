import { useAuth } from '../context/AuthContext';
import { Lock, ShieldAlert, LogIn, Clock, KeyRound } from 'lucide-react';

export default function PortalGuard({ requiredRole, children, onOpenAuth }) {
  const { session, userRole, profile, isAdminUnlocked } = useAuth();

  const isAuthorized =
    requiredRole === 'staff'
      ? userRole === 'staff' || userRole === 'admin' || isAdminUnlocked
      : requiredRole === 'admin'
      ? userRole === 'admin' || isAdminUnlocked
      : true;

  if (!isAuthorized) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto my-10 bg-white border border-purple-200 rounded-3xl shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shadow-inner animate-bounce">
          <KeyRound className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
            Admin Passcode Gate
          </span>
          <h2 className="text-xl font-black text-slate-900">Admin Portal Locked 🔒</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Enter the 6-digit Admin Security Passcode to unlock the Admin Executive Dashboard.
          </p>
        </div>
        <button
          onClick={() => (onOpenAuth ? onOpenAuth('admin') : null)}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <KeyRound className="w-4 h-4 text-yellow-300" />
          <span>Unlock Admin Portal (Enter Passcode) →</span>
        </button>
      </div>
    );
  }

  // Temporary Staff Expiration Check
  const isTempExpired = profile?.is_temporary && profile?.valid_till && new Date(profile.valid_till) < new Date();

  if (isTempExpired) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md mx-auto my-10 bg-white border border-amber-300 rounded-2xl shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
          <Clock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
            Temporary Access Expired
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">Staff Access Expired</h2>
          <p className="text-xs text-slate-500 font-medium">
            Your temporary staff access expired on <b className="text-slate-900">{new Date(profile.valid_till).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b>. Please contact the canteen administrator.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
        >
          Switch Account
        </button>
      </div>
    );
  }

  return children;
}
