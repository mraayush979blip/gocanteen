const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/admin/AdminInventory.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import Cropper
content = content.replace(
  "import { useAdmin } from '../../context/AdminContext';",
  "import { useAdmin } from '../../context/AdminContext';\nimport Cropper from 'react-easy-crop';"
);

// 2. Add Crop State
content = content.replace(
  "const [uploadingImage, setUploadingImage] = useState(false);",
  "const [uploadingImage, setUploadingImage] = useState(false);\n  const [cropState, setCropState] = useState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });"
);

// 3. Replace handleImageUpload and compressImage with cropper logic
const newUploadLogic = `  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropState(prev => ({ ...prev, isOpen: true, image: reader.result, crop: {x:0, y:0}, zoom: 1 }));
    };
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCropState(prev => ({ ...prev, croppedAreaPixels }));
  };

  const handleConfirmCrop = async () => {
    if (!cropState.image || !cropState.croppedAreaPixels) return;
    setUploadingImage(true);
    setCropState(prev => ({ ...prev, isOpen: false }));

    try {
      const img = new Image();
      img.src = cropState.image;
      await new Promise(resolve => (img.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 600;
      canvas.width = MAX_SIZE;
      canvas.height = MAX_SIZE;

      ctx.drawImage(
        img,
        cropState.croppedAreaPixels.x,
        cropState.croppedAreaPixels.y,
        cropState.croppedAreaPixels.width,
        cropState.croppedAreaPixels.height,
        0,
        0,
        MAX_SIZE,
        MAX_SIZE
      );

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.8));
      const fileName = \`item_\${Date.now()}.webp\`;
      
      const { data, error } = await supabase.storage
        .from('menu_images')
        .upload(fileName, blob, { contentType: 'image/webp', upsert: false });
        
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('menu_images').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      showToast('Image cropped & uploaded successfully!');
    } catch (err) {
      console.error('Image crop error:', err);
      showToast('Failed to process image.', true);
    } finally {
      setUploadingImage(false);
      setCropState(prev => ({ ...prev, image: null }));
    }
  };`;

// We need to replace the old compressImage and handleImageUpload
const oldLogicRegex = /const compressImage = \([\s\S]*?const handleImageUpload = async \([\s\S]*?setUploadingImage\(false\);\s*\n\s*\};\n/m;
content = content.replace(oldLogicRegex, newUploadLogic + "\n");

// 4. Update the input onChange to handleImageSelect
content = content.replace(
  'onChange={handleImageUpload}',
  'onChange={handleImageSelect}'
);

// 5. Add the Crop Modal to the UI
const cropModalJSX = `
      {/* Crop Modal */}
      {cropState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-extrabold text-slate-900">Crop Image (1:1 Square)</h2>
              <button onClick={() => setCropState(prev => ({ ...prev, isOpen: false }))} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full h-[400px] bg-slate-100 rounded-xl overflow-hidden">
              <Cropper
                image={cropState.image}
                crop={cropState.crop}
                zoom={cropState.zoom}
                aspect={1}
                onCropChange={(crop) => setCropState(prev => ({ ...prev, crop }))}
                onCropComplete={onCropComplete}
                onZoomChange={(zoom) => setCropState(prev => ({ ...prev, zoom }))}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">Zoom</span>
              <input
                type="range"
                value={cropState.zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setCropState(prev => ({ ...prev, zoom: Number(e.target.value) }))}
                className="w-full accent-purple-600"
              />
            </div>
            
            <button
              onClick={handleConfirmCrop}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-sm"
            >
              Confirm Crop & Upload
            </button>
          </div>
        </div>
      )}
`;

content = content.replace(
  "{/* Add / Edit Modal */}",
  cropModalJSX + "\n      {/* Add / Edit Modal */}"
);

fs.writeFileSync(file, content);
console.log('AdminInventory cropper patched!');
