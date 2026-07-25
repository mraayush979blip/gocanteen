/**
 * Centralized Financial & Metadata Helper for Orders
 * Handles orders with or without applied promo coupons, platform fees, and cancellation reasons.
 */
export function getOrderFinancials(order) {
  if (!order) {
    return { subtotal: 0, discount: 0, foodSalesAmount: 0, platformFee: 0, finalAmount: 0, customerPaid: 0, couponCode: '' };
  }

  // 1. Calculate sum of items if order_items are attached
  let grossItemsTotal = 0;
  if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
    grossItemsTotal = order.order_items.reduce((sum, item) => {
      const price = Number(item.price_at_time || 0);
      const qty = Number(item.quantity || 1);
      return sum + (price * qty);
    }, 0);
  }

  // 2. Read explicit DB columns if present
  let subtotal = Number(order.subtotal_amount || 0);
  let discount = Number(order.discount_amount || 0);
  let platformFee = Number(order.platform_fee || order.gateway_fee || 0);
  let couponCode = order.coupon_code || order.promo_code || '';
  let rawTotalAmount = Number(order.total_amount || 0);

  // 3. Fallback: Parse metadata embedded in special_instructions if DB columns were empty
  if (order.special_instructions) {
    const savedMatch = order.special_instructions.match(/Saved:\s*₹?(\d+(\.\d+)?)/i);
    const subtotalMatch = order.special_instructions.match(/Subtotal:\s*₹?(\d+(\.\d+)?)/i);
    const couponMatch = order.special_instructions.match(/Coupon:\s*([A-Z0-9_-]+)/i);
    const platformMatch = order.special_instructions.match(/Platform Fee[^:]*:\s*\+?₹?(\d+(\.\d+)?)/i);

    if (savedMatch && savedMatch[1] && discount === 0) {
      discount = Number(savedMatch[1]);
    }
    if (subtotalMatch && subtotalMatch[1] && subtotal === 0) {
      subtotal = Number(subtotalMatch[1]);
    }
    if (couponMatch && couponMatch[1] && !couponCode) {
      couponCode = couponMatch[1];
    }
    if (platformMatch && platformMatch[1] && platformFee === 0) {
      platformFee = Number(platformMatch[1]);
    }
  }

  // 4. Derive subtotal if still 0
  if (subtotal <= 0) {
    if (grossItemsTotal > 0) {
      subtotal = grossItemsTotal;
    } else if (rawTotalAmount > 0) {
      subtotal = rawTotalAmount;
    }
  }

  // 5. Calculate Food Net Sales Amount (EXCLUDING Platform Fee)
  const foodSalesAmount = Math.max(0, subtotal - discount);

  // 6. Platform Fee calculation if online payment was used and platformFee wasn't parsed
  const isOnline = order.payment_method === 'razorpay' || order.payment_method === 'razorpay_upi' || order.payment_method === 'online';
  if (isOnline && platformFee <= 0 && foodSalesAmount > 0) {
    if (rawTotalAmount > foodSalesAmount) {
      platformFee = Number((rawTotalAmount - foodSalesAmount).toFixed(2));
    } else {
      platformFee = Number((foodSalesAmount * 0.0236).toFixed(2));
    }
  }

  // 7. Customer Total Paid
  const customerPaid = Number((foodSalesAmount + platformFee).toFixed(2));

  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    foodSalesAmount: Math.round(foodSalesAmount), // PURE CANTEEN SALES (No tax/fee)
    platformFee: platformFee, // ONLINE TAX / PLATFORM FEE
    finalAmount: Math.round(foodSalesAmount), // FOR SALES REVENUE CALCULATION: EXCLUDES PLATFORM FEE
    customerPaid: customerPaid, // TOTAL COST PAID BY CUSTOMER
    couponCode: couponCode ? couponCode.toUpperCase() : ''
  };
}

export function getEffectiveOrderPrice(order) {
  // Always returns PURE CANTEEN FOOD SALES for revenue calculations
  return getOrderFinancials(order).foodSalesAmount;
}

export function getCancellationReason(order) {
  if (!order) return 'Order cancelled';
  
  if (order.cancellation_reason && typeof order.cancellation_reason === 'string' && order.cancellation_reason.trim()) {
    return order.cancellation_reason.trim();
  }

  if (order.special_instructions) {
    const match = order.special_instructions.match(/Cancelled Reason:\s*([^|(]+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Cancelled by kitchen staff';
}
