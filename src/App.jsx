import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import FloatingCouponBanner from './components/FloatingCouponBanner';
import Toast from './components/Toast';
import AuthModal from './pages/AuthModal';
import PortalGuard from './components/PortalGuard';
import { AlertTriangle, ExternalLink } from 'lucide-react';

// Customer Pages
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerCart from './pages/customer/CustomerCart';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerProfile from './pages/customer/CustomerProfile';

// Staff Pages
import KitchenQueue from './pages/staff/KitchenQueue';
import StaffHistory from './pages/staff/StaffHistory';
import QuickStock from './pages/staff/QuickStock';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOffers from './pages/admin/AdminOffers';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';
import AdminStaff from './pages/admin/AdminStaff';
import AdminOrders from './pages/admin/AdminOrders';

import Footer from './components/Footer';
import PolicyPage from './components/PolicyPage';
import ReportBugModal from './components/ReportBugModal';
import AboutDeveloperModal from './components/AboutDeveloperModal';
import SEOHead from './components/SEOHead';
import SplashScreen from './components/SplashScreen';
import PwaInstallPrompt from './components/PwaInstallPrompt';


function StaffLayout({ activeSubView, onOpenAuth }) {

  const navigate = useNavigate();

  return (
    <PortalGuard requiredRole="staff" onOpenAuth={onOpenAuth}>
      <div className="space-y-5">
        {/* 3-Bar Staff Navigation Header */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-2xs flex items-center gap-2 overflow-x-auto scrollbar-none max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/staff/kds')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeSubView === 'kds'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>👨‍🍳 1. Kitchen Queue</span>
          </button>

          <button
            onClick={() => navigate('/staff/stock')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeSubView === 'stock'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>📦 2. Stock Availability</span>
          </button>

          <button
            onClick={() => navigate('/staff/history')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shrink-0 ${
              activeSubView === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>📋 3. Order History Log</span>
          </button>
        </div>

        {/* Active Sub View */}
        {activeSubView === 'history' && <StaffHistory />}
        {activeSubView === 'stock' && <QuickStock />}
        {activeSubView === 'kds' && <KitchenQueue />}
      </div>
    </PortalGuard>
  );
}

function AdminLayout({ activeSubView, onOpenAuth }) {
  return (
    <PortalGuard requiredRole="admin" onOpenAuth={onOpenAuth}>
      {activeSubView === 'inventory' && <AdminInventory />}
      {activeSubView === 'categories' && <AdminCategories />}
      {activeSubView === 'offers' && <AdminOffers />}
      {activeSubView === 'promos' && <AdminPromoCodes />}
      {activeSubView === 'staff' && <AdminStaff />}
      {activeSubView === 'orders' && <AdminOrders />}
      {activeSubView === 'dashboard' && <AdminDashboard />}
    </PortalGuard>
  );
}

function MainContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectionError, session } = useAuth();
  
  const [showSplash, setShowSplash] = useState(true);
  
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Initialize Lenis Smooth Scrolling on Mount
  useEffect(() => {
    let lenisInstance = null;
    let animationFrameId = null;

    // Dynamically import Lenis to prevent bundle bloat and ensure fast client-side hydration
    import('lenis').then(({ default: Lenis }) => {
      lenisInstance = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Silky exponential inertia glide
        smoothWheel: true,
        smoothTouch: false, // Keep native touch velocity on mobile for optimal responsiveness
      });

      function raf(time) {
        lenisInstance?.raf(time);
        animationFrameId = requestAnimationFrame(raf);
      }

      animationFrameId = requestAnimationFrame(raf);
    }).catch(err => {
      console.warn("Could not load Lenis smooth scrolling library:", err);
    });

    return () => {
      if (lenisInstance) {
        lenisInstance.destroy();
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState('customer');
  const [cartOpen, setCartOpen] = useState(false);
  const [reportBugOpen, setReportBugOpen] = useState(false);
  const [aboutDevOpen, setAboutDevOpen] = useState(false);

  const handleOpenAuth = (role = 'customer') => {
    setAuthModalRole(role);
    setAuthModalOpen(true);
  };

  useEffect(() => {
    if (session?.user) {
      setAuthModalOpen(false);
    }
  }, [session]);

  const p = location.pathname;
  const activePortal = p.startsWith('/admin') ? 'admin' : p.startsWith('/staff') ? 'staff' : 'customer';
  const isLegalPolicyRoute = ['/terms', '/privacy', '/refund', '/shipping', '/contact'].includes(p);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] w-full max-w-full overflow-x-hidden">
      <SEOHead />
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      
      {/* Supabase Connection Warning Banner */}

      {connectionError && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <b>Supabase Project Paused or Offline:</b> Could not resolve host <code className="bg-slate-200 px-1.5 py-0.5 rounded text-amber-900">bgntoqmqeetsnvauloph.supabase.co</code>. If your Supabase project is paused, open your Supabase Dashboard and click <b>Resume Project</b>.
            </span>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-[11px] shrink-0 flex items-center gap-1 transition-all"
          >
            Open Dashboard <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => handleOpenAuth('customer')}
        onOpenCart={() => setCartOpen(true)}
        onOpenReportBug={() => setReportBugOpen(true)}
        onOpenAboutDev={() => setAboutDevOpen(true)}
      />

      {/* Floating Coupon & Deal Ticker Banner */}
      {activePortal === 'customer' && !isLegalPolicyRoute && <FloatingCouponBanner />}

      {/* Main Container with React Router Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Default Redirect from Plain Root / */}
          <Route path="/" element={<Navigate to="/menu" replace />} />

          {/* Customer Routes protected strictly for customers */}
          <Route path="/menu" element={
            <PortalGuard requiredRole="customer" onOpenAuth={() => handleOpenAuth('customer')}>
              <CustomerMenu onOpenCart={() => setCartOpen(true)} />
            </PortalGuard>
          } />
          <Route path="/orders" element={
            <PortalGuard requiredRole="customer" onOpenAuth={() => handleOpenAuth('customer')}>
              <CustomerOrders onOpenAuth={() => handleOpenAuth('customer')} />
            </PortalGuard>
          } />
          <Route path="/profile" element={
            <PortalGuard requiredRole="customer" onOpenAuth={() => handleOpenAuth('customer')}>
              <CustomerProfile onOpenAuth={() => handleOpenAuth('customer')} />
            </PortalGuard>
          } />

          {/* Staff Routes */}
          <Route path="/staff" element={<Navigate to="/staff/kds" replace />} />
          <Route path="/staff/kds" element={<StaffLayout activeSubView="kds" onOpenAuth={() => handleOpenAuth('staff')} />} />
          <Route path="/staff/stock" element={<StaffLayout activeSubView="stock" onOpenAuth={() => handleOpenAuth('staff')} />} />
          <Route path="/staff/history" element={<StaffLayout activeSubView="history" onOpenAuth={() => handleOpenAuth('staff')} />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminLayout activeSubView="dashboard" onOpenAuth={() => handleOpenAuth('admin')} />} />
          <Route path="/admin/orders" element={<AdminLayout activeSubView="orders" onOpenAuth={() => handleOpenAuth('admin')} />} />
          <Route path="/admin/inventory" element={<AdminLayout activeSubView="inventory" onOpenAuth={() => handleOpenAuth('admin')} />} />
          <Route path="/admin/categories" element={<AdminLayout activeSubView="categories" onOpenAuth={() => handleOpenAuth('admin')} />} />
          <Route path="/admin/offers" element={<AdminLayout activeSubView="offers" onOpenAuth={() => handleOpenAuth('admin')} />} />
          <Route path="/admin/promos" element={<AdminLayout activeSubView="promos" onOpenAuth={() => handleOpenAuth('admin')} />} />
          <Route path="/admin/staff" element={<AdminLayout activeSubView="staff" onOpenAuth={() => handleOpenAuth('admin')} />} />

          {/* Razorpay Policy Routes */}
          <Route path="/terms" element={<PolicyPage initialPolicy="terms" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/privacy" element={<PolicyPage initialPolicy="privacy" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/refund" element={<PolicyPage initialPolicy="refund" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/shipping" element={<PolicyPage initialPolicy="shipping" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/contact" element={<PolicyPage initialPolicy="contact" onBackToMenu={() => navigate('/menu')} />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer
        onOpenAdminAuth={() => handleOpenAuth('admin')}
        onOpenStaffAuth={() => handleOpenAuth('staff')}
        onOpenReportBug={() => setReportBugOpen(true)}
        onOpenAboutDev={() => setAboutDevOpen(true)}
      />

      {/* Slide-over Cart Modal */}
      <CustomerCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onOrderPlaced={() => navigate('/orders')}
        onOpenAuth={() => handleOpenAuth('customer')}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialRole={authModalRole}
      />

      {/* Report Bug / Suggestions Modal */}
      <ReportBugModal
        isOpen={reportBugOpen}
        onClose={() => setReportBugOpen(false)}
      />

      {/* About Developer Modal */}
      <AboutDeveloperModal
        isOpen={aboutDevOpen}
        onClose={() => setAboutDevOpen(false)}
      />

      <Toast />
      <PwaInstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
