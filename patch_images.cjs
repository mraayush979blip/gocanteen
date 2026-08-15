const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/customer/CustomerMenu.jsx';
let content = fs.readFileSync(file, 'utf8');

// Use a regex to find all <img src={...} ... />
// We need to inject the opacity-0 and onLoad into the className and props.

content = content.replace(/<img\s+src=\{([^}]+)\}\s+alt=\{([^}]+)\}\s+className="([^"]+)"(?:\s+loading="lazy")?\s*\/>/g, (match, src, alt, className) => {
    // If it already has opacity-0, skip
    if (className.includes('opacity-0')) return match;
    
    // Add opacity-0 and transition-opacity if not present
    let newClass = className + ' opacity-0 transition-opacity duration-500';
    
    return `<img src={${src}} alt={${alt}} className="${newClass}" onLoad={(e) => e.target.classList.remove('opacity-0')} loading="lazy" decoding="async" />`;
});

fs.writeFileSync(file, content);
console.log('Images patched with fade-in animation!');
