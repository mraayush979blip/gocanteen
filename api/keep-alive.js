import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow GET requests (or POST if preferred)
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials are not configured.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Make a lightweight query to keep the database active
    const { data, error } = await supabase.from('inventory').select('id').limit(1);

    if (error) {
      throw error;
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Supabase keep-alive ping successful', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
