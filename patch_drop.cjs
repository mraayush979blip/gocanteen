const fs = require('fs');
const files = [
  '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/admin/AdminInventory.jsx',
  '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/admin/AdminOffers.jsx'
];

const oldDrop = `  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };`;

const newDrop = `  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    // 1. Try local files first
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      return processImageFile(file);
    }
    
    // 2. Try dragging from another browser tab (HTML/URL)
    const html = e.dataTransfer.getData('text/html');
    if (html) {
      // Extract src from <img src="...">
      const match = html.match(/src="?([^"\\s]+)"?\\s*/);
      if (match && match[1]) {
        let src = match[1];
        src = src.replace(/&amp;/g, '&'); // decode HTML entities
        
        if (src.startsWith('data:image')) {
          // It's a base64 image (common for google image thumbnails)
          setCropState(prev => ({ ...prev, isOpen: true, image: src, crop: {x:0, y:0}, zoom: 1 }));
          return;
        } else if (src.startsWith('http')) {
          // It's a regular URL. We must proxy it to avoid CORS tainted canvas errors
          try {
            setUploadingImage(true);
            const proxiedUrl = \`https://api.allorigins.win/raw?url=\${encodeURIComponent(src)}\`;
            const response = await fetch(proxiedUrl);
            const blob = await response.blob();
            processImageFile(blob); // now we have a local blob!
          } catch (err) {
            // Error handling is tricky without showToast in scope if not defined, but we have showToast!
            if (typeof showToast === 'function') {
               showToast("Couldn't import image from website due to security restrictions.", true);
            }
          } finally {
            setUploadingImage(false);
          }
          return;
        }
      }
    }
  };`;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(oldDrop)) {
    content = content.replace(oldDrop, newDrop);
    fs.writeFileSync(file, content);
    console.log('Patched handleDrop in', file);
  } else {
    console.log('oldDrop not found in', file, '(might be already patched)');
  }
});
