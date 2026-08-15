const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Order Again Strip (Line ~734)
content = content.replace(
  /<div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">\{item\.emoji \|\| '🍽️'\}<\/div>/g,
  `{item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-xl object-cover shrink-0" loading="lazy" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">{item.emoji || '🍽️'}</div>
                            )}`
);

// 2. Popular Today Strip (Line ~788)
// We need to match the parent container: <div className="h-28 rounded-xl border border-white/80 flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-cover bg-center" style={{ backgroundImage: `url('https://api.dicebear.com/8.x/shapes/svg?seed=${item.id}')` }}>
content = content.replace(
  /<div className="h-28 rounded-xl border border-white\/80 flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-cover bg-center" style=\{\{ backgroundImage: `url\('https:\/\/api\.dicebear\.com\/8\.x\/shapes\/svg\?seed=\$\{item\.id\}'\)` \}\}>/g,
  `<div className="h-28 rounded-xl border border-white/80 flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-slate-100">`
);

content = content.replace(
  /<span className="relative z-10 text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">\{item\.emoji \|\| '🍽️'\}<\/span>/g,
  `{item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                  ) : (
                                    <span className="relative z-10 text-5xl group-hover:scale-110 transition-transform duration-300 drop-shadow-md">{item.emoji || '🍽️'}</span>
                                  )}`
);

// 3. Grid Mode Items (Line ~883)
content = content.replace(
  /<div className="w-full h-32 bg-cover bg-center absolute inset-0 opacity-40 group-hover:opacity-30 transition-opacity" style=\{\{ backgroundImage: `url\('https:\/\/api\.dicebear\.com\/8\.x\/shapes\/svg\?seed=\$\{item\.id\}'\)` \}\}>/g,
  `<div className="w-full h-32 absolute inset-0 opacity-40 group-hover:opacity-30 transition-opacity bg-slate-100">`
);

content = content.replace(
  /<span className="relative z-10 text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-xl">\{item\.emoji \|\| '🍽️'\}<\/span>/g,
  `{item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-[1.25rem] group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                ) : (
                                  <span className="relative z-10 text-6xl group-hover:scale-110 transition-transform duration-300 drop-shadow-xl">{item.emoji || '🍽️'}</span>
                                )}`
);

// 4. List Mode Items (Line ~957)
content = content.replace(
  /<div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl flex flex-col items-center justify-center relative border border-slate-100 overflow-hidden shadow-inner bg-cover bg-center" style=\{\{ backgroundImage: `url\('https:\/\/api\.dicebear\.com\/8\.x\/shapes\/svg\?seed=\$\{item\.id\}'\)` \}\}>/g,
  `<div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl flex flex-col items-center justify-center relative border border-slate-100 overflow-hidden shadow-inner bg-slate-50">`
);

content = content.replace(
  /<span className="relative z-10 drop-shadow-md">\{item\.emoji \|\| '🍽️'\}<\/span>/g,
  `{item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <span className="relative z-10 drop-shadow-md text-4xl">{item.emoji || '🍽️'}</span>
                              )}`
);

// 5. Item Detail Modal (Line ~1007)
content = content.replace(
  /<div className="w-full h-48 sm:h-64 bg-cover bg-center rounded-2xl sm:rounded-3xl border border-white\/50 shadow-inner flex flex-col items-center justify-center relative overflow-hidden" style=\{\{ backgroundImage: `url\('https:\/\/api\.dicebear\.com\/8\.x\/shapes\/svg\?seed=\$\{item\.id\}'\)` \}\}>/g,
  `<div className="w-full h-48 sm:h-64 rounded-2xl sm:rounded-3xl border border-white/50 shadow-inner flex flex-col items-center justify-center relative overflow-hidden bg-slate-100">`
);

content = content.replace(
  /<motion\.span animate=\{\{ y: \[0, -4, 0\] \}\} transition=\{\{ duration: 3, repeat: Infinity, ease: "easeInOut" \}\} className="relative z-10 text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">\{item\.emoji \|\| '🍽️'\}<\/motion\.span>/g,
  `{item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">{item.emoji || '🍽️'}</motion.span>
                              )}`
);

fs.writeFileSync(file, content);
console.log('CustomerMenu.jsx patched successfully!');
