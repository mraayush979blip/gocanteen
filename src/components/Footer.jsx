import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, Mail, Phone, Shield, ChefHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer({ onOpenAdminAuth, onOpenStaffAuth }) {
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <footer className="bg-slate-900 text-slate-300 pt-10 pb-8 border-t border-slate-800 text-xs w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">GO CANTEEN</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Fast, fresh canteen ordering. Order your favorite food online for instant counter pickup.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Razorpay Verified Merchant</span>
            </div>
          </div>

          {/* Col 2: Legal & Mandatory Policies */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">Razorpay Legal Policies</h4>
            <ul className="space-y-2 font-medium">
              <li>
                <button
                  onClick={() => navigate('/terms')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/privacy')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/refund')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Cancellation & Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/shipping')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Shipping & Delivery Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/contact')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider">Contact & Support</h4>
            <ul className="space-y-2.5 font-medium text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href="mailto:gocanteen8@gmail.com" className="hover:text-white transition-colors">
                  gocanteen8@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href="tel:+919244217287" className="hover:text-white transition-colors">
                  +91 9244217287
                </a>
              </li>
            </ul>
            <div className="pt-2 space-y-1">
              <span className="text-[11px] text-slate-400 font-extrabold block">Accepted Payments</span>
              <p className="text-[11px] text-slate-400 font-medium">UPI (GPay / PhonePe / Paytm) • Cash</p>
              <p className="text-[10px] text-emerald-400 font-bold">Secured by Razorpay Payments</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar — Mobile Responsive Layout */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[11px] text-center md:text-left">
          <p>© {new Date().getFullYear()} <span className="text-white font-bold uppercase">Go Canteen</span>. All rights reserved.</p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/privacy')} className="hover:text-white">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-white">Terms</button>
            <button onClick={() => navigate('/refund')} className="hover:text-white">Refunds</button>
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
