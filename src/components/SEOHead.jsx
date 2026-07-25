import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEO_META_MAP = {
  '/': {
    title: 'Go Canteen — Fresh Campus Food Ordering & Express Counter Pickup',
    description: 'Order fresh canteen food, beverages, rolls, pizzas, and snacks online at Go Canteen (gocanteen.in). Enjoy fast counter pickup and live token tracking.'
  },
  '/menu': {
    title: 'Canteen Menu & Daily Offers — Go Canteen',
    description: 'Explore the full canteen menu on Go Canteen. Filter items by category, apply coupon promo codes, and order instantly online.'
  },
  '/cart': {
    title: 'Review Cart & Checkout — Go Canteen',
    description: 'Review your selected canteen items, apply coupon promo codes, and pay securely via UPI, Razorpay, or Cash at Counter.'
  },
  '/orders': {
    title: 'Live Order Token Tracking — Go Canteen',
    description: 'Track your live order token status in real-time. View pickup security PIN and itemized order receipt on Go Canteen.'
  },
  '/policies': {
    title: 'Privacy Policy, Terms & Refunds — Go Canteen',
    description: 'Read Go Canteen official privacy policy, terms of service, refund policy, and contact support details.'
  },
  '/profile': {
    title: 'My Profile & Account Settings — Go Canteen',
    description: 'Manage your Go Canteen customer profile, saved phone number, and preferences.'
  }
};

export default function SEOHead() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname || '/';
    const seoData = SEO_META_MAP[path] || SEO_META_MAP['/'];

    // Update document title dynamically
    document.title = seoData.title;

    // Update or create Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = seoData.description;

    // Update OpenGraph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.content = seoData.title;
    }

    // Update OpenGraph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.content = seoData.description;
    }
  }, [location]);

  return null;
}
