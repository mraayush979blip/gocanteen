import { useAuth } from '../context/AuthContext';
import { Lock, ShieldAlert, LogIn, Clock } from 'lucide-react';

export default function PortalGuard({ requiredRole, children, onOpenAuth }) {
  const { session, userRole, profile } = useAuth();

  if (!session) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md mx-auto my-10 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center animate-bounce">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900">Authentication Required</h2>
          <p className="text-xs text-slate-500 font-medium">
            You must be signed in with an authorized <b className="text-slate-900 capitalize">{requiredRole}</b> account to access this portal.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
        >
          <LogIn className="w-4 h-4" /> Sign In to Access Portal
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

  const isAuthorized =
    requiredRole === 'staff'
      ? userRole === 'staff' || userRole === 'admin'
      : requiredRole === 'admin'
      ? userRole === 'admin'
      : true;

  if (!isAuthorized) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md mx-auto my-10 bg-white border border-red-200 rounded-2xl shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-md">
            Access Restricted
          </span>
          <h2 className="text-xl font-extrabold text-slate-900">Unauthorized Role</h2>
          <p className="text-xs text-slate-500 font-medium">
            Your current account role (<span className="text-slate-900 font-bold">{userRole}</span>) does not have permission to view the <b className="text-slate-900 uppercase">{requiredRole}</b> portal.
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
        >
          Switch to Authorized Account
        </button>
      </div>
    );
  }

  return children;
}
