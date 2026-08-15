const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// Change the flex strip to a grid
content = content.replace(
  /<div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">/g,
  '<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">'
);

// Replace random widths
const oldCardWrapper = `                        const hash = String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const gradient = cardGradients[hash % cardGradients.length];
                        const widthClasses = ['w-56', 'w-64', 'w-72'];
                        const cardWidth = widthClasses[hash % widthClasses.length];
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={\`shrink-0 \${cardWidth} snap-start bg-gradient-to-br \${gradient} border-2 border-b-[6px] border-r-4 border-slate-300/80 rounded-3xl p-3 sm:p-4 flex flex-col justify-between hover:shadow-[10px_20px_40px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,1)] hover:-translate-y-1.5 hover:border-b-4 hover:border-r-2 transition-all duration-300 shadow-[8px_12px_24px_rgba(0,0,0,0.25),-4px_-4px_12px_rgba(255,255,255,0.9),inset_0_2px_4px_rgba(255,255,255,1)] group relative cursor-pointer\`}
                          >`;

const newCardWrapper = `                        const hash = String(item.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const gradient = cardGradients[hash % cardGradients.length];
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className={\`w-full bg-gradient-to-br \${gradient} border-2 border-b-[6px] border-r-4 border-slate-300/80 rounded-[1.25rem] sm:rounded-3xl p-2.5 sm:p-4 flex flex-col justify-between hover:shadow-[10px_20px_40px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,1)] hover:-translate-y-1.5 hover:border-b-4 hover:border-r-2 transition-all duration-300 shadow-[8px_12px_24px_rgba(0,0,0,0.25),-4px_-4px_12px_rgba(255,255,255,0.9),inset_0_2px_4px_rgba(255,255,255,1)] group relative cursor-pointer\`}
                          >`;

content = content.replace(oldCardWrapper, newCardWrapper);

// Change image container to aspect-square
content = content.replace(
  /<div className="h-28 rounded-xl border border-white flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-slate-100">/g,
  '<div className="w-full aspect-square rounded-xl border border-white flex items-center justify-center relative overflow-hidden group-hover:shadow-inner bg-slate-100">'
);

fs.writeFileSync(file, content);
console.log('CustomerMenu grid patched!');
