import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: o, error: e1 } = await supabase.from('orders').select('id, token_number').order('created_at', {ascending: false}).limit(5);
  console.log("Recent Orders:", o);
  const { data: i, error: e2 } = await supabase.from('order_items').select('*');
  console.log("Total Order Items in DB:", i?.length, "Error:", e2);
}
test();
