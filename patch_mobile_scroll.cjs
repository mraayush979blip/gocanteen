const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Combo Deals side scroll
content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-5">',
  '<div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-2 gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">'
);
content = content.replace(
  /className=\{`bg-gradient-to-br \$\{gradient\} border-2 border-b-\[6px\] border-r-4 border-amber-300\/80 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 items-center justify-between hover:(.*?)`\}/g,
  'className={`shrink-0 w-[85vw] md:w-auto snap-start bg-gradient-to-br ${gradient} border-2 border-b-[6px] border-r-4 border-amber-300/80 rounded-[1.25rem] sm:rounded-3xl p-4 sm:p-5 flex flex-row gap-3 sm:gap-4 items-center justify-between hover:$1`}'
);
content = content.replace(
  '<div className="shrink-0 w-full sm:w-36 aspect-square rounded-2xl border border-white/80',
  '<div className="shrink-0 w-24 sm:w-36 aspect-square rounded-[1rem] sm:rounded-2xl border border-white/80'
);

// 2. Bestsellers and Recent Orders side scroll & smaller cards
content = content.replace(
  /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">/g,
  '<div className="flex overflow-x-auto snap-x hide-scrollbar md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">'
);
content = content.replace(
  /className=\{`snap-start shrink-0 w-64 bg-gradient-to-br \$\{gradient\} border-2 border-b-\[6px\] border-r-4 border-slate-300\/80 rounded-3xl p-3 flex flex-col justify-between hover:(.*?)`\}/g,
  'className={`w-[140px] md:w-auto shrink-0 snap-start bg-gradient-to-br ${gradient} border-2 border-b-[6px] border-r-4 border-slate-300/80 rounded-[1.25rem] md:rounded-3xl p-2.5 flex flex-col justify-between hover:$1`}'
);

// 3. To handle main item grid for 'all' categories:
// We want to transform the single grid into grouped sections on mobile if activeCategory === 'all'.
// The bento card is: `className={\`\${bentoClass} bg-gradient-to-br \${gradient} border-2 border-b-[6px] border-r-4 border-slate-300/80 rounded-3xl p-4 flex flex-col justify-between ... \`}`
content = content.replace(
  /className=\{`\$\{bentoClass\} bg-gradient-to-br \$\{gradient\} border-2 border-b-\[6px\] border-r-4 border-slate-300\/80 rounded-3xl p-4 flex flex-col justify-between hover:(.*?)`\}/g,
  'className={`${bentoClass} w-[140px] sm:w-auto shrink-0 snap-start bg-gradient-to-br ${gradient} border-2 border-b-[6px] border-r-4 border-slate-300/80 rounded-[1.25rem] md:rounded-3xl p-2.5 sm:p-4 flex flex-col justify-between hover:$1`}'
);

// Also need to adjust the grid container for main items!
const mainGridStart = `<div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense gap-3 sm:gap-5' : 'grid grid-cols-1 gap-3'}>`;
const mobileSideScrollGrid = `<div className={viewMode === 'grid' ? 'flex overflow-x-auto snap-x hide-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense gap-3 sm:gap-5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0' : 'grid grid-cols-1 gap-3'}>`;
content = content.replace(mainGridStart, mobileSideScrollGrid);

fs.writeFileSync(file, content);
console.log('Mobile layout tweaks applied.');
