import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  if (line && line.includes('=')) {
    const [k, v] = line.split('=');
    acc[k.trim()] = v.trim();
  }
  return acc;
}, {});

async function test() {
  try {
    const ordersRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=5`, {
      headers: { 'apikey': env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}` }
    });
    const orders = await ordersRes.json();
    console.log("Recent 5 Orders:");
    orders.forEach(o => console.log(`Order ${o.token_number} (${o.id}) - status: ${o.status}`));
    
    // Check items for the newest order
    if (orders.length > 0) {
      const itemsRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/order_items?select=*&order_id=eq.${orders[0].id}`, {
        headers: { 'apikey': env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}` }
      });
      const items = await itemsRes.json();
      console.log(`\nItems for Order ${orders[0].token_number}:`, items.length);
      console.log(items);
    }
  } catch (e) { console.log(e); }
}
test();
