import { useAuth } from '../context/AuthContext';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Toast() {
  const { toast } = useAuth();

  if (!toast.show) return null;

  return (
    <div className="fixed bottom-28 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-[999] animate-bounce-short pointer-events-none flex justify-center sm:justify-end">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold pointer-events-auto ${
          toast.isError
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-900 text-white border-emerald-800'
        }`}
      >
        {toast.isError ? (
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        )}
        <span className="tracking-wide">{toast.message}</span>
      </div>
    </div>
  );
}
