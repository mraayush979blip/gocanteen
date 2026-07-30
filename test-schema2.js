import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  if (line && line.includes('=')) {
    const [k, v] = line.split('=');
    acc[k.trim()] = v.trim();
  }
  return acc;
}, {});

fetch(`${env.VITE_SUPABASE_URL}/rest/v1/order_items?select=*&order=id.desc&limit=5`, {
  headers: {
    'apikey': env.VITE_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
  }
}).then(res => res.json()).then(data => console.log('Response:', data)).catch(e => console.log(e));
