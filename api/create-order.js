import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // Enforce POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency, receipt } = req.body;

  // Validate amount (must be >= 100 paise / ₹1)
  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Minimum amount must be 100 paise (₹1)' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay API credentials are not configured on the server' });
  }

  // Initialize Razorpay SDK
  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
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
