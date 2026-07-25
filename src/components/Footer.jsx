import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, Mail, Phone, Shield, ChefHat, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer({ onOpenAdminAuth, onOpenStaffAuth, onOpenReportBug, onOpenAboutDev }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-8 pb-8 border-t border-slate-800 text-xs w-full max-w-full overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out forwards;
        }
      ` }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Branding and Collapse Control Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">GO CANTEEN</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
              Fast, fresh canteen ordering. Order your favorite food online for instant counter pickup.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Razorpay Verified Merchant</span>
              </div>
              <button
                onClick={onOpenAboutDev}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 font-extrabold text-[10px] border border-indigo-700/40 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>💻 About Developer</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs border border-slate-700 transition-all shadow-md active:scale-98 cursor-pointer select-none"
          >
            <span>{isExpanded ? 'Hide Policies & Contact' : 'Show Policies & Contact'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 border-b border-slate-800/60 animate-slide-down">
            {/* Col 1: Razorpay Legal Policies */}
            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Razorpay Legal Policies
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium">
                <li>
                  <button
                    onClick={() => navigate('/terms')}
                    className="hover:text-emerald-400 transition-colors text-left py-0.5"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/privacy')}
                    className="hover:text-emerald-400 transition-colors text-left py-0.5"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/refund')}
                    className="hover:text-emerald-400 transition-colors text-left py-0.5"
                  >
                    Cancellation & Refund Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/shipping')}
                    className="hover:text-emerald-400 transition-colors text-left py-0.5"
                  >
                    Shipping & Delivery Policy
                  </button>
                </li>
                <li className="sm:col-span-2">
                  <button
                    onClick={() => navigate('/contact')}
                    className="hover:text-emerald-400 transition-colors text-left py-0.5"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 2: Contact & Support */}
            <div className="space-y-3">
              <h4 className="text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Contact & Support
              </h4>
              <ul className="space-y-2 font-medium text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href="mailto:gocanteen8@gmail.com" className="hover:text-white transition-colors">
                    gocanteen8@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <a href="mailto:mraayush979@gmail.com" className="hover:text-white transition-colors font-semibold text-indigo-300 font-['Plus_Jakarta_Sans',sans-serif]">
                    mraayush979@gmail.com (Dev)
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href="tel:+919244217287" className="hover:text-white transition-colors">
                    +91 9244217287
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Bottom Bar — Mobile Responsive Layout */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-450 text-[11px] text-center md:text-left text-slate-400">
          <p>© {new Date().getFullYear()} <span className="text-white font-bold uppercase">Go Canteen</span>. Designed & Engineered by <button onClick={onOpenAboutDev} className="text-indigo-400 hover:underline font-bold">Aayush Sharma</button>.</p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/privacy')} className="hover:text-white">Privacy</button>
            <span>•</span>
            <button onClick={() => navigate('/terms')} className="hover:text-white">Terms</button>
            <span>•</span>
            <button onClick={() => navigate('/refund')} className="hover:text-white">Refunds</button>
            <span>•</span>
            <button onClick={() => navigate('/contact')} className="hover:text-white">Contact</button>
          </div>

          {/* Render Staff & Admin Login buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                if (onOpenStaffAuth) onOpenStaffAuth();
                navigate('/staff');
              }}
              className="text-emerald-400 hover:text-emerald-300 font-extrabold flex items-center gap-1.5 bg-emerald-400/10 hover:bg-emerald-400/20 px-2.5 py-1 rounded-lg border border-emerald-400/30 transition-all cursor-pointer text-[11px] shrink-0"
            >
              <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
              <span>Staff Login</span>
            </button>
            <button
              onClick={() => {
                if (onOpenAdminAuth) onOpenAdminAuth();
                navigate('/admin');
              }}
              className="text-amber-400 hover:text-amber-300 font-extrabold flex items-center gap-1.5 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/30 transition-all cursor-pointer text-[11px] shrink-0"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
