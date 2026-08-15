const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/components/Navbar.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('Storage & Images')) {
  // Add the link to the admin sidebar menu items
  const oldMenu = `<NavigationItem icon={<span className="text-lg">👥</span>} iconBg="bg-purple-50" title="Manage Staff" subtitle="Accounts & Access" onClick={() => { navigate('/admin/staff'); setMobileMenuOpen(false); }} />`;
  const newMenu = `<NavigationItem icon={<span className="text-lg">👥</span>} iconBg="bg-purple-50" title="Manage Staff" subtitle="Accounts & Access" onClick={() => { navigate('/admin/staff'); setMobileMenuOpen(false); }} />
                          <NavigationItem icon={<span className="text-lg">☁️</span>} iconBg="bg-purple-50" title="Storage & Images" subtitle="Clean unused photos" onClick={() => { navigate('/admin/storage'); setMobileMenuOpen(false); }} />`;
                          
  content = content.replace(oldMenu, newMenu);
  fs.writeFileSync(file, content);
  console.log('Navbar patched with Storage link');
} else {
  console.log('Navbar already patched');
}
