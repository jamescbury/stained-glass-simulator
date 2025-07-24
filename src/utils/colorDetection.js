// Utility functions for color detection and analysis

// Convert RGB to hex color
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert hex to RGB
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Get color name from hex
export function getColorName(hex) {
  const colors = {
    '#FF0000': 'Red',
    '#FF4500': 'Orange Red',
    '#FFA500': 'Orange',
    '#FFD700': 'Gold',
    '#FFFF00': 'Yellow',
    '#ADFF2F': 'Green Yellow',
    '#00FF00': 'Lime',
    '#32CD32': 'Lime Green',
    '#008000': 'Green',
    '#40E0D0': 'Turquoise',
    '#00FFFF': 'Cyan',
    '#0000FF': 'Blue',
    '#000080': 'Navy',
    '#4B0082': 'Indigo',
    '#800080': 'Purple',
    '#FF00FF': 'Magenta',
    '#FFC0CB': 'Pink',
    '#964B00': 'Brown',
    '#FFBF00': 'Amber',
    '#000000': 'Black',
    '#808080': 'Gray',
    '#FFFFFF': 'White',
    '#F3E5AB': 'Vanilla'
  };

  // Find closest color
  let closestColor = 'Unknown';
  let minDistance = Infinity;

  const rgb1 = hexToRgb(hex);
  if (!rgb1) return closestColor;

  for (const [colorHex, colorName] of Object.entries(colors)) {
    const rgb2 = hexToRgb(colorHex);
    if (!rgb2) continue;

    const distance = Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = colorName;
    }
  }

  return closestColor;
}

// Analyze dominant colors from image data
export async function analyzeImageColors(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Sample a smaller version for performance
      const sampleSize = 100;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      
      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      
      const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
      const pixels = imageData.data;
      
      // Color frequency map
      const colorMap = new Map();
      
      // Sample every 4th pixel for speed
      for (let i = 0; i < pixels.length; i += 16) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        
        // Skip transparent pixels
        if (a < 128) continue;
        
        // Quantize colors to reduce variations
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;
        
        const key = `${qr},${qg},${qb}`;
        colorMap.set(key, (colorMap.get(key) || 0) + 1);
      }
      
      // Sort by frequency and get top colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => {
          const [r, g, b] = color.split(',').map(Number);
          return rgbToHex(r, g, b);
        });
      
      resolve({
        dominantColor: sortedColors[0] || '#808080',
        palette: sortedColors,
        colorNames: sortedColors.map(hex => getColorName(hex))
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
}

// Detect glass properties from color analysis
export function detectGlassProperties(colorAnalysis) {
  const { dominantColor, palette } = colorAnalysis;
  
  // Analyze color variation to determine glass texture
  const colorVariation = palette.length;
  const hasHighContrast = checkColorContrast(palette);
  
  let glassTexture = 'cathedral'; // Default texture
  
  if (colorVariation === 1) {
    glassTexture = 'clear';
  } else if (colorVariation === 2) {
    glassTexture = 'cathedral';
  } else if (hasHighContrast && colorVariation > 3) {
    glassTexture = 'streaky';
  } else if (colorVariation > 2) {
    glassTexture = 'textured';
  }
  
  // Check for special properties
  const properties = [];
  
  // Check for opalescence (light colors with variation)
  if (isLightColor(dominantColor) && colorVariation > 2) {
    glassTexture = 'opalescent';
  }
  
  // Check for wispy pattern (multiple soft colors)
  if (palette.some(isVibrantColor) && colorVariation > 3 && !hasHighContrast) {
    glassTexture = 'wispy';
  }
  
  return {
    texture: glassTexture,
    properties
  };
}

// Helper functions
function checkColorContrast(colors) {
  if (colors.length < 2) return false;
  
  const rgbs = colors.map(hexToRgb).filter(Boolean);
  let maxContrast = 0;
  
  for (let i = 0; i < rgbs.length; i++) {
    for (let j = i + 1; j < rgbs.length; j++) {
      const contrast = Math.abs(rgbs[i].r - rgbs[j].r) +
                      Math.abs(rgbs[i].g - rgbs[j].g) +
                      Math.abs(rgbs[i].b - rgbs[j].b);
      maxContrast = Math.max(maxContrast, contrast);
    }
  }
  
  return maxContrast > 300; // High contrast threshold
}

function isLightColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 200;
}

function isVibrantColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  
  return (max - min) > 100 && max > 200;
}