const fs = require('fs');
const file = '/home/aayush/imp/imp/canteen1/cafe and grace/canteen-app/src/pages/admin/AdminOffers.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!content.includes("import Cropper from 'react-easy-crop';")) {
  content = content.replace(
    "import EmojiPickerMenu from '../../components/EmojiPickerMenu';",
    "import EmojiPickerMenu from '../../components/EmojiPickerMenu';\nimport Cropper from 'react-easy-crop';\nimport { Upload } from 'lucide-react';"
  );
}

// 2. States
if (!content.includes("uploadingImage")) {
  content = content.replace(
    "const [saving, setSaving] = useState(false);",
    `const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropState, setCropState] = useState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
  const [isDragging, setIsDragging] = useState(false);`
  );
}

// 3. formData
if (!content.includes("image_url: ''")) {
  content = content.replace(
    "is_active: true",
    "is_active: true,\n    image_url: ''"
  );
}

if (!content.includes("image_url: offer.image_url || ''")) {
  content = content.replace(
    "is_active: offer.is_active !== false",
    "is_active: offer.is_active !== false,\n      image_url: offer.image_url || ''"
  );
}

// 4. Reset formData
if (!content.includes("image_url: '',")) {
  content = content.replace(
    "items_included: '',\n      is_active: true",
    "items_included: '',\n      is_active: true,\n      image_url: ''"
  );
}

// 5. Payload
if (!content.includes("image_url: formData.image_url")) {
  content = content.replace(
    "is_active: formData.is_active",
    "is_active: formData.is_active,\n      image_url: formData.image_url"
  );
}

// 6. Cropper Logic
const cropperLogic = `
  const processImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropState(prev => ({ ...prev, isOpen: true, image: reader.result, crop: {x:0, y:0}, zoom: 1 }));
    };
  };

  const handleImageSelect = (e) => processImageFile(e.target.files[0]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCropState(prev => ({ ...prev, croppedAreaPixels }));
  };

  const generateWebP = async (imageSrc, crop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise(resolve => image.onload = resolve);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = 600;
    canvas.width = maxSize;
    canvas.height = maxSize;

    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      maxSize,
      maxSize
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/webp', 0.8);
    });
  };

  const uploadCroppedImage = async () => {
    try {
      setUploadingImage(true);
      const blob = await generateWebP(cropState.image, cropState.croppedAreaPixels);
      const fileName = \`\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}.webp\`;

      const { data, error } = await supabase.storage
        .from('menu_images')
        .upload(fileName, blob, { contentType: 'image/webp', upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage.from('menu_images').getPublicUrl(fileName);
      
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      setCropState({ isOpen: false, image: null, crop: { x: 0, y: 0 }, zoom: 1, croppedAreaPixels: null });
      showToast('Image uploaded successfully');
    } catch (err) {
      console.error('Image crop error:', err);
      showToast(err.message, true);
    } finally {
      setUploadingImage(false);
    }
  };
`;

if (!content.includes("processImageFile")) {
  content = content.replace(
    "const handleOpenCreate = () => {",
    cropperLogic + "\n  const handleOpenCreate = () => {"
  );
}

// 7. Modals and Forms
const cropperJSX = `
      {cropState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/20 relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Crop Image</h3>
              <button onClick={() => setCropState(prev => ({ ...prev, isOpen: false }))} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full h-80 bg-slate-900">
              <Cropper
                image={cropState.image}
                crop={cropState.crop}
                zoom={cropState.zoom}
                aspect={1}
                onCropChange={crop => setCropState(prev => ({ ...prev, crop }))}
                onCropComplete={onCropComplete}
                onZoomChange={zoom => setCropState(prev => ({ ...prev, zoom }))}
              />
            </div>
            
            <div className="p-5 bg-white space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">Zoom</label>
                <input
                  type="range"
                  value={cropState.zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setCropState(prev => ({ ...prev, zoom: e.target.value }))}
                  className="w-full accent-purple-600"
                />
              </div>
              <button
                onClick={uploadCroppedImage}
                disabled={uploadingImage}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crop & Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

const imageUploadUI = `
              <div className="col-span-4 mt-2 mb-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Offer Image (WebP Compressed)</label>
                <div className="flex items-center gap-2">
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0" />
                  )}
                  <label 
                    className={\`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border rounded-xl cursor-pointer transition-colors text-[10px] font-bold h-10 \${
                      isDragging 
                        ? 'bg-purple-50 border-purple-400 text-purple-700 border-dashed' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 border-solid'
                    }\`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Upload className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{uploadingImage ? 'Compressing...' : isDragging ? 'Drop Image Here' : 'Upload Image'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploadingImage} />
                  </label>
                </div>
              </div>
`;

if (!content.includes("Crop Image")) {
  content = content.replace(
    "{modalOpen && (",
    cropperJSX + "\n      {modalOpen && ("
  );
}

if (!content.includes("Offer Image (WebP Compressed)")) {
  content = content.replace(
    /<div className="col-span-2">[\s\S]*?<label className="block text-xs font-bold text-slate-700 mb-1">Offer Title<\/label>[\s\S]*?<\/div>/,
    "$&" + "\n" + imageUploadUI
  );
}

fs.writeFileSync(file, content);
console.log('AdminOffers patched!');
