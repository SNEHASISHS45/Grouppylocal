/**
 * This function creates a cropped image based on the provided parameters
 */
export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  adjustments = { 
    brightness: 100, 
    contrast: 100, 
    saturation: 100, 
    filter: 'none',
    filterIntensity: 100,
    quality: 90,
    preserveOriginalSize: false,
    exposure: 0,
    sharpness: 0,
    hue: 0,
    vibrancy: 0,
    whiteBalance: { temperature: 0, tint: 0 },
    effect: 'none',
    effectIntensity: 50
  }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set dimensions to double image size to allow for rotation
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas center to image center
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // If preserving original size, calculate dimensions based on original image
  let finalWidth, finalHeight;
  if (adjustments.preserveOriginalSize) {
    // Calculate what portion of the original image is being cropped
    const cropRatio = pixelCrop.width / pixelCrop.height;
    const imageRatio = image.width / image.height;
    
    if (cropRatio > imageRatio) {
      // Width constrained
      finalWidth = image.width;
      finalHeight = image.width / cropRatio;
    } else {
      // Height constrained
      finalHeight = image.height;
      finalWidth = image.height * cropRatio;
    }
  } else {
    finalWidth = pixelCrop.width;
    finalHeight = pixelCrop.height;
  }

  // set canvas width to final desired crop size
  canvas.width = finalWidth;
  canvas.height = finalHeight;

  // place image in correct position to be cropped
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Apply adjustments
  applyAdjustments(ctx, finalWidth, finalHeight, adjustments);

  // Apply effects
  if (adjustments.effect && adjustments.effect !== 'none') {
    applyEffects(ctx, finalWidth, finalHeight, adjustments.effect, adjustments.effectIntensity);
  }

  // Convert to jpeg with quality setting
  const quality = adjustments.quality ? adjustments.quality / 100 : 0.9;
  return canvas.toDataURL('image/jpeg', quality);
}

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

function applyAdjustments(ctx, width, height, adjustments) {
  const { 
    brightness, 
    contrast, 
    saturation, 
    filter,
    filterIntensity = 100,
    exposure = 0,
    sharpness = 0,
    hue = 0,
    vibrancy = 0,
    whiteBalance = { temperature: 0, tint: 0 }
  } = adjustments;
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Apply basic adjustments and color correction
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    // Apply exposure (before brightness)
    if (exposure !== 0) {
      const exposureFactor = Math.pow(2, exposure / 100);
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;
    }
    
    // Apply brightness
    const brightnessAdjustment = brightness / 100;
    r *= brightnessAdjustment;
    g *= brightnessAdjustment;
    b *= brightnessAdjustment;
    
    // Apply contrast
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;
    
    // Apply white balance
    if (whiteBalance && (whiteBalance.temperature !== 0 || whiteBalance.tint !== 0)) {
      // Temperature (blue-yellow)
      if (whiteBalance.temperature > 0) {
        // Warmer (more yellow, less blue)
        b -= whiteBalance.temperature * 0.5;
        r += whiteBalance.temperature * 0.5;
      } else {
        // Cooler (more blue, less yellow)
        b -= whiteBalance.temperature * 0.5;
        r += whiteBalance.temperature * 0.5;
      }
      
      // Tint (green-magenta)
      if (whiteBalance.tint > 0) {
        // More magenta, less green
        g -= whiteBalance.tint * 0.5;
      } else {
        // More green, less magenta
        g += Math.abs(whiteBalance.tint) * 0.5;
      }
    }
    
    // Apply hue rotation
    if (hue !== 0) {
      // Convert RGB to HSL
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // Adjust hue
      const newHue = (h + hue / 360) % 1;
      
      // Convert back to RGB
      const [newR, newG, newB] = hslToRgb(newHue, s, l);
      r = newR;
      g = newG;
      b = newB;
    }
    
    // Apply saturation
    const satFactor = saturation / 100;
    const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
    r = gray * (1 - satFactor) + r * satFactor;
    g = gray * (1 - satFactor) + g * satFactor;
    b = gray * (1 - satFactor) + b * satFactor;
    
    // Apply vibrancy (selective saturation)
    if (vibrancy !== 0) {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = (max - min) / 255;
      const vibFactor = vibrancy / 100;
      
      // Only increase saturation for less saturated colors
      const satBoost = (1 - delta) * vibFactor;
      
      if (satBoost > 0) {
        const grayVal = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = grayVal * (1 - satBoost) + r * (1 + satBoost);
        g = grayVal * (1 - satBoost) + g * (1 + satBoost);
        b = grayVal * (1 - satBoost) + b * (1 + satBoost);
      }
    }
    
    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
  
  // Put the modified data back
  ctx.putImageData(imageData, 0, 0);
  
  // Apply sharpness (after putting image data back)
  if (sharpness > 0) {
    applySharpness(ctx, width, height, sharpness);
  }
  
  // Apply filters based on filter type and intensity
  if (filter && filter !== 'none') {
    // Create a temporary canvas to apply the filter with intensity
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    
    // Draw the current image to the temp canvas
    tempCtx.drawImage(ctx.canvas, 0, 0);
    
    // Apply CSS filter based on the selected filter
    const intensity = filterIntensity / 100;
    
    switch (filter) {
      case 'grayscale':
        applyFilterToCanvas(tempCtx, `grayscale(${intensity * 100}%)`);
        break;
      case 'sepia':
        applyFilterToCanvas(tempCtx, `sepia(${intensity * 100}%)`);
        break;
      case 'vintage':
        applyFilterToCanvas(tempCtx, `sepia(${intensity * 50}%) contrast(${100 + intensity * 20}%) brightness(${100 - intensity * 10}%)`);
        break;
      case 'warm':
        applyFilterToCanvas(tempCtx, `saturate(${100 + intensity * 50}%) brightness(${100 + intensity * 10}%)`);
        break;
      case 'cool':
        applyFilterToCanvas(tempCtx, `hue-rotate(${intensity * 180}deg) saturate(${100 - intensity * 20}%)`);
        break;
      case 'dramatic':
        applyFilterToCanvas(tempCtx, `contrast(${100 + intensity * 50}%) brightness(${100 - intensity * 10}%)`);
        break;
      case 'noir':
        applyFilterToCanvas(tempCtx, `grayscale(${intensity * 100}%) contrast(${100 + intensity * 50}%) brightness(${100 - intensity * 20}%)`);
        break;
      case 'clarity':
        applyFilterToCanvas(tempCtx, `contrast(${100 + intensity * 20}%) brightness(${100 + intensity * 10}%) saturate(${100 + intensity * 10}%)`);
        break;
      case 'fade':
        applyFilterToCanvas(tempCtx, `brightness(${100 + intensity * 10}%) saturate(${100 - intensity * 40}%) contrast(${100 - intensity * 10}%)`);
        break;
      case 'vivid':
        applyFilterToCanvas(tempCtx, `saturate(${100 + intensity * 100}%) contrast(${100 + intensity * 10}%)`);
        break;
      case 'matte':
        applyFilterToCanvas(tempCtx, `contrast(${100 - intensity * 10}%) brightness(${100 + intensity * 10}%) saturate(${100 - intensity * 20}%)`);
        break;
    }
    
    // Draw the filtered image back to the original canvas
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

// Helper function to apply CSS filters to canvas
function applyFilterToCanvas(ctx, filterString) {
  // Save the current canvas state
  ctx.save();
  
  // Apply the filter
  ctx.filter = filterString;
  
  // Draw the canvas onto itself with the filter applied
  ctx.drawImage(ctx.canvas, 0, 0);
  
  // Restore the canvas state
  ctx.restore();
}

// Apply sharpness using unsharp masking technique
function applySharpness(ctx, width, height, amount) {
  // Create a temporary canvas for the blur
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  
  // Draw the original image
  tempCtx.drawImage(ctx.canvas, 0, 0);
  
  // Apply a slight blur
  applyFilterToCanvas(tempCtx, `blur(1px)`);
  
  // Get the original and blurred image data
  const originalData = ctx.getImageData(0, 0, width, height);
  const blurredData = tempCtx.getImageData(0, 0, width, height);
  
  // Create a new ImageData for the sharpened result
  const resultData = ctx.createImageData(width, height);
  
  // Apply unsharp mask
  for (let i = 0; i < originalData.data.length; i += 4) {
    // For each channel (R,G,B), calculate the difference between original and blurred
    for (let j = 0; j < 3; j++) {
      const diff = originalData.data[i + j] - blurredData.data[i + j];
      resultData.data[i + j] = Math.max(0, Math.min(255, originalData.data[i + j] + diff * (amount / 50)));
    }
    // Keep alpha channel unchanged
    resultData.data[i + 3] = originalData.data[i + 3];
  }
  
  // Put the sharpened data back
  ctx.putImageData(resultData, 0, 0);
}