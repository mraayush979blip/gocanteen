/**
 * Centralized Financial & Metadata Helper for Orders
 * Handles orders with or without applied promo coupons and cancellation reason extraction.
 */
export function getOrderFinancials(order) {
  if (!order) {
    return { subtotal: 0, discount: 0, finalAmount: 0, couponCode: '' };
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
  let couponCode = order.coupon_code || order.promo_code || '';
  let rawTotalAmount = Number(order.total_amount || 0);

  // 3. Fallback: Parse coupon metadata embedded in special_instructions if DB columns were empty
  if (order.special_instructions) {
    const savedMatch = order.special_instructions.match(/Saved:\s*₹?(\d+(\.\d+)?)/i);
    const subtotalMatch = order.special_instructions.match(/Subtotal:\s*₹?(\d+(\.\d+)?)/i);
    const couponMatch = order.special_instructions.match(/Coupon:\s*([A-Z0-9_-]+)/i);

    if (savedMatch && savedMatch[1] && discount === 0) {
      discount = Number(savedMatch[1]);
    }
    if (subtotalMatch && subtotalMatch[1] && subtotal === 0) {
      subtotal = Number(subtotalMatch[1]);
    }
    if (couponMatch && couponMatch[1] && !couponCode) {
      couponCode = couponMatch[1];
    }
  }

  // 4. Derive subtotal if still 0
  if (subtotal <= 0) {
    if (grossItemsTotal > 0) {
      subtotal = grossItemsTotal;
    } else {
      subtotal = rawTotalAmount + discount;
    }
  }

  // 5. Derive final amount after coupon discount
  let finalAmount = rawTotalAmount;
  if (discount > 0) {
    if (rawTotalAmount === subtotal || rawTotalAmount > (subtotal - discount)) {
      finalAmount = Math.max(0, subtotal - discount);
    }
  } else {
    finalAmount = subtotal > 0 ? subtotal : rawTotalAmount;
  }

  return {
    subtotal: Math.round(subtotal),
    discount: Math.round(discount),
    finalAmount: Math.round(finalAmount),
    couponCode: couponCode ? couponCode.toUpperCase() : ''
  };
}

export function getEffectiveOrderPrice(order) {
  return getOrderFinancials(order).finalAmount;
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
