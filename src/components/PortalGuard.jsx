import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock } from 'lucide-react';

export default function PortalGuard({ requiredRole, children, onOpenAuth }) {
  const { session, userRole, profile, isAdminUnlocked } = useAuth();

  const isAuthorized =
    requiredRole === 'staff'
      ? userRole === 'staff' || isAdminUnlocked
      : requiredRole === 'admin'
      ? userRole === 'admin' || isAdminUnlocked
      : requiredRole === 'customer'
      ? userRole === 'customer'
      : true;

  if (!isAuthorized) {
    if (userRole === 'staff') {
      return <Navigate to="/staff/kds" replace />;
    }
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/menu" replace />;
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
