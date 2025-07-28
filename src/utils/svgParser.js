// Parse SVG content and extract individual pieces
export function parseSVGPieces(svgContent, modifyOriginal = false) {
  // Guard against empty or invalid content
  if (!svgContent || typeof svgContent !== 'string' || svgContent.trim() === '') {
    return modifyOriginal ? { pieces: [], modifiedSvg: '' } : [];
  }
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  
  // Check for parser errors
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    console.error('SVG parsing error:', parserError.textContent);
    return modifyOriginal ? { pieces: [], modifiedSvg: svgContent } : [];
  }
  
  const svg = doc.querySelector('svg');
  
  if (!svg) {
    console.warn('No SVG element found in content');
    return modifyOriginal ? { pieces: [], modifiedSvg: svgContent } : [];
  }

  const pieces = [];
  let pieceIndex = 0;
  
  // Find all shape elements, even if they're inside groups
  const shapeElements = svg.querySelectorAll('path, polygon, rect, circle, ellipse, polyline');
  
  let skippedCount = 0;
  
  shapeElements.forEach((element, totalIndex) => {
    // Skip elements inside defs or symbol elements
    if (element.closest('defs') || element.closest('symbol')) {
      skippedCount++;
      return;
    }
    
    // Skip if this element is just for decoration (like borders)
    const stroke = element.getAttribute('stroke');
    const fill = element.getAttribute('fill');
    const strokeWidth = parseFloat(element.getAttribute('stroke-width') || '0');
    
    // More accurate detection of decorative elements
    const isDecorative = false; // Let's not filter anything for now
    
    const piece = {
      type: element.tagName.toLowerCase(),
      id: element.id || `piece-${pieceIndex++}`,
      element: element,
      parentGroup: element.closest('g'),
      attributes: {},
      isDecorative: isDecorative
    };
    
    // Copy relevant attributes
    ['fill', 'stroke', 'stroke-width', 'd', 'points', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value) {
        piece.attributes[attr] = value;
      }
    });
    
    // Copy style if present
    const style = element.getAttribute('style');
    if (style) {
      piece.attributes.style = style;
    }
    
    // Try to calculate area (simplified)
    try {
      piece.area = calculateShapeArea(element);
    } catch (error) {
      piece.area = null;
    }
    
    // Add unique ID if not present
    if (!element.id) {
      element.id = piece.id;
    }
    
    // Add data attribute for easy selection
    element.setAttribute('data-piece-index', pieces.length);
    
    pieces.push(piece);
  });
  
  
  if (modifyOriginal) {
    // Return both pieces and modified SVG content
    const serializer = new XMLSerializer();
    const modifiedSvg = serializer.serializeToString(doc);
    return { pieces, modifiedSvg };
  }
  
  return pieces;
}

// Simple area calculation for basic shapes
function calculateShapeArea(element) {
  const type = element.tagName.toLowerCase();
  
  switch (type) {
    case 'rect':
      const width = parseFloat(element.getAttribute('width') || 0);
      const height = parseFloat(element.getAttribute('height') || 0);
      return width * height;
      
    case 'circle':
      const r = parseFloat(element.getAttribute('r') || 0);
      return Math.PI * r * r;
      
    case 'ellipse':
      const rx = parseFloat(element.getAttribute('rx') || 0);
      const ry = parseFloat(element.getAttribute('ry') || 0);
      return Math.PI * rx * ry;
      
    case 'polygon':
    case 'path':
      // For complex shapes, we'd need more sophisticated calculations
      // For now, return a placeholder
      return null;
      
    default:
      return null;
  }
}

// Extract color information from SVG
export function extractSVGColors(svgContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const colors = new Set();
  
  // Find all elements with fill or stroke
  const elements = doc.querySelectorAll('[fill], [stroke]');
  elements.forEach(element => {
    const fill = element.getAttribute('fill');
    const stroke = element.getAttribute('stroke');
    
    if (fill && fill !== 'none' && fill !== 'transparent') {
      colors.add(fill);
    }
    if (stroke && stroke !== 'none' && stroke !== 'transparent') {
      colors.add(stroke);
    }
  });
  
  // Also check for styles
  const styledElements = doc.querySelectorAll('[style]');
  styledElements.forEach(element => {
    const style = element.getAttribute('style');
    const fillMatch = style.match(/fill:\s*([^;]+)/);
    const strokeMatch = style.match(/stroke:\s*([^;]+)/);
    
    if (fillMatch && fillMatch[1] !== 'none') {
      colors.add(fillMatch[1].trim());
    }
    if (strokeMatch && strokeMatch[1] !== 'none') {
      colors.add(strokeMatch[1].trim());
    }
  });
  
  return Array.from(colors);
}

// Get SVG dimensions
export function getSVGDimensions(svgContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svg = doc.querySelector('svg');
  
  if (!svg) {
    return { width: 0, height: 0 };
  }
  
  const viewBox = svg.getAttribute('viewBox');
  const width = svg.getAttribute('width');
  const height = svg.getAttribute('height');
  
  if (viewBox) {
    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(parseFloat);
    return { width: vbWidth, height: vbHeight };
  }
  
  return {
    width: parseFloat(width) || 0,
    height: parseFloat(height) || 0
  };
}