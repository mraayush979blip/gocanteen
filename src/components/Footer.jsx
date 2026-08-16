import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, Mail, Phone, Shield, ChefHat, ChevronDown, ChevronUp, Instagram } from 'lucide-react';
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/40">
          <div className="space-y-3 w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-700 overflow-hidden flex items-center justify-center shadow-xs p-0.5 shrink-0">
                <img src="/app-icon.png" alt="Go Canteen Logo" className="w-full h-full object-contain rounded-lg" />
              </div>
              <span className="text-xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">GO CANTEEN</span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
              Fast, fresh canteen ordering. Order your favorite food online for instant counter pickup.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => {
                  const p = window.location.pathname;
                  const portal = p.startsWith('/admin') ? 'admin' : p.startsWith('/staff') ? 'staff' : 'customer';
                  navigate(`/${portal}/developer`);
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 font-extrabold text-[10px] border border-indigo-700/40 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <span>💻 About Developer</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs border border-slate-700 transition-all shadow-md active:scale-98 cursor-pointer select-none"
          >
            <span>{isExpanded ? 'Hide Policies & Contact' : 'Show Policies & Contact'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" />}
          </button>
        </div>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="space-y-6 py-6 border-b border-slate-800/40 animate-slide-down">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Col 1: Razorpay Legal Policies */}
              <div className="space-y-4">
                <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Razorpay Legal Policies
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 font-medium text-slate-400">
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
              <div className="space-y-4">
                <h4 className="text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                  Contact & Support
                </h4>
                <ul className="space-y-3 font-medium text-slate-400">
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <a href="mailto:mail@gocanteen.in" className="hover:text-white transition-colors">
                      mail@gocanteen.in
                    </a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                    <a href="mailto:developer@gocanteen.in" className="hover:text-white transition-colors font-semibold text-indigo-300 font-['Plus_Jakarta_Sans',sans-serif]">
                      developer@gocanteen.in (Dev)
                    </a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <a href="tel:+919244217287" className="hover:text-white transition-colors">
                      +91 9244217287
                    </a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                    <a href="https://www.instagram.com/gocanteen.in/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors font-bold">
                      Instagram (@gocanteen.in)
                    </a>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* Minimal Bottom Bar */}
        <div className="pt-2 flex items-center justify-center text-slate-500 text-[11px] text-center">
          <p>
            © {new Date().getFullYear()} <span className="text-slate-350 font-extrabold uppercase text-xs tracking-wider">Go Canteen</span>. Designed & Engineered by <a href="https://itsaayushsharma.vercel.app" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline font-bold">Aayush Sharma</a>.
          </p>
        </div>

      </div>
    </footer>
  );
}
