import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import FloatingCouponBanner from './components/FloatingCouponBanner';
import Toast from './components/Toast';
import AuthModal from './pages/AuthModal';
import PortalGuard from './components/PortalGuard';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import NotificationPrompt from './components/NotificationPrompt';

// Customer Pages
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerCart from './pages/customer/CustomerCart';
import CustomerOrders from './pages/customer/CustomerOrders';
import CustomerProfile from './pages/customer/CustomerProfile';

// Staff Pages
import KitchenQueue from './pages/staff/KitchenQueue';
import StaffHistory from './pages/staff/StaffHistory';
import QuickStock from './pages/staff/QuickStock';
import StaffPOS from './pages/staff/StaffPOS';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminInventory from './pages/admin/AdminInventory';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOffers from './pages/admin/AdminOffers';
import AdminPromoCodes from './pages/admin/AdminPromoCodes';
import AdminStaff from './pages/admin/AdminStaff';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOutlets from './pages/admin/AdminOutlets';
import AdminStorage from './pages/admin/AdminStorage';

import Footer from './components/Footer';
import PolicyPage from './components/PolicyPage';
import ReportBug from './pages/ReportBug';
import AboutDeveloper from './pages/AboutDeveloper';
import AdminStaffLogin from './pages/AdminStaffLogin';
import SEOHead from './components/SEOHead';
import SplashScreen from './components/SplashScreen';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import OutletSelectionModal from './components/OutletSelectionModal';
import { AdminProvider } from './context/AdminContext';

function StaffLayout({ activeSubView, onOpenAuth }) {

  const navigate = useNavigate();

  return (
    <PortalGuard requiredRole="staff" onOpenAuth={onOpenAuth}>
      <div className="space-y-5">
        {/* Active Sub View */}
        {activeSubView === 'history' && <StaffHistory />}
        {activeSubView === 'stock' && <QuickStock />}
        {activeSubView === 'kds' && <KitchenQueue />}
        {activeSubView === 'pos' && <StaffPOS />}
      </div>
    </PortalGuard>
  );
}

function AdminLayout({ activeSubView, onOpenAuth }) {
  return (
    <PortalGuard requiredRole="admin" onOpenAuth={onOpenAuth}>
      <AdminProvider>
        {activeSubView === 'inventory' && <AdminInventory />}
        {activeSubView === 'categories' && <AdminCategories />}
        {activeSubView === 'offers' && <AdminOffers />}
        {activeSubView === 'promos' && <AdminPromoCodes />}
        {activeSubView === 'staff' && <AdminStaff />}
        {activeSubView === 'outlets' && <AdminOutlets />}
        {activeSubView === 'orders' && <AdminOrders />}
        {activeSubView === 'dashboard' && <AdminDashboard />}
        {activeSubView === 'storage' && <AdminStorage />}
      </AdminProvider>
    </PortalGuard>
  );
}

function MainContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectionError, session, selectedOutlet, activePortal, showToast } = useAuth();
  
  const [showSplash, setShowSplash] = useState(true);
  
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Handle OAuth Errors in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');
    
    if (error) {
      if (error === 'access_denied') {
        showToast('Sign in was canceled or denied.', true, 5000);
      } else {
        // format error description by replacing '+' with space
        const formattedDesc = errorDescription ? errorDescription.replace(/\+/g, ' ') : error;
        showToast(`Sign in error: ${formattedDesc}`, true, 5000);
      }
      
      // Clean up the URL to remove the error parameters without reloading the page
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [showToast]);

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
  const [cartOpen, setCartOpen] = useState(false);
  const [outletModalOpen, setOutletModalOpen] = useState(false);

  // Force outlet selection for customers
  useEffect(() => {
    if (activePortal === 'customer' && !selectedOutlet && !showSplash) {
      setOutletModalOpen(true);
    }
  }, [activePortal, selectedOutlet, showSplash]);

  const handleOpenAuth = (role = 'customer') => {
    if (role === 'admin' || role === 'staff') {
      navigate('/ad');
    } else {
      setAuthModalOpen(true);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setAuthModalOpen(false);
    }
  }, [session]);

  const p = location.pathname;
  const currentPortal = p.startsWith('/admin') ? 'admin' : p.startsWith('/staff') ? 'staff' : 'customer';
  const isLegalPolicyRoute = ['/terms', '/privacy', '/refund', '/shipping', '/contact', '/report-bug'].includes(p);
  const isDeveloperRoute = p.endsWith('/developer');

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
        onOpenOutletModal={() => setOutletModalOpen(true)}
      />

      {/* Floating Coupon & Deal Ticker Banner */}
      {activePortal === 'customer' && location.pathname === '/menu' && <FloatingCouponBanner />}

      {/* Main Container with React Router Routes */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", stiffness: 280, damping: 25, mass: 1 }}
            className="w-full h-full"
          >
            <Routes location={location}>
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
          <Route path="/staff/pos" element={<StaffLayout activeSubView="pos" onOpenAuth={() => handleOpenAuth('staff')} />} />
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
          <Route path="/admin/outlets" element={<AdminLayout activeSubView="outlets" onOpenAuth={() => handleOpenAuth('admin')} />} />
          <Route path="/admin/storage" element={<AdminLayout activeSubView="storage" onOpenAuth={() => handleOpenAuth('admin')} />} />

          {/* Razorpay Policy Routes */}
          <Route path="/terms" element={<PolicyPage initialPolicy="terms" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/privacy" element={<PolicyPage initialPolicy="privacy" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/refund" element={<PolicyPage initialPolicy="refund" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/shipping" element={<PolicyPage initialPolicy="shipping" onBackToMenu={() => navigate('/menu')} />} />
          <Route path="/contact" element={<PolicyPage initialPolicy="contact" onBackToMenu={() => navigate('/menu')} />} />
          
          <Route path="/report-bug" element={<ReportBug />} />
          
          {/* Scoped Developer Pages */}
          <Route path="/customer/developer" element={<AboutDeveloper />} />
          <Route path="/staff/developer" element={<AboutDeveloper />} />
          <Route path="/admin/developer" element={<AboutDeveloper />} />
          <Route path="/about-developer" element={<Navigate to="/customer/developer" replace />} />

          {/* Hidden login triggers */}
          <Route path="/ad" element={<AdminStaffLogin />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {!isDeveloperRoute && (
        <Footer
          onOpenAdminAuth={() => handleOpenAuth('admin')}
          onOpenStaffAuth={() => handleOpenAuth('staff')}
        />
      )}

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
      />

      <OutletSelectionModal 
        isOpen={outletModalOpen} 
        onClose={() => setOutletModalOpen(false)} 
      />

      <NotificationPrompt />
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
