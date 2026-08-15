const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('AdminStorage')) {
  content = content.replace(
    "import AdminOutlets from './pages/admin/AdminOutlets';",
    "import AdminOutlets from './pages/admin/AdminOutlets';\nimport AdminStorage from './pages/admin/AdminStorage';"
  );
  
  content = content.replace(
    '<Route path="/admin/outlets" element={<AdminLayout activeSubView="outlets" onOpenAuth={() => handleOpenAuth(\'admin\')} />} />',
    '<Route path="/admin/outlets" element={<AdminLayout activeSubView="outlets" onOpenAuth={() => handleOpenAuth(\'admin\')} />} />\n          <Route path="/admin/storage" element={<AdminLayout activeSubView="storage" onOpenAuth={() => handleOpenAuth(\'admin\')} />} />'
  );
  
  // Update AdminLayout component inside App.jsx
  content = content.replace(
    "case 'outlets':\n      ViewComponent = <AdminOutlets />;\n      break;",
    "case 'outlets':\n      ViewComponent = <AdminOutlets />;\n      break;\n    case 'storage':\n      ViewComponent = <AdminStorage />;\n      break;"
  );
  
  fs.writeFileSync(file, content);
  console.log('App.jsx patched for AdminStorage');
} else {
  console.log('App.jsx already patched');
}
