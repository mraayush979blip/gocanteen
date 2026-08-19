/**
 * Optimizes Supabase Storage image URLs to use the Image Transformation API.
 * This drastically reduces file size and improves load times.
 * 
 * @param {string} url - The original image URL
 * @param {number} width - The target width (default 400px)
 * @param {number} quality - The target quality (default 80%)
 * @returns {string} The optimized image URL
 */
export function optimizeImage(url, width = 400, quality = 80) {
  if (!url || typeof url !== 'string') return '';
  
  // Only transform if it's a raw Supabase public storage URL
  if (url.includes('/storage/v1/object/public/')) {
    // Replace the endpoint to use the image renderer
    const transformedUrl = url.replace(
      '/storage/v1/object/public/', 
      '/storage/v1/render/image/public/'
    );
    // Append the transformation parameters
    // Note: Supabase supports format=webp automatically if the browser accepts it,
    // but you can force it or just specify width & quality.
    return `${transformedUrl}?width=${width}&quality=${quality}`;
  }
  
  return url;
}
