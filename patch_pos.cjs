const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/staff/StaffPOS.jsx';
let content = fs.readFileSync(file, 'utf8');

// Item Grid
content = content.replace(
  /<div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-3xl shrink-0 mb-2 group-hover:scale-110 transition-transform shadow-inner border border-slate-200\/60">\s*\{item\.emoji \|\| '🍽️'\}\s*<\/div>/g,
  `<div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-3xl shrink-0 mb-2 group-hover:scale-110 transition-transform shadow-inner border border-slate-200/60 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <>{item.emoji || '🍽️'}</>
                      )}
                    </div>`
);

// Cart Item
content = content.replace(
  /<div className="font-bold text-slate-900 text-sm truncate">\{item\.emoji\} \{item\.name\}<\/div>/g,
  `<div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                    ) : (
                      <span>{item.emoji}</span>
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>`
);

fs.writeFileSync(file, content);
console.log('POS patched!');
