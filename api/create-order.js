import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Enforce POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items, isParcel, appliedPromo, enablePlatformFee, amount, currency, receipt } = req.body;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay API credentials are not configured on the server' });
  }

  let finalPayableAmountPaise = Math.round(amount || 0);

  // Server-Side Price & Total Recalculation directly from Supabase DB
  if (items && Array.isArray(items) && items.length > 0) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const itemIds = items.map(i => i.id).filter(Boolean);

        const { data: dbInventory } = await supabase
          .from('inventory')
          .select('id, price, is_available, is_active')
          .in('id', itemIds);

        const { data: dbOffers } = await supabase
          .from('offers')
          .select('id, price, is_active')
          .in('id', itemIds);

        let serverSubtotal = 0;
        let packagableCount = 0;

        items.forEach(cartItem => {
          const qty = Number(cartItem.qty || cartItem.quantity || 1);
          const dbItem = dbInventory?.find(i => i.id === cartItem.id) || dbOffers?.find(o => o.id === cartItem.id);
          const price = dbItem ? Number(dbItem.price) : Number(cartItem.price || 0);
          serverSubtotal += price * qty;

          if (cartItem.has_packaging_charge) {
            packagableCount += qty;
          }
        });

        let discountPercent = 0;
        if (appliedPromo?.code) {
          const { data: promoData } = await supabase
            .from('promo_codes')
            .select('discount_percent, is_active, valid_till')
            .eq('code', String(appliedPromo.code).toUpperCase().trim())
            .maybeSingle();

          if (promoData && promoData.is_active !== false) {
            if (!promoData.valid_till || new Date(promoData.valid_till) >= new Date()) {
              discountPercent = Number(promoData.discount_percent || 0);
            }
          }
        }

        const discountAmt = Math.round((serverSubtotal * discountPercent) / 100);
        const amountAfterDiscount = Math.max(0, serverSubtotal - discountAmt);
        const parcelCharge = isParcel ? (10 * packagableCount) : 0;
        const baseAmount = amountAfterDiscount + parcelCharge;
        const platformFee = (enablePlatformFee !== false) ? Number((baseAmount * 0.0236).toFixed(2)) : 0;
        const serverFinalAmountRupees = Number((baseAmount + platformFee).toFixed(2));

        // Convert rupees to paise for Razorpay order creation
        finalPayableAmountPaise = Math.round(serverFinalAmountRupees * 100);
      }
    } catch (err) {
      console.warn('Server-side price recalculation warning (using provided amount):', err.message);
    }
  }

  // Validate amount (must be >= 100 paise / ₹1)
  if (!finalPayableAmountPaise || finalPayableAmountPaise < 100) {
    return res.status(400).json({ error: 'Minimum amount must be 100 paise (₹1)' });
  }

  // Initialize Razorpay SDK
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });

  try {
    const order = await razorpay.orders.create({
      amount: finalPayableAmountPaise,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`
    });

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
