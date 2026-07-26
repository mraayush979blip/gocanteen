import { useState } from 'react';
import { 
  ShieldCheck, FileText, RefreshCw, Truck, Mail, Phone, 
  Lock, CheckCircle2, UtensilsCrossed 
} from 'lucide-react';

export const POLICIES = {
  contact: {
    id: 'contact',
    title: 'Contact Us',
    icon: Mail,
    badge: 'Verification Approved',
    subtitle: 'Get in touch with the Go Canteen support team'
  },
  terms: {
    id: 'terms',
    title: 'Terms & Conditions',
    icon: FileText,
    badge: 'Legal Agreement',
    subtitle: 'Terms governing the use of Go Canteen services'
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: ShieldCheck,
    badge: 'Data Security',
    subtitle: 'How we collect, use, and protect your information'
  },
  refund: {
    id: 'refund',
    title: 'Cancellation & Refund Policy',
    icon: RefreshCw,
    badge: '5-7 Days Processing',
    subtitle: 'Rules for order cancellations and refund timelines'
  },
  shipping: {
    id: 'shipping',
    title: 'Shipping & Fulfillment Policy',
    icon: Truck,
    badge: 'Counter Pickup',
    subtitle: 'Information on order fulfillment and counter pickup'
  }
};

export default function PolicyPage({ initialPolicy = 'contact', onBackToMenu }) {
  const [activePolicy, setActivePolicy] = useState(initialPolicy);

  return (
    <div className="max-w-5xl mx-auto py-6 px-3 sm:px-6 animate-fade-in text-slate-900">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 transform translate-x-10 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-yellow-300 font-extrabold text-xs tracking-wider uppercase">GO CANTEEN • LEGAL & COMPLIANCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {POLICIES[activePolicy]?.title}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-1">
              {POLICIES[activePolicy]?.subtitle}
            </p>
          </div>

          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs border border-white/20 transition-all shrink-0 flex items-center gap-1.5"
            >
              ← Back to Menu
            </button>
          )}
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none border-t border-emerald-600/50 pt-4">
          {Object.values(POLICIES).map((policy) => {
            const Icon = policy.icon;
            const isActive = activePolicy === policy.id;
            return (
              <button
                key={policy.id}
                onClick={() => setActivePolicy(policy.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-yellow-400 text-slate-950 font-black shadow-sm'
                    : 'bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900/60 hover:text-white border border-emerald-600/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{policy.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm leading-relaxed space-y-8">
        
        {/* 1. CONTACT US PAGE */}
        {activePolicy === 'contact' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-slate-100 pb-6">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-extrabold tracking-wide uppercase border border-emerald-200">
                Official Merchant Contact
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">Get in Touch with Go Canteen</h2>
              <p className="text-xs text-slate-500 mt-1">
                For any order inquiries, support, or billing issues, feel free to reach out to us using the contact details below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Support Email</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    <a href="mailto:mail@gocanteen.in" className="hover:underline text-emerald-700">mail@gocanteen.in</a>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Direct support channel for payment and order queries.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Helpline Number</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    <a href="tel:+919244217287" className="hover:underline text-emerald-700">+91 9244217287</a>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Call or WhatsApp for immediate canteen counter assistance.</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-900 font-bold">
                Registered Merchant Entity: <span className="underline font-black uppercase">Go Canteen</span>. Verified for payment processing.
              </p>
            </div>
          </div>
        )}

        {/* 2. TERMS & CONDITIONS */}
        {activePolicy === 'terms' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[11px] font-extrabold tracking-wide uppercase border border-purple-200">
                Merchant Terms
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">Terms & Conditions of Service</h2>
              <p className="text-xs text-slate-500 mt-1">Last updated: July 2026</p>
            </div>

            <div className="space-y-4">
              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">1. Introduction</h3>
                <p>
                  Welcome to <b>Go Canteen</b>. By accessing our web application, placing food orders, or making online payments, you agree to be bound by these Terms & Conditions. If you do not agree, please refrain from using our service.
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">2. Eligibility & Access</h3>
                <p>
                  Our canteen ordering platform is open to <b>everyone</b>. There are no restricted eligibility criteria.
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">3. User Account Responsibilities</h3>
                <p>
                  Users are responsible for ensuring the accuracy of food orders placed under their account/session. You are responsible for maintaining the confidentiality of any access tokens or contact details provided during checkout.
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">4. Payment Terms & Currency</h3>
                <p>
                  All payments on <b>Go Canteen</b> are accepted in <b>Indian Rupees (INR ₹)</b> only. We support payments via UPI, Netbanking (processed securely via Razorpay), and Cash at counter.
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">5. Governing Law</h3>
                <p>
                  These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of the use of this service shall be subject to exclusive jurisdiction of Indian courts.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* 3. PRIVACY POLICY */}
        {activePolicy === 'privacy' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-extrabold tracking-wide uppercase border border-blue-200">
                Data Protection
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">Privacy Policy</h2>
              <p className="text-xs text-slate-500 mt-1">Your privacy is important to Go Canteen</p>
            </div>

            <div className="space-y-4">
              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">1. Information We Collect</h3>
                <p>
                  We collect information necessary to process your food orders efficiently:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1 font-medium text-slate-800">
                  <li>Full Name and Contact Information (Email Address, Phone Number)</li>
                  <li>Order details, item choices, dietary preferences, and order history</li>
                  <li>Table number / Order Token number for canteen counter fulfillment</li>
                </ul>
              </section>

              <section className="space-y-1 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm mb-1">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>2. Payment Security Clause</span>
                </div>
                <p className="text-xs text-slate-600">
                  All online payment transactions are encrypted and processed securely by <b>Razorpay Payment Gateway</b>. 
                  <b> Go Canteen NEVER stores, logs, or processes sensitive payment details or UPI PINs on our servers.</b>
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">3. Cookies & Local Storage</h3>
                <p>
                  We use standard session cookies and browser local storage solely to keep you logged in, save items in your active shopping cart, and maintain order state. We do not sell or share user data with third-party advertisers.
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">4. Privacy Inquiries</h3>
                <p>
                  If you have any questions or concerns regarding your personal data, please contact our Privacy Coordinator at:
                  <br />
                  📧 <b>Email:</b> <a href="mailto:mail@gocanteen.in" className="text-emerald-700 underline">mail@gocanteen.in</a>
                  <br />
                  📞 <b>Phone:</b> +91 9244217287
                </p>
              </section>
            </div>
          </div>
        )}

        {/* 4. CANCELLATION & REFUND POLICY */}
        {activePolicy === 'refund' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-[11px] font-extrabold tracking-wide uppercase border border-amber-200">
                Refund Rules
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">Cancellation & Refund Policy</h2>
              <p className="text-xs text-slate-500 mt-1">Clear guidelines for order cancellations and refund requests</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200">
                <span className="text-[11px] font-extrabold uppercase text-amber-900 tracking-wider">Cancellation Window</span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Orders can be cancelled prior to kitchen preparation starting. Once the kitchen marks the order as "Preparing", cancellations are not accepted to prevent food waste.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-200">
                <span className="text-[11px] font-extrabold uppercase text-emerald-900 tracking-wider">Refund Processing Time</span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Approved refunds for cancelled orders or payment failures are processed back to your original payment method within <b>5 to 7 business days</b>.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">1. Failed or Debited Transactions</h3>
                <p>
                  In case money was debited from your account/UPI but the order was not generated due to network issues, Razorpay will automatically initiate an instant reversal. The amount will reflect in your account within 5–7 working days.
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">2. Quality or Order Discrepancy</h3>
                <p>
                  If an item received is missing or unsatisfactory, please notify the canteen counter staff immediately or contact support at <b>refund@gocanteen.in</b> / <b>+91 9244217287</b> for a replacement or counter refund.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* 5. SHIPPING & DELIVERY / FULFILLMENT POLICY */}
        {activePolicy === 'shipping' && (
          <div className="space-y-6 animate-fade-in text-xs sm:text-sm text-slate-700">
            <div className="border-b border-slate-100 pb-4">
              <span className="px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-[11px] font-extrabold tracking-wide uppercase border border-teal-200">
                Order Fulfillment
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">Shipping, Delivery & Counter Pickup Policy</h2>
              <p className="text-xs text-slate-500 mt-1">Detailed terms regarding order fulfillment and pickup at Go Canteen</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <Truck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Fulfillment Time</span>
                <p className="text-sm font-black text-slate-900 mt-1">15 – 30 Minutes</p>
                <p className="text-[11px] text-slate-500">Freshly prepared after order placement</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <Truck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Shipping Fee</span>
                <p className="text-sm font-black text-slate-900 mt-1">₹0 (Free)</p>
                <p className="text-[11px] text-slate-500">No delivery charges for counter pickup</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <UtensilsCrossed className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Fulfillment Mode</span>
                <p className="text-sm font-black text-slate-900 mt-1">Self Pickup / Counter</p>
                <p className="text-[11px] text-slate-500">Collect directly at canteen counter</p>
              </div>
            </div>

            <div className="space-y-4">
              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">1. Self-Pickup Policy</h3>
                <p>
                  <b>Go Canteen operates on a self-pickup / canteen counter model.</b> Customers collect their prepared food items directly from the canteen pickup counter.
                </p>
              </section>

              <section className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">2. Order Tracking & Notifications</h3>
                <p>
                  Customers can track live order progress (<i>"Pending"</i> → <i>"Preparing"</i> → <i>"Ready for Pickup"</i>) directly in the app under the <b>My Orders</b> section using their Token Number.
                </p>
              </section>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
