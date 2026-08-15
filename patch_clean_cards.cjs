const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Simplify Bestsellers and Recent Orders cards
content = content.replace(
  /className=\{`w-\[140px\] md:w-auto shrink-0 snap-start bg-gradient-to-br \$\{gradient\} border-2 border-b-\[6px\] border-r-4 border-slate-300\/80 rounded-\[1\.25rem\] md:rounded-3xl p-2\.5 flex flex-col justify-between hover:(.*?)`\}/g,
  'className={`w-[140px] md:w-auto shrink-0 snap-start bg-white border border-slate-200/90 rounded-[1.25rem] md:rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer`}'
);

// Simplify Bestseller/Recent image wrapper
content = content.replace(
  /<div className="w-full aspect-square shrink-0 rounded-xl border border-white flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-cover bg-center mb-2" style={{ backgroundImage: `url\('https:\/\/api\.dicebear\.com\/8\.x\/shapes\/svg\?seed=\$\{item\.id\}'\)` }}>/g,
  '<div className="w-full aspect-square shrink-0 rounded-xl bg-slate-100 flex items-center justify-center relative overflow-hidden mb-2">'
);


// 2. Simplify main Grid Bento Cards
content = content.replace(
  /className=\{`\$\{bentoClass\} w-\[140px\] sm:w-auto shrink-0 snap-start bg-gradient-to-br \$\{gradient\} border-2 border-b-\[6px\] border-r-4 border-slate-300\/80 rounded-\[1\.25rem\] md:rounded-3xl p-2\.5 sm:p-4 flex flex-col justify-between hover:(.*?)`\}/g,
  'className={`${bentoClass} ${isHorizontal ? "w-[140px] sm:w-auto shrink-0 snap-start" : ""} bg-white border border-slate-200/90 rounded-[1.25rem] md:rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer`}'
);
// Simplify main Grid Image Wrapper
content = content.replace(
  /<div className="w-full aspect-square shrink-0 rounded-2xl border border-white flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-cover bg-center mb-3" style={{ backgroundImage: `url\('https:\/\/api\.dicebear\.com\/8\.x\/shapes\/svg\?seed=\$\{item\.id\}'\)` }}>/g,
  '<div className="w-full aspect-square shrink-0 rounded-xl bg-slate-100 flex items-center justify-center relative overflow-hidden mb-3">'
);

// We don't need bentoClass or gradient logic anymore, but we can leave them defined so it doesn't break syntax.

// 3. Fix the Main Grid Layout!
// We need to change the main map function. It currently maps `filteredInventory.slice(0, visibleCount)`.
// We will replace the entire main mapping block.
// Let's identify the start and end of the block.
// Start: `<div className={viewMode === 'grid' ? 'flex overflow-x-auto ...`
// End: `</motion.div>\n                        );\n                      }\n                    })}\n                  </div>`
const mainGridRegex = /<div className=\{viewMode === 'grid' \? 'flex overflow-x-auto[^>]+>([\s\S]*?)<\/div>\s*<\/div>\s*\)\s*\}/;

const gridRenderingBlock = `
                {activeCategory === 'all' && viewMode === 'grid' ? (
                  <div>
                    {categories.map(cat => {
                      const catItems = filteredInventory.filter(item => item.category_id === cat.id);
                      if (catItems.length === 0) return null;
                      return (
                        <div key={cat.id} className="mb-6">
                          <h3 className="text-sm font-black text-slate-900 mb-3 px-1">{cat.name}</h3>
                          <div className="flex overflow-x-auto snap-x hide-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                            {catItems.map((item, idx) => {
                              const qty = getItemCartQty(item.id);
                              let bentoClass = 'col-span-1 row-span-1';
                              const isHorizontal = true;
                              return (
                                <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedItem(item)} className={\`\${bentoClass} \${isHorizontal ? "w-[140px] sm:w-auto shrink-0 snap-start" : ""} bg-white border border-slate-200/90 rounded-[1.25rem] md:rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer\`}>
                                  <div className="flex-1 flex flex-col z-10">
                                    <div className="w-full aspect-square shrink-0 rounded-xl bg-slate-100 flex items-center justify-center relative overflow-hidden mb-3">
                                      {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">{item.emoji || '🍽️'}</motion.span>
                                      )}
                                      <div className={\`absolute top-2 left-2 w-4 h-4 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-sm \${item.is_veg ? 'border-emerald-600' : 'border-red-600'}\`}><div className={\`w-full h-full rounded-full \${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}\`} /></div>
                                      {item.tag && <span className="absolute top-2 right-2 text-[9px] uppercase font-black text-slate-950 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200/80 shadow-sm">{item.tag}</span>}
                                    </div>
                                    <div className="flex flex-col gap-0.5 flex-1">
                                      {item.categories?.name && <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest">{item.categories.name}</span>}
                                      <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">{item.name}</h3>
                                      {item.description && <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-3 z-10 relative">
                                    <span className="text-base sm:text-lg font-black text-slate-900">₹{item.price}</span>
                                    <motion.div layout onClick={(e) => e.stopPropagation()}>
                                      {qty > 0 ? (
                                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 font-bold shadow-md">
                                          <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /></button>
                                          <span className="text-[10px] sm:text-xs font-black px-0.5 sm:px-1">{qty}</span>
                                          <button onClick={() => updateCartQty(item.id, 1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /></button>
                                        </motion.div>
                                      ) : (
                                        <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-[10px] sm:text-xs transition-colors cursor-pointer active:scale-95 shadow-sm">+ ADD</motion.button>
                                      )}
                                    </motion.div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 pb-4' : 'grid grid-cols-1 gap-3'}>
                    {filteredInventory.slice(0, visibleCount).map((item, idx) => {
                      const qty = getItemCartQty(item.id);
                      if (viewMode === 'list') {
                        return (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} onClick={() => setSelectedItem(item)} className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 hover:shadow-md transition-all shadow-2xs cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl border border-white/40 flex items-center justify-center text-3xl shrink-0 shadow-inner bg-slate-100 relative overflow-hidden">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                  <span className="relative z-10 drop-shadow-md text-4xl">{item.emoji || '🍽️'}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className={\`w-3.5 h-3.5 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-2xs \${item.is_veg ? 'border-emerald-600' : 'border-red-600'}\`}><div className={\`w-full h-full rounded-full \${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}\`} /></div>
                                  <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                                  {item.tag && <span className="text-[9px] uppercase font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{item.tag}</span>}
                                </div>
                                {item.description && <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>}
                                <span className="text-sm font-black text-slate-900 mt-1 block">₹{item.price}</span>
                              </div>
                            </div>
                            <motion.div layout className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              {qty > 0 ? (
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-3 py-1.5 font-bold shadow-md">
                                  <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
                                  <span className="text-xs font-black px-1">{qty}</span>
                                  <button onClick={() => updateCartQty(item.id, 1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
                                </motion.div>
                              ) : (
                                <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-5 py-2 rounded-xl border-2 border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-xs transition-all shadow-2xs shrink-0 cursor-pointer active:scale-95">+ ADD</motion.button>
                              )}
                            </motion.div>
                          </motion.div>
                        );
                      } else {
                        let bentoClass = 'col-span-1 row-span-1';
                        const isHorizontal = false;
                        return (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedItem(item)} className={\`\${bentoClass} \${isHorizontal ? "w-[140px] sm:w-auto shrink-0 snap-start" : ""} bg-white border border-slate-200/90 rounded-[1.25rem] md:rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer\`}>
                            <div className="flex-1 flex flex-col z-10">
                              <div className="w-full aspect-square shrink-0 rounded-xl bg-slate-100 flex items-center justify-center relative overflow-hidden mb-3">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative z-10 text-6xl sm:text-7xl group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">{item.emoji || '🍽️'}</motion.span>
                                )}
                                <div className={\`absolute top-2 left-2 w-4 h-4 rounded-xs border bg-white flex items-center justify-center p-0.5 shadow-sm \${item.is_veg ? 'border-emerald-600' : 'border-red-600'}\`}><div className={\`w-full h-full rounded-full \${item.is_veg ? 'bg-emerald-600' : 'bg-red-600'}\`} /></div>
                                {item.tag && <span className="absolute top-2 right-2 text-[9px] uppercase font-black text-slate-950 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200/80 shadow-sm">{item.tag}</span>}
                              </div>
                              <div className="flex flex-col gap-0.5 flex-1">
                                {item.categories?.name && <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest">{item.categories.name}</span>}
                                <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">{item.name}</h3>
                                {item.description && <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">{item.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 z-10 relative">
                              <span className="text-base sm:text-lg font-black text-slate-900">₹{item.price}</span>
                              <motion.div layout onClick={(e) => e.stopPropagation()}>
                                {qty > 0 ? (
                                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2 bg-emerald-600 text-white rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 font-bold shadow-md">
                                    <button onClick={() => updateCartQty(item.id, -1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Minus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /></button>
                                    <span className="text-[10px] sm:text-xs font-black px-0.5 sm:px-1">{qty}</span>
                                    <button onClick={() => updateCartQty(item.id, 1)} className="hover:opacity-85 p-0.5 cursor-pointer"><Plus className="w-3 sm:w-3.5 h-3 sm:h-3.5" /></button>
                                  </motion.div>
                                ) : (
                                  <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => handleAddToCartWithAnim(e, item)} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-emerald-600 text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white font-black text-[10px] sm:text-xs transition-colors cursor-pointer active:scale-95 shadow-sm">+ ADD</motion.button>
                                )}
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      }
                    })}
                  </div>
                )}
`;

// Find the bounds of the original main rendering block
const split1 = content.split(/<div className=\{viewMode === 'grid' \? 'flex overflow-x-auto[^>]+>/);
if (split1.length > 1) {
  const preText = split1[0];
  const postMatch = split1[1].split(/<\/motion\.div>\s*\);\s*\}\s*\}\)}\s*<\/div>/);
  if (postMatch.length > 1) {
    const postText = postMatch.slice(1).join('</motion.div>\n                        );\n                      }\n                    })}\n                  </div>');
    
    // Inject our new block
    const finalContent = preText + gridRenderingBlock + postText;
    fs.writeFileSync(file, finalContent);
    console.log('Main grid rewritten perfectly!');
  } else {
    console.log('Could not find end of main grid.');
  }
} else {
  console.log('Could not find start of main grid.');
}
