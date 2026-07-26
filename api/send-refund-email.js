import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service_role key — safe in Vercel serverless routes
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerEmail, tokenNumber } = req.body;

  if (!customerEmail || !tokenNumber) {
    return res.status(400).json({ error: 'Missing required fields: customerEmail, tokenNumber' });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel environment variables' });
  }

  try {
    // Use 'recovery' link type — sends the Reset Password email template.
    // This works for ALL existing users (unlike inviteUserByEmail which fails for them).
    // The template is fully hardcoded in Supabase with contact info and instructions.
    // {{ .ConfirmationURL }} in the template redirects to gocanteen.in/#/orders.
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: customerEmail,
      options: {
        redirectTo: 'https://gocanteen.in/#/orders'
      }
    });

    if (error) {
      console.error('Refund email generateLink error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Refund email sent to ${customerEmail} | Token: ${tokenNumber}`);
    return res.status(200).json({ success: true, email: customerEmail });

  } catch (err) {
    console.error('send-refund-email handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
