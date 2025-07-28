// Import default template SVG files as raw text
// These files are stored in public/template_patterns/

const loadSVGContent = async (fileName) => {
  try {
    // Use PUBLIC_URL to work in both local and GitHub Pages
    const paths = [
      `${process.env.PUBLIC_URL}/template_patterns/${fileName}`,
      `/template_patterns/${fileName}`,
      `./template_patterns/${fileName}`
    ];
    
    for (const path of paths) {
      try {
        console.log(`Trying to load from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          const content = await response.text();
          // Verify it's SVG content
          if (content.includes('<svg') && !content.includes('<!DOCTYPE html>')) {
            console.log(`Successfully loaded ${fileName} from ${path}`);
            return content;
          }
        }
      } catch (e) {
        // Continue to next path
      }
    }
    
    throw new Error(`Failed to load ${fileName} from any path`);
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error);
    // Return a simple placeholder SVG if loading fails
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect x="10" y="10" width="80" height="80" fill="#f0f0f0" stroke="#ccc"/>
      <text x="50" y="50" text-anchor="middle" fill="#999">Failed to load</text>
    </svg>`;
  }
};

export const loadDefaultTemplatesData = async () => {
  const templates = [
    {
      fileName: 'daisy.svg',
      name: 'Daisy',
      category: 'Floral',
      difficulty: 'intermediate',
      description: 'A beautiful daisy flower pattern'
    },
    {
      fileName: 'fence.svg',
      name: 'Fence',
      category: 'Geometric',
      difficulty: 'beginner',
      description: 'Simple fence pattern with rectangular sections'
    },
    {
      fileName: 'honeycomb.svg',
      name: 'Honeycomb',
      category: 'Geometric',
      difficulty: 'intermediate',
      description: 'Hexagonal honeycomb pattern'
    },
    {
      fileName: 'mountain.svg',
      name: 'Mountain',
      category: 'Landscape',
      difficulty: 'advanced',
      description: 'Mountain landscape with multiple layers'
    },
    {
      fileName: 'squigle_fence.svg',
      name: 'Squiggle Fence',
      category: 'Abstract',
      difficulty: 'intermediate',
      description: 'Decorative fence with wavy patterns'
    },
    {
      fileName: 'sunflower.svg',
      name: 'Sunflower',
      category: 'Floral',
      difficulty: 'advanced',
      description: 'Detailed sunflower with petals and center'
    },
    {
      fileName: 'sunrise.svg',
      name: 'Sunrise',
      category: 'Landscape',
      difficulty: 'intermediate',
      description: 'Sunrise scene with radiating light patterns'
    }
  ];

  const loadedTemplates = await Promise.all(
    templates.map(async (template) => {
      const svgContent = await loadSVGContent(template.fileName);
      
      // Parse SVG to count pieces
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const shapes = doc.querySelectorAll('path, polygon, rect, circle, ellipse, polyline');
      
      return {
        ...template,
        svgContent,
        pieceCount: shapes.length,
        isDefault: true,
        uploadDate: new Date().toISOString(),
        fileSize: new Blob([svgContent]).size,
        type: 'template'
      };
    })
  );

  return loadedTemplates;
};