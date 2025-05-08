/**
 * Utility for compressing images before upload
 */
export async function compressImage(file, options = {}) {
  // Default options
  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    quality: 0.8
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  // If browser supports createImageBitmap and OffscreenCanvas
  if ('createImageBitmap' in window && 'OffscreenCanvas' in window) {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions while maintaining aspect ratio
      let width = bitmap.width;
      let height = bitmap.height;
      
      if (width > finalOptions.maxWidthOrHeight || height > finalOptions.maxWidthOrHeight) {
        if (width > height) {
          height = Math.round(height * finalOptions.maxWidthOrHeight / width);
          width = finalOptions.maxWidthOrHeight;
        } else {
          width = Math.round(width * finalOptions.maxWidthOrHeight / height);
          height = finalOptions.maxWidthOrHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(bitmap, 0, 0, width, height);
      
      // Convert to blob with compression
      const blob = await canvas.convertToBlob({
        type: file.type,
        quality: finalOptions.quality
      });
      
      // Check if the compressed size is smaller than the original
      if (blob.size < file.size) {
        return new File([blob], file.name, { type: file.type });
      }
      
      return file; // Return original if compression didn't reduce size
    } catch (error) {
      console.error('Error compressing image:', error);
      return file; // Return original on error
    }
  } else {
    // Fallback for browsers without modern APIs
    console.warn('Image compression not supported in this browser');
    return file;
  }
}

/**
 * Utility for generating a thumbnail from an image
 */
export async function generateThumbnail(file, maxSize = 200) {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = new OffscreenCanvas(maxSize, maxSize);
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions to maintain aspect ratio
    let width, height;
    if (bitmap.width > bitmap.height) {
      height = Math.round(bitmap.height * maxSize / bitmap.width);
      width = maxSize;
    } else {
      width = Math.round(bitmap.width * maxSize / bitmap.height);
      height = maxSize;
    }
    
    // Center the image in the canvas
    const x = (maxSize - width) / 2;
    const y = (maxSize - height) / 2;
    
    ctx.drawImage(bitmap, x, y, width, height);
    
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: 0.7
    });
    
    return new File([blob], `thumb_${file.name}`, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}