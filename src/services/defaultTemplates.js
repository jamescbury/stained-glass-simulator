// Default template definitions
export const DEFAULT_TEMPLATES = [
  {
    fileName: 'daisy.svg',
    name: 'Daisy',
    category: 'Floral',
    difficulty: 'intermediate',
    pieceCount: 0, // Will be calculated when loaded
    description: 'A beautiful daisy flower pattern'
  },
  {
    fileName: 'fence.svg',
    name: 'Fence',
    category: 'Geometric',
    difficulty: 'beginner',
    pieceCount: 0,
    description: 'Simple fence pattern with rectangular sections'
  },
  {
    fileName: 'honeycomb.svg',
    name: 'Honeycomb',
    category: 'Geometric',
    difficulty: 'intermediate',
    pieceCount: 0,
    description: 'Hexagonal honeycomb pattern'
  },
  {
    fileName: 'mountain.svg',
    name: 'Mountain',
    category: 'Landscape',
    difficulty: 'advanced',
    pieceCount: 0,
    description: 'Mountain landscape with multiple layers'
  },
  {
    fileName: 'squigle_fence.svg',
    name: 'Squiggle Fence',
    category: 'Abstract',
    difficulty: 'intermediate',
    pieceCount: 0,
    description: 'Decorative fence with wavy patterns'
  },
  {
    fileName: 'sunflower.svg',
    name: 'Sunflower',
    category: 'Floral',
    difficulty: 'advanced',
    pieceCount: 0,
    description: 'Detailed sunflower with petals and center'
  },
  {
    fileName: 'sunrise.svg',
    name: 'Sunrise',
    category: 'Landscape',
    difficulty: 'intermediate',
    pieceCount: 0,
    description: 'Sunrise scene with radiating light patterns'
  },
  {
    fileName: 'tulip_festival.svg',
    name: 'Tulip Festival',
    category: 'Floral',
    difficulty: 'advanced',
    pieceCount: 0,
    description: 'A detailed tulip festival floral pattern'
  }
];

// Load default template SVG content
export async function loadDefaultTemplate(template) {
  try {
    // In development, files in public folder are served from root
    const url = process.env.NODE_ENV === 'development' 
      ? `/template_patterns/${template.fileName}`
      : `${window.location.origin}/template_patterns/${template.fileName}`;
    console.log(`Loading template from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to load template: ${template.fileName}, status: ${response.status}`);
      throw new Error(`Failed to load template: ${template.fileName}`);
    }
    
    const svgContent = await response.text();
    console.log(`Loaded ${template.fileName}, content length: ${svgContent.length}`);
    
    // Check if we got HTML instead of SVG
    if (svgContent.includes('<!DOCTYPE html>') || svgContent.includes('<html')) {
      console.error(`Got HTML instead of SVG for ${template.fileName}. The file path may be incorrect.`);
      throw new Error(`Invalid SVG content for ${template.fileName}`);
    }
    
    // Parse SVG to count pieces
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const shapes = doc.querySelectorAll('path, polygon, rect, circle, ellipse, polyline');
    
    const result = {
      ...template,
      svgContent,
      pieceCount: shapes.length,
      isDefault: true,
      uploadDate: new Date().toISOString(),
      fileSize: new Blob([svgContent]).size,
      type: 'template'
    };
    
    console.log(`Processed ${template.name}: ${shapes.length} pieces, ${result.fileSize} bytes`);
    return result;
  } catch (error) {
    console.error(`Error loading default template ${template.fileName}:`, error);
    return null;
  }
}

// Load all default templates
export async function loadAllDefaultTemplates() {
  const loadPromises = DEFAULT_TEMPLATES.map(template => loadDefaultTemplate(template));
  const results = await Promise.all(loadPromises);
  return results.filter(result => result !== null);
}

// Load default templates with progress callback
export async function loadDefaultTemplatesWithProgress(onProgress) {
  const results = [];
  const total = DEFAULT_TEMPLATES.length;
  
  for (let i = 0; i < total; i++) {
    const template = DEFAULT_TEMPLATES[i];
    const result = await loadDefaultTemplate(template);
    if (result) {
      results.push(result);
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }
  
  return results;
}