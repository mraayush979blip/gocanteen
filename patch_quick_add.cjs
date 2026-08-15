const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/admin/AdminInventory.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add quickEditItemId state
if (!content.includes('quickEditItemId')) {
  content = content.replace(
    'const [isDragging, setIsDragging] = useState(false);',
    'const [isDragging, setIsDragging] = useState(false);\n  const [quickEditItemId, setQuickEditItemId] = useState(null);'
  );
}

// 2. Modify uploadCroppedImage to handle quickEditItemId
const oldUploadBlock = `      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      setCropState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
      showToast('Image uploaded successfully');`;

const newUploadBlock = `      if (quickEditItemId) {
        const { error: updateErr } = await supabase.from('inventory').update({ image_url: publicUrlData.publicUrl }).eq('id', quickEditItemId);
        if (updateErr) throw updateErr;
        showToast('Quick image added successfully!');
        setQuickEditItemId(null);
        fetchInventory(); // refresh list
      } else {
        setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
        showToast('Image uploaded successfully');
      }
      setCropState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });`;

if (content.includes(oldUploadBlock)) {
  content = content.replace(oldUploadBlock, newUploadBlock);
}

// 3. Add handleQuickAddImage and handleQuickDrop
const quickAddLogic = `
  const handleQuickAddImage = (item) => {
    setQuickEditItemId(item.id);
    document.getElementById('quick-image-upload').click();
  };

  const handleQuickDrop = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickEditItemId(item.id);
    await handleDrop(e);
  };
`;
if (!content.includes('handleQuickAddImage')) {
  content = content.replace(
    'const onCropComplete =',
    quickAddLogic + '\n  const onCropComplete ='
  );
}

// 4. Update Modal Close button to reset quickEditItemId
content = content.replace(
  `onClick={() => setCropState(prev => ({ ...prev, isOpen: false }))}`,
  `onClick={() => { setCropState(prev => ({ ...prev, isOpen: false })); setQuickEditItemId(null); }}`
);

// 5. Desktop table view Quick Add button
const oldDesktopNone = `<span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-extrabold uppercase flex items-center gap-1 w-max">
                        None
                      </span>`;
const newDesktopNone = `<button 
                        onClick={() => handleQuickAddImage(item)}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => handleQuickDrop(e, item)}
                        className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-[10px] font-extrabold uppercase flex items-center gap-1 w-max transition-colors cursor-pointer"
                        title="Click to select or drag and drop an image here"
                      >
                        <Upload className="w-3 h-3" /> Quick Add
                      </button>`;
if (content.includes(oldDesktopNone)) {
  content = content.replace(oldDesktopNone, newDesktopNone);
}

// 6. Mobile view Quick Add button
const oldMobileNone = `<span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    No Image
                  </span>`;
const newMobileNone = `<button 
                    onClick={() => handleQuickAddImage(item)}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => handleQuickDrop(e, item)}
                    className="text-[10px] font-extrabold text-slate-500 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 px-2 py-0.5 rounded border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" /> Quick Add
                  </button>`;
if (content.includes(oldMobileNone)) {
  content = content.replace(oldMobileNone, newMobileNone);
}

// 7. Add hidden file input at the bottom of the return statement
if (!content.includes('id="quick-image-upload"')) {
  content = content.replace(
    '    </div>\n  );\n}\n',
    '      <input type="file" id="quick-image-upload" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploadingImage} />\n    </div>\n  );\n}\n'
  );
}

fs.writeFileSync(file, content);
console.log('AdminInventory quick add logic injected successfully.');
