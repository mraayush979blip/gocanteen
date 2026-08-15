const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the main grid block
const gridRegex = /<div className=\{viewMode === 'grid' \? 'flex overflow-x-auto snap-x hide-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-4 grid-flow-dense gap-3 sm:gap-5 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0' : 'grid grid-cols-1 gap-3'\}>([\s\S]*?)<\/div>\s*\{\/\* Framer-Motion Enhanced Flying Cart Emoji/;

if (content.match(gridRegex)) {
  console.log("Matched grid block!");
} else {
  console.log("Failed to match grid block!");
}
