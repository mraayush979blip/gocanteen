import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  if (line && line.includes('=')) {
    const [k, v] = line.split('=');
    acc[k.trim()] = v.trim();
  }
  return acc;
}, {});

async function test() {
  const ordersRes = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc&limit=5`, {
    headers: { 'apikey': env.VITE_SUPABASE_ANON_KEY, 'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}` }
  });
  const orders = await ordersRes.json();
  console.log(orders);
}
test();
