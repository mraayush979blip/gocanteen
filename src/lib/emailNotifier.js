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

    if (!customerEmail && order.customer_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', order.customer_id)
        .maybeSingle();

      if (prof?.email) customerEmail = prof.email;
    }

    if (!customerEmail) {
      console.warn('No customer email found for refund notification:', order.id);
      return { success: false, message: 'No customer email found' };
    }

    const orderIdStr = getOrderId(order);

    // Trigger Supabase SMTP for refund notification
    const { error: smtpError } = await supabase.auth.signInWithOtp({
      email: customerEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/#/orders`,
        data: {
          order_id: orderIdStr,
          token_number: order.token_number || order.id.slice(0, 4),
          cancellation_reason: cancellationReason || 'Kitchen out of stock or staff cancellation',
          customer_name: order.customer_name || 'Valued Customer',
          amount_paid: `₹${order.total_amount || 0}`,
          admin_contact: '+91 9244217287',
          admin_email: 'gocanteen8@gmail.com',
          pickup_code: `CANCELLED: ${cancellationReason || 'Refund Application Sent'}`
        }
      }
    });

    if (smtpError) {
      console.warn('Supabase SMTP refund trigger notice:', smtpError.message);
    } else {
      console.log('✅ Supabase SMTP refund email sent successfully to:', customerEmail);
    }

    return { success: true, email: customerEmail };
  } catch (err) {
    console.error('Error sending refund notification:', err);
    return { success: false, error: err.message };
  }
}

