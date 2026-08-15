const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/admin/AdminInventory.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Image to lucide-react imports
content = content.replace(
  "import { Plus, Edit3, Trash2, Search, X, Loader2, Save, Star, Copy } from 'lucide-react';",
  "import { Plus, Edit3, Trash2, Search, X, Loader2, Save, Star, Copy, Image as ImageIcon, Upload } from 'lucide-react';"
);

// 2. Add uploadingImage state
content = content.replace(
  "const [saving, setSaving] = useState(false);",
  "const [saving, setSaving] = useState(false);\n  const [uploadingImage, setUploadingImage] = useState(false);"
);

// 3. Add image_url to formData
content = content.replace(
  "availableOutlets: []\n  });",
  "availableOutlets: [],\n    image_url: ''\n  });"
);

// 4. Add compressImage and handleImageUpload functions
const uploadLogic = `
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/webp', 0.8);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressedBlob = await compressImage(file);
      const fileName = \`item_\${Date.now()}.webp\`;
      
      const { data, error } = await supabase.storage
        .from('menu_images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          upsert: false
        });
        
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('menu_images')
        .getPublicUrl(fileName);
        
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      showToast('Image compressed & uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      showToast('Failed to upload image. Make sure menu_images bucket exists and is public.', true);
    } finally {
      setUploadingImage(false);
    }
  };
`;

content = content.replace(
  "const handleOpenCreate = () => {",
  uploadLogic + "\n  const handleOpenCreate = () => {"
);

// 5. Reset image_url in handleOpenCreate
content = content.replace(
  "availableOutlets: outlets.map(o => o.id)\n    });",
  "availableOutlets: outlets.map(o => o.id),\n      image_url: ''\n    });"
);

// 6. Set image_url in handleOpenEdit
content = content.replace(
  "availableOutlets: availOutlets\n    });",
  "availableOutlets: availOutlets,\n      image_url: item.image_url || ''\n    });"
);

// 7. Reset/Set image_url in handleDuplicate
content = content.replace(
  "availableOutlets: outlets.map(o => o.id)\n    });\n    setModalOpen(true);\n  };",
  "availableOutlets: outlets.map(o => o.id),\n      image_url: item.image_url || ''\n    });\n    setModalOpen(true);\n  };"
);

// 8. Add image_url to payload in handleSubmit
content = content.replace(
  "is_available: formData.is_available\n    };",
  "is_available: formData.is_available,\n      image_url: formData.image_url\n    };"
);

// 9. Add image upload UI
const uiChunk = `
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <EmojiPickerMenu
                    value={formData.emoji}
                    onChange={(emoji) => setFormData({ ...formData, emoji })}
                    label="Emoji (Fallback)"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Image (WebP Compressed)</label>
                  <div className="flex items-center gap-2">
                    {formData.image_url && (
                      <img src={formData.image_url} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                    )}
                    <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors text-xs font-bold">
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadingImage ? 'Compressing...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cheese Burst Pizza"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
                />
              </div>
`;

content = content.replace(
  /<div className="grid grid-cols-5 gap-2">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  uiChunk
);

fs.writeFileSync(file, content);
console.log('AdminInventory.jsx patched successfully!');
