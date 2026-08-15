import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { HardDrive, Search, Trash2, Loader2, Database, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminStorage() {
  const { showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [files, setFiles] = useState([]);
  const [dbUrls, setDbUrls] = useState(new Set());
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, in_use, unused
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  // Supabase free tier limits
  const MAX_STORAGE_BYTES = 1 * 1024 * 1024 * 1024; // 1GB
  const MAX_DB_BYTES = 500 * 1024 * 1024; // 500MB

  const [storageUsed, setStorageUsed] = useState(0);
  const [dbUsedEstimate, setDbUsedEstimate] = useState(0);

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all items with an image_url
      const { data: inventoryData, error: dbError } = await supabase
        .from('inventory')
        .select('image_url')
        .not('image_url', 'is', null);
        
      if (dbError) throw dbError;

      const urls = new Set(inventoryData.map(item => item.image_url));
      setDbUrls(urls);
      
      // Extremely rough estimate: 1KB per inventory item row
      const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
      const rowCount = count || inventoryData.length || 0;
      // Add generous overhead for users, categories, orders etc. Let's estimate 10MB base + 2KB per row
      setDbUsedEstimate((10 * 1024 * 1024) + (rowCount * 2048));

      // 2. Fetch all files from menu_images bucket
      const { data: storageFiles, error: storageError } = await supabase
        .storage
        .from('menu_images')
        .list('', {
          limit: 1000,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (storageError) throw storageError;

      // Filter out system files like .emptyFolderPlaceholder
      const validFiles = storageFiles.filter(f => f.name !== '.emptyFolderPlaceholder');
      
      let totalBytes = 0;
      
      const enrichedFiles = await Promise.all(validFiles.map(async (f) => {
        totalBytes += f.metadata?.size || 0;
        
        // Get public URL to check if it matches what's in DB
        const { data } = supabase.storage.from('menu_images').getPublicUrl(f.name);
        const isUsed = urls.has(data.publicUrl);
        
        return {
          name: f.name,
          size: f.metadata?.size || 0,
          created_at: f.created_at,
          url: data.publicUrl,
          isUsed
        };
      }));

      setStorageUsed(totalBytes);
      setFiles(enrichedFiles);

    } catch (err) {
      console.error('Error fetching storage:', err);
      showToast('Failed to load storage data', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    // Safety check: prevent deleting in-use files
    const filesToDelete = Array.from(selectedFiles).filter(fileName => {
      const file = files.find(f => f.name === fileName);
      return file && !file.isUsed;
    });

    if (filesToDelete.length === 0) {
      showToast('Cannot delete images that are currently in use.', true);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${filesToDelete.length} unused image(s)? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.storage
        .from('menu_images')
        .remove(filesToDelete);

      if (error) throw error;

      showToast(`Successfully deleted ${filesToDelete.length} image(s)`);
      setSelectedFiles(new Set());
      fetchStorageData(); // Refresh data
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete images', true);
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (fileName, isUsed) => {
    if (isUsed) return; // Cannot select in-use files
    const newSet = new Set(selectedFiles);
    if (newSet.has(fileName)) {
      newSet.delete(fileName);
    } else {
      newSet.add(fileName);
    }
    setSelectedFiles(newSet);
  };

  const selectAllUnused = () => {
    const unusedFiles = filteredFiles.filter(f => !f.isUsed);
    if (selectedFiles.size === unusedFiles.length) {
      setSelectedFiles(new Set()); // Deselect all
    } else {
      setSelectedFiles(new Set(unusedFiles.map(f => f.name))); // Select all
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => {
    if (filter === 'in_use' && !f.isUsed) return false;
    if (filter === 'unused' && f.isUsed) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unusedCount = files.filter(f => !f.isUsed).length;
  const storagePercent = Math.min(100, (storageUsed / MAX_STORAGE_BYTES) * 100);
  const dbPercent = Math.min(100, (dbUsedEstimate / MAX_DB_BYTES) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Storage & Images</h1>
          <p className="text-sm font-medium text-slate-500">Manage unused images to save cloud storage.</p>
        </div>
      </div>

      {/* Storage Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bucket Storage */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bucket Storage (Images)</h2>
              <p className="text-xs text-slate-500">{formatBytes(storageUsed)} / 1 GB (Free Tier)</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${storagePercent > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.max(1, storagePercent)}%` }}
            />
          </div>
          <div className="mt-2 text-right text-[10px] font-bold text-slate-400">
            {storagePercent.toFixed(2)}% Used
          </div>
        </div>

        {/* Database Storage (Mocked Estimate) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Database Size (Approx)</h2>
              <p className="text-xs text-slate-500">{formatBytes(dbUsedEstimate)} / 500 MB (Free Tier)</p>
            </div>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-purple-500 transition-all duration-500" 
              style={{ width: `${Math.max(1, dbPercent)}%` }}
            />
          </div>
          <div className="mt-2 text-right text-[10px] font-bold text-slate-400">
            {dbPercent.toFixed(2)}% Used
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-purple-300"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSelectedFiles(new Set());
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none flex-1 sm:flex-none"
          >
            <option value="all">All Images ({files.length})</option>
            <option value="in_use">In Use ({files.length - unusedCount})</option>
            <option value="unused">Unused ({unusedCount})</option>
          </select>

          {selectedFiles.size > 0 && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete {selectedFiles.size}
            </button>
          )}
        </div>
      </div>

      {/* Select All Bar (if looking at unused or all) */}
      {files.length > 0 && unusedCount > 0 && (filter === 'all' || filter === 'unused') && (
        <div className="flex items-center justify-between px-2">
          <button 
            onClick={selectAllUnused}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 underline cursor-pointer"
          >
            {selectedFiles.size > 0 ? 'Deselect All' : `Select All Unused (${filteredFiles.filter(f => !f.isUsed).length})`}
          </button>
        </div>
      )}

      {/* Image Grid */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-500">
          No images found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredFiles.map(file => (
            <div 
              key={file.name}
              onClick={() => toggleSelect(file.name, file.isUsed)}
              className={`relative bg-white border-2 rounded-2xl overflow-hidden group transition-all ${
                selectedFiles.has(file.name) 
                  ? 'border-red-500 shadow-md scale-[0.98]' 
                  : file.isUsed 
                    ? 'border-slate-100 opacity-60' // Dim in-use images to focus on unused
                    : 'border-slate-200 hover:border-slate-300 cursor-pointer'
              }`}
            >
              <div className="aspect-square bg-slate-50 w-full relative">
                <img 
                  src={file.url} 
                  alt={file.name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Status Badges */}
                <div className="absolute top-2 right-2">
                  {file.isUsed ? (
                    <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> IN USE
                    </div>
                  ) : (
                    <div className="bg-rose-100 text-rose-700 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm border border-rose-200">
                      <AlertCircle className="w-3 h-3" /> UNUSED
                    </div>
                  )}
                </div>

                {/* Selection Overlay */}
                {!file.isUsed && (
                  <div className={`absolute inset-0 bg-red-500/10 transition-opacity ${selectedFiles.has(file.name) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className={`absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center border-2 ${selectedFiles.has(file.name) ? 'bg-red-500 border-red-500' : 'border-slate-400 bg-white/50'}`}>
                      {selectedFiles.has(file.name) && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-100">
                <p className="text-[10px] font-medium text-slate-500 truncate" title={file.name}>{file.name}</p>
                <p className="text-[10px] font-bold text-slate-900">{formatBytes(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
