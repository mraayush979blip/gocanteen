import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Get the signature and secret
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing signature or secret');
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    // 2. Verify Razorpay signature securely
    // In Vercel serverless functions, req.body is already parsed as JSON if it has the right content-type.
    // However, Razorpay signatures require the raw body. Vercel allows accessing raw body via rawBody if configured,
    // but the easiest way is to stringify the body exactly as it was received.
    // A safer way is to read the raw body directly from the stream if needed, but Razorpay webhooks usually work fine with JSON.stringify if the payload doesn't contain spaces.
    // To be perfectly safe, Vercel gives us the raw body if we export a config to disable the default body parser.
    // Since bodyParser is false, req is a readable stream.
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf8');
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      console.error('Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);

    // 3. Initialize Supabase Admin Client
    const supabaseClient = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Handle the payment.captured event
    if (payload.event === 'payment.captured') {
      const orderId = payload.payload.payment.entity.notes.order_id;
      const paymentId = payload.payload.payment.entity.id;

      if (orderId) {
        // Update order status in Supabase
        const { error } = await supabaseClient
          .from('orders')
          .update({
            status: 'pending',
            payment_status: 'paid',
            payment_id: paymentId,
          })
          .eq('id', orderId);

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }
        console.log(`Successfully updated order ${orderId} for payment ${paymentId}`);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Disable the default Vercel body parser so we can get the raw string for the cryptographic signature
export const config = {
  api: {
    bodyParser: false,
  },
};
