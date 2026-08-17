import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorFallback({ error, resetError }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white max-w-md w-full rounded-[32px] p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-fade-in relative overflow-hidden">
        
        {/* Background decorative blob */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-50 rounded-full blur-3xl opacity-60"></div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce-slow">
            <AlertTriangle className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            Oops! Something broke.
          </h1>
          
          <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
            We are deeply sorry, but an unexpected error occurred. Our engineering team has been automatically notified and is looking into it.
          </p>

          {/* Error Details Removed for cleaner customer experience */}

          <div className="flex w-full gap-3 flex-col sm:flex-row">
            <button
              onClick={() => {
                window.location.replace('/#/menu');
                window.location.reload();
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Menu
            </button>
            
            <button
              onClick={() => {
                // If resetError is provided by Sentry, call it. Otherwise, reload the page.
                if (resetError) {
                  resetError();
                } else {
                  window.location.reload();
                }
              }}
              className="flex-1 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-sm py-4 rounded-xl transition-all shadow-md shadow-slate-300 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
