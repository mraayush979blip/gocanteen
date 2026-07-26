import { supabase } from './supabase';
import { getOrderId } from './orderUtils';

export async function sendOrderReadyEmail(order) {
  try {
    let customerEmail = order.customer_email;

    if (!customerEmail && order.customer_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.customer_id)
        .maybeSingle();

      if (prof?.email) customerEmail = prof.email;
    }

    if (!customerEmail) {
      console.warn('No customer email found for order:', order.id);
      return { success: false, message: 'No customer email found' };
    }

    // Extract Pickup PIN fallback if pickup_code column is not present
    let pickupPin = order.pickup_code;
    if (!pickupPin && order.special_instructions) {
      const pinMatch = order.special_instructions.match(/🔑 PIN:\s*(\d+)/i);
      if (pinMatch) pickupPin = pinMatch[1];
    }

    // Trigger Supabase SMTP
    const { error: smtpError } = await supabase.auth.signInWithOtp({
      email: customerEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/#/orders`,
        data: {
          order_id: getOrderId(order),
          token_number: order.token_number || order.id.slice(0, 4),
          pickup_code: pickupPin || '----',
          customer_name: order.customer_name || 'Valued Customer'
        }
      }
    });

    if (smtpError) {
      console.warn('Supabase SMTP trigger notice:', smtpError.message);
    } else {
      console.log('✅ Supabase SMTP email sent successfully to:', customerEmail);
    }

    return { success: true, email: customerEmail };
  } catch (err) {
    console.error('Error sending order ready notification:', err);
    return { success: false, error: err.message };
  }
}

export async function sendRefundNotificationEmail(order, cancellationReason) {
  try {
    let customerEmail = order.customer_email;
    let customerName = order.customer_name;

    // Fallback: fetch from profiles table if not on the order object
    if (!customerEmail && order.customer_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', order.customer_id)
        .maybeSingle();

      if (prof?.email) customerEmail = prof.email;
      if (prof?.full_name && !customerName) customerName = prof.full_name;
    }

    if (!customerEmail) {
      console.warn('No customer email found for refund notification:', order.id);
      return { success: false, message: 'No customer email found' };
    }

    const orderIdStr = getOrderId(order);
    const tokenNum = order.token_number || order.id.slice(0, 4);
    const refundAmount = order.total_amount
      ? `₹${order.total_amount}`
      : order.amount
        ? `₹${order.amount}`
        : 'your paid amount';
    const cancelReason = cancellationReason || 'Kitchen out of stock or staff cancellation';
    const payMethod = (order.payment_method || 'UPI').toUpperCase();
    const safeCustomerName = customerName || 'Valued Customer';

    // POST to Vercel API route which uses service_role key server-side (safe)
    const response = await fetch('/api/send-refund-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail,
        customerName: safeCustomerName,
        tokenNumber: tokenNum,
        orderId: orderIdStr,
        refundAmount,
        paymentMethod: payMethod,
        cancellationReason: cancelReason
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn('Refund email API error:', result.error);
    } else {
      console.log('✅ Refund email sent to:', customerEmail, '| Token:', tokenNum, '| Amount:', refundAmount);
    }

    return { success: response.ok, email: customerEmail };
  } catch (err) {
    console.error('Error sending refund notification:', err);
    return { success: false, error: err.message };
  }
}
