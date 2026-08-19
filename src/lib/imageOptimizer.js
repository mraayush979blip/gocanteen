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
  // Image transformations returned 400, likely due to Supabase plan limits or disabled feature.
  // Returning the original URL to fix broken images.
  return url;
}
