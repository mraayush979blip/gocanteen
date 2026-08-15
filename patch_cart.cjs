const fs = require('fs');
const menuFile = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let menuContent = fs.readFileSync(menuFile, 'utf8');

menuContent = menuContent.replace(
  /emoji: item\.emoji \|\| '🍽️',/g,
  "emoji: item.emoji || '🍽️',\n      image_url: item.image_url,"
);

menuContent = menuContent.replace(
  /emoji: offer\.emoji \|\| '🔥',/g,
  "emoji: offer.emoji || '🔥',\n      image_url: offer.image_url,"
);

fs.writeFileSync(menuFile, menuContent);

const cartFile = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerCart.jsx';
let cartContent = fs.readFileSync(cartFile, 'utf8');

cartContent = cartContent.replace(
  /<span className="text-2xl">\{item\.emoji \|\| '🍽️'\}<\/span>/g,
  `{item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover rounded-md" loading="lazy" />
                        ) : (
                          <span className="text-2xl">{item.emoji || '🍽️'}</span>
                        )}`
);

fs.writeFileSync(cartFile, cartContent);
console.log('Cart patched!');
