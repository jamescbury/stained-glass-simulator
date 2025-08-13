// Import SVG files as text using raw-loader syntax
// Note: You may need to install raw-loader or configure webpack to handle .svg?raw imports

// For now, let's create placeholder SVGs to test the system
const placeholderSVG = (name) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="#e0e0e0" stroke="#999" stroke-width="2"/>
  <text x="50" y="50" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">${name}</text>
</svg>`;

// Export template data with inline SVG content
export const DEFAULT_TEMPLATE_DATA = [
  {
    fileName: 'daisy.svg',
    name: 'Daisy',
    category: 'Floral',
    difficulty: 'intermediate',
    description: 'A beautiful daisy flower pattern',
    svgContent: placeholderSVG('Daisy')
  },
  {
    fileName: 'fence.svg',
    name: 'Fence',
    category: 'Geometric',
    difficulty: 'beginner',
    description: 'Simple fence pattern with rectangular sections',
    svgContent: placeholderSVG('Fence')
  },
  {
    fileName: 'honeycomb.svg',
    name: 'Honeycomb',
    category: 'Geometric',
    difficulty: 'intermediate',
    description: 'Hexagonal honeycomb pattern',
    svgContent: placeholderSVG('Honeycomb')
  },
  {
    fileName: 'mountain.svg',
    name: 'Mountain',
    category: 'Landscape',
    difficulty: 'advanced',
    description: 'Mountain landscape with multiple layers',
    svgContent: placeholderSVG('Mountain')
  },
  {
    fileName: 'squigle_fence.svg',
    name: 'Squiggle Fence',
    category: 'Abstract',
    difficulty: 'intermediate',
    description: 'Decorative fence with wavy patterns',
    svgContent: placeholderSVG('Squiggle')
  },
  {
    fileName: 'sunflower.svg',
    name: 'Sunflower',
    category: 'Floral',
    difficulty: 'advanced',
    description: 'Detailed sunflower with petals and center',
    svgContent: placeholderSVG('Sunflower')
  },
  {
    fileName: 'sunrise.svg',
    name: 'Sunrise',
    category: 'Landscape',
    difficulty: 'intermediate',
    description: 'Sunrise scene with radiating light patterns',
    svgContent: placeholderSVG('Sunrise')
  },
  {
    fileName: 'tulip_festival.svg',
    name: 'Tulip Festival',
    category: 'Floral',
    difficulty: 'advanced',
    description: 'A detailed tulip festival floral pattern',
    svgContent: placeholderSVG('Tulip Festival')
  }
];

// Process templates for storage
export function getProcessedTemplates() {
  return DEFAULT_TEMPLATE_DATA.map(template => {
    // Parse SVG to count pieces
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.svgContent, 'image/svg+xml');
    const shapes = doc.querySelectorAll('path, polygon, rect, circle, ellipse, polyline');
    
    return {
      ...template,
      pieceCount: shapes.length,
      isDefault: true,
      uploadDate: new Date().toISOString(),
      fileSize: new Blob([template.svgContent]).size,
      type: 'template'
    };
  });
}