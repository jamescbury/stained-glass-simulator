import { Delaunay } from 'd3-delaunay';

// Generate Voronoi pattern (organic cells)
export function generateVoronoiPattern(width = 400, height = 400, cellCount = 20) {
  // Generate random points
  const points = Array.from({ length: cellCount }, () => [
    Math.random() * width,
    Math.random() * height
  ]);
  
  // Add boundary points to ensure full coverage
  const boundaryPoints = [
    [0, 0], [width/2, 0], [width, 0],
    [width, height/2], [width, height],
    [width/2, height], [0, height],
    [0, height/2]
  ];
  
  const allPoints = [...points, ...boundaryPoints];
  const delaunay = Delaunay.from(allPoints);
  const voronoi = delaunay.voronoi([0, 0, width, height]);
  
  const pieces = [];
  for (let i = 0; i < allPoints.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (cell && cell.length > 0) {
      pieces.push({
        type: 'polygon',
        points: cell,
        label: `cell${i}`,
        colorHint: getColorHintByPosition(allPoints[i], width, height)
      });
    }
  }
  
  return pieces;
}

// Generate triangular pattern
export function generateTrianglePattern(width = 400, height = 400) {
  const pieces = [];
  
  // Create a grid of triangles manually
  const cellSize = 50;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellSize;
      const y = row * cellSize;
      
      // Create two triangles per cell
      if ((row + col) % 2 === 0) {
        pieces.push({
          type: 'polygon',
          points: [[x, y], [x + cellSize, y], [x + cellSize/2, y + cellSize]],
          label: `tri${row}_${col}_a`,
          colorHint: getColorHintByPosition([x + cellSize/2, y + cellSize/3], width, height)
        });
        pieces.push({
          type: 'polygon',
          points: [[x, y], [x + cellSize/2, y + cellSize], [x, y + cellSize]],
          label: `tri${row}_${col}_b`,
          colorHint: getColorHintByPosition([x + cellSize/4, y + cellSize*2/3], width, height)
        });
      } else {
        pieces.push({
          type: 'polygon',
          points: [[x, y], [x + cellSize, y], [x, y + cellSize]],
          label: `tri${row}_${col}_a`,
          colorHint: getColorHintByPosition([x + cellSize/3, y + cellSize/3], width, height)
        });
        pieces.push({
          type: 'polygon',
          points: [[x + cellSize, y], [x + cellSize, y + cellSize], [x, y + cellSize]],
          label: `tri${row}_${col}_b`,
          colorHint: getColorHintByPosition([x + cellSize*2/3, y + cellSize*2/3], width, height)
        });
      }
    }
  }
  
  return pieces;
}

// Generate hexagonal pattern
export function generateHexagonPattern(width = 400, height = 400) {
  const pieces = [];
  const hexSize = 30;
  const hexHeight = hexSize * 2;
  const hexWidth = hexSize * Math.sqrt(3);
  
  const cols = Math.ceil(width / hexWidth) + 1;
  const rows = Math.ceil(height / (hexHeight * 0.75)) + 1;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0);
      const y = row * hexHeight * 0.75;
      
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push([
          x + hexSize * Math.cos(angle),
          y + hexSize * Math.sin(angle)
        ]);
      }
      
      pieces.push({
        type: 'polygon',
        points: points,
        label: `hex${row}_${col}`,
        colorHint: getColorHintByPosition([x, y], width, height)
      });
    }
  }
  
  return pieces;
}

// Generate rectangular grid pattern
export function generateGridPattern(width = 400, height = 400, cols = 8, rows = 8) {
  const pieces = [];
  const cellWidth = width / cols;
  const cellHeight = height / rows;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      pieces.push({
        type: 'polygon',
        points: [
          [x, y],
          [x + cellWidth, y],
          [x + cellWidth, y + cellHeight],
          [x, y + cellHeight]
        ],
        label: `grid${row}_${col}`,
        colorHint: (row + col) % 2 === 0 ? 'primary' : 'secondary'
      });
    }
  }
  
  return pieces;
}

// Generate diamond/rhombus pattern
export function generateDiamondPattern(width = 400, height = 400) {
  const pieces = [];
  const diamondSize = 40;
  const cols = Math.ceil(width / diamondSize) + 1;
  const rows = Math.ceil(height / diamondSize) + 1;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * diamondSize;
      const y = row * diamondSize;
      
      pieces.push({
        type: 'polygon',
        points: [
          [x + diamondSize/2, y],
          [x + diamondSize, y + diamondSize/2],
          [x + diamondSize/2, y + diamondSize],
          [x, y + diamondSize/2]
        ],
        label: `diamond${row}_${col}`,
        colorHint: getColorHintByPosition([x + diamondSize/2, y + diamondSize/2], width, height)
      });
    }
  }
  
  return pieces;
}

// Parse SVG file to extract polygons and paths
export async function parseSVGFile(svgContent, preserveColors = false) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const pieces = [];
  
  // Get SVG viewBox or width/height
  const svg = doc.querySelector('svg');
  let viewBox = svg.getAttribute('viewBox');
  let bounds = { x: 0, y: 0, width: 400, height: 400 };
  
  if (viewBox) {
    const [x, y, w, h] = viewBox.split(/\s+/).map(Number);
    bounds = { x, y, width: w, height: h };
  } else {
    const width = parseFloat(svg.getAttribute('width') || 400);
    const height = parseFloat(svg.getAttribute('height') || 400);
    bounds = { x: 0, y: 0, width, height };
  }
  
  // Parse CSS styles
  const styleMap = {};
  const styleElement = doc.querySelector('style');
  if (styleElement) {
    const cssText = styleElement.textContent;
    // Extract class rules
    const classRegex = /\.(\w+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = classRegex.exec(cssText)) !== null) {
      const className = match[1];
      const rules = match[2];
      const fillMatch = rules.match(/fill:\s*([^;]+)/);
      if (fillMatch) {
        styleMap[className] = fillMatch[1].trim();
      }
    }
  }
  
  // Helper to apply transforms
  function applyTransform(points, transformStr) {
    if (!transformStr || transformStr.trim() === '') return points;
    
    let transformedPoints = [...points];
    
    // Parse all transforms in order
    const transforms = transformStr.match(/(\w+)\([^)]+\)/g) || [];
    
    transforms.forEach(transform => {
      // Translate
      const translateMatch = transform.match(/translate\(([-\d.]+)(?:\s*,\s*([-\d.]+))?\)/);
      if (translateMatch) {
        const tx = parseFloat(translateMatch[1]);
        const ty = parseFloat(translateMatch[2] || 0);
        transformedPoints = transformedPoints.map(([x, y]) => [x + tx, y + ty]);
      }
      
      // Rotate
      const rotateMatch = transform.match(/rotate\(([-\d.]+)(?:\s+([-\d.]+)\s+([-\d.]+))?\)/);
      if (rotateMatch) {
        const angle = parseFloat(rotateMatch[1]) * Math.PI / 180;
        const cx = parseFloat(rotateMatch[2] || 0);
        const cy = parseFloat(rotateMatch[3] || 0);
        
        transformedPoints = transformedPoints.map(([x, y]) => {
          // Translate to origin
          const x1 = x - cx;
          const y1 = y - cy;
          // Rotate
          const x2 = x1 * Math.cos(angle) - y1 * Math.sin(angle);
          const y2 = x1 * Math.sin(angle) + y1 * Math.cos(angle);
          // Translate back
          return [x2 + cx, y2 + cy];
        });
      }
      
      // Scale
      const scaleMatch = transform.match(/scale\(([-\d.]+)(?:\s*,\s*([-\d.]+))?\)/);
      if (scaleMatch) {
        const sx = parseFloat(scaleMatch[1]);
        const sy = parseFloat(scaleMatch[2] || scaleMatch[1]);
        transformedPoints = transformedPoints.map(([x, y]) => [x * sx, y * sy]);
      }
    });
    
    return transformedPoints;
  }
  
  // Helper function to parse color from SVG
  function parseColor(fillAttr) {
    if (!fillAttr || fillAttr === 'none') return null;
    
    // Handle hex colors
    if (fillAttr.startsWith('#')) {
      const hex = fillAttr;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { name: 'Custom', hex, rgb: [r, g, b] };
    }
    
    // Handle rgb colors
    const rgbMatch = fillAttr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      return { name: 'Custom', hex, rgb: [r, g, b] };
    }
    
    return null;
  }

  // Process all groups and their children
  const processElement = (element, parentTransform = '', parentStyle = {}) => {
    const transform = parentTransform + ' ' + (element.getAttribute('transform') || '');
    
    // Get style attributes
    const style = element.getAttribute('style') || '';
    const fillMatch = style.match(/fill:\s*([^;]+)/);
    const fillAttr = element.getAttribute('fill');
    const fill = fillMatch ? fillMatch[1] : fillAttr || parentStyle.fill;
    
    const currentStyle = { ...parentStyle };
    if (fill) currentStyle.fill = fill;
    
    // Process child elements (direct children only to avoid duplicates)
    Array.from(element.children).forEach((child, index) => {
      // Skip image elements
      if (child.tagName === 'image') {
        console.warn('Skipping embedded image element - not suitable for stained glass patterns');
        return;
      }
      
      if (!['polygon', 'path', 'rect', 'circle', 'ellipse'].includes(child.tagName)) {
        return;
      }
      // Get element-specific fill
      const childStyle = child.getAttribute('style') || '';
      const childFillMatch = childStyle.match(/fill:\s*([^;]+)/);
      const childFillAttr = child.getAttribute('fill');
      const childClass = child.getAttribute('class');
      
      // Check for CSS class fill first, then inline styles
      let childFill = childFillMatch ? childFillMatch[1] : childFillAttr || currentStyle.fill;
      if (!childFill && childClass && styleMap[childClass]) {
        childFill = styleMap[childClass];
      }
      
      let piece = null;
      
      if (child.tagName === 'polygon') {
        const pointsStr = child.getAttribute('points');
        const points = pointsStr.split(/\s+/).map(pair => {
          const coords = pair.split(',');
          return [parseFloat(coords[0]), parseFloat(coords[1])];
        });
        
        piece = {
          type: 'polygon',
          points: applyTransform(points, transform),
          label: `polygon${pieces.length}`,
          colorHint: 'custom'
        };
      } else if (child.tagName === 'path') {
        const d = child.getAttribute('d');
        const points = parseSimplePath(d);
        if (points && points.length >= 3) {
          piece = {
            type: 'polygon',
            points: applyTransform(points, transform),
            label: `path${pieces.length}`,
            colorHint: 'custom'
          };
        }
      } else if (child.tagName === 'rect') {
        const x = parseFloat(child.getAttribute('x') || 0);
        const y = parseFloat(child.getAttribute('y') || 0);
        const width = parseFloat(child.getAttribute('width'));
        const height = parseFloat(child.getAttribute('height'));
        
        const points = [
          [x, y],
          [x + width, y],
          [x + width, y + height],
          [x, y + height]
        ];
        
        piece = {
          type: 'polygon',
          points: applyTransform(points, transform),
          label: `rect${pieces.length}`,
          colorHint: 'custom'
        };
      }
      
      if (piece) {
        // Add color if preserveColors is true and color exists
        if (preserveColors && childFill) {
          const color = parseColor(childFill);
          if (color) {
            piece.color = color;
          }
        }
        pieces.push(piece);
      }
    });
    
    // Process child groups (direct children only)
    Array.from(element.children).forEach(child => {
      if (child.tagName === 'g') {
        processElement(child, transform, currentStyle);
      }
    });
  };
  
  // Start processing from the SVG element, not the document root
  const svgElement = doc.querySelector('svg');
  if (svgElement) {
    processElement(svgElement);
  }
  
  // If we found pieces, normalize them to fit in our standard viewport
  if (pieces.length > 0) {
    // First, find the actual bounding box of all pieces
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pieces.forEach(piece => {
      piece.points.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    });
    
    const actualWidth = maxX - minX;
    const actualHeight = maxY - minY;
    
    // Scale pieces to fit in 400x400 viewport while maintaining aspect ratio
    const scale = Math.min(380 / actualWidth, 380 / actualHeight); // Use 380 to add some padding
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    pieces.forEach(piece => {
      piece.points = piece.points.map(([x, y]) => [
        (x - centerX) * scale + 200, // Center at 200,200
        (y - centerY) * scale + 200
      ]);
    });
    
    // Remove duplicate pieces (same center point and similar area)
    const uniquePieces = [];
    const seen = new Set();
    
    console.log(`Total pieces before deduplication: ${pieces.length}`);
    
    pieces.forEach(piece => {
      // Calculate center and area for comparison
      const center = piece.points.reduce((acc, p) => ({
        x: acc.x + p[0],
        y: acc.y + p[1]
      }), { x: 0, y: 0 });
      center.x /= piece.points.length;
      center.y /= piece.points.length;
      
      // Calculate area using shoelace formula
      let area = 0;
      for (let i = 0; i < piece.points.length - 1; i++) {
        area += (piece.points[i][0] * piece.points[i + 1][1]) - (piece.points[i + 1][0] * piece.points[i][1]);
      }
      area = Math.abs(area / 2);
      
      // Create a key for deduplication - use less rounding for better precision
      const key = `${Math.round(center.x * 10) / 10}_${Math.round(center.y * 10) / 10}_${Math.round(area * 10) / 10}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniquePieces.push(piece);
      } else {
        console.log(`Duplicate found: ${piece.label} at center (${center.x.toFixed(1)}, ${center.y.toFixed(1)}) area ${area.toFixed(1)}`);
      }
    });
    
    console.log(`Pieces after deduplication: ${uniquePieces.length}`);
    
    return uniquePieces;
  }
  
  return pieces;
}

// Enhanced path parser that approximates complex paths as polygons
function parseSimplePath(d) {
  const points = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;
  
  // Split path into commands
  const commands = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g);
  if (!commands) return null;
  
  commands.forEach(command => {
    const type = command[0];
    const args = command.slice(1).trim().split(/[\s,]+/).filter(n => n).map(Number);
    
    switch (type.toUpperCase()) {
      case 'M': // Move to
        if (type === 'M') {
          currentX = args[0];
          currentY = args[1];
        } else {
          currentX += args[0];
          currentY += args[1];
        }
        startX = currentX;
        startY = currentY;
        points.push([currentX, currentY]);
        // Handle multiple coordinate pairs after M/m
        for (let i = 2; i < args.length; i += 2) {
          if (type === 'M') {
            currentX = args[i];
            currentY = args[i + 1];
          } else {
            currentX += args[i];
            currentY += args[i + 1];
          }
          points.push([currentX, currentY]);
        }
        break;
        
      case 'L': // Line to
        for (let i = 0; i < args.length; i += 2) {
          if (type === 'L') {
            currentX = args[i];
            currentY = args[i + 1];
          } else {
            currentX += args[i];
            currentY += args[i + 1];
          }
          points.push([currentX, currentY]);
        }
        break;
        
      case 'H': // Horizontal line
        for (let i = 0; i < args.length; i++) {
          currentX = type === 'H' ? args[i] : currentX + args[i];
          points.push([currentX, currentY]);
        }
        break;
        
      case 'V': // Vertical line
        for (let i = 0; i < args.length; i++) {
          currentY = type === 'V' ? args[i] : currentY + args[i];
          points.push([currentX, currentY]);
        }
        break;
        
      case 'C': // Cubic bezier - approximate with line segments
        for (let i = 0; i < args.length; i += 6) {
          const cp1x = type === 'C' ? args[i] : currentX + args[i];
          const cp1y = type === 'C' ? args[i + 1] : currentY + args[i + 1];
          const cp2x = type === 'C' ? args[i + 2] : currentX + args[i + 2];
          const cp2y = type === 'C' ? args[i + 3] : currentY + args[i + 3];
          const endX = type === 'C' ? args[i + 4] : currentX + args[i + 4];
          const endY = type === 'C' ? args[i + 5] : currentY + args[i + 5];
          
          // Add intermediate points for curve approximation
          const steps = 8;
          for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            const x = cubicBezier(currentX, cp1x, cp2x, endX, t);
            const y = cubicBezier(currentY, cp1y, cp2y, endY, t);
            points.push([x, y]);
          }
          currentX = endX;
          currentY = endY;
        }
        break;
        
      case 'S': // Smooth cubic bezier
        for (let i = 0; i < args.length; i += 4) {
          // Calculate reflected control point
          let cp1x = currentX;
          let cp1y = currentY;
          if (points.length > 1) {
            const prev = points[points.length - 2];
            cp1x = 2 * currentX - prev[0];
            cp1y = 2 * currentY - prev[1];
          }
          
          const cp2x = type === 'S' ? args[i] : currentX + args[i];
          const cp2y = type === 'S' ? args[i + 1] : currentY + args[i + 1];
          const endX = type === 'S' ? args[i + 2] : currentX + args[i + 2];
          const endY = type === 'S' ? args[i + 3] : currentY + args[i + 3];
          
          const steps = 8;
          for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            const x = cubicBezier(currentX, cp1x, cp2x, endX, t);
            const y = cubicBezier(currentY, cp1y, cp2y, endY, t);
            points.push([x, y]);
          }
          currentX = endX;
          currentY = endY;
        }
        break;
        
      case 'Q': // Quadratic bezier - approximate with line segments
        for (let i = 0; i < args.length; i += 4) {
          const cpx = type === 'Q' ? args[i] : currentX + args[i];
          const cpy = type === 'Q' ? args[i + 1] : currentY + args[i + 1];
          const endX = type === 'Q' ? args[i + 2] : currentX + args[i + 2];
          const endY = type === 'Q' ? args[i + 3] : currentY + args[i + 3];
          
          const steps = 5;
          for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            const x = quadraticBezier(currentX, cpx, endX, t);
            const y = quadraticBezier(currentY, cpy, endY, t);
            points.push([x, y]);
          }
          currentX = endX;
          currentY = endY;
        }
        break;
        
      case 'A': // Arc - approximate with line segments
        for (let i = 0; i < args.length; i += 7) {
          const rx = args[i];
          const ry = args[i + 1];
          const rotation = args[i + 2];
          const largeArc = args[i + 3];
          const sweep = args[i + 4];
          const endX = type === 'A' ? args[i + 5] : currentX + args[i + 5];
          const endY = type === 'A' ? args[i + 6] : currentY + args[i + 6];
          
          // Simple arc approximation - just add some intermediate points
          const steps = 10;
          for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            const x = currentX + (endX - currentX) * t;
            const y = currentY + (endY - currentY) * t;
            points.push([x, y]);
          }
          currentX = endX;
          currentY = endY;
        }
        break;
        
      case 'Z': // Close path
        points.push([startX, startY]);
        currentX = startX;
        currentY = startY;
        break;
    }
  });
  
  // Remove duplicate consecutive points
  const filtered = points.filter((point, i) => {
    if (i === 0) return true;
    const prev = points[i - 1];
    return Math.abs(point[0] - prev[0]) > 0.01 || Math.abs(point[1] - prev[1]) > 0.01;
  });
  
  return filtered.length >= 3 ? filtered : null;
}

// Bezier curve helpers
function quadraticBezier(p0, p1, p2, t) {
  return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
}

function cubicBezier(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return p0 * (1 - 3*t + 3*t2 - t3) + p1 * (3*t - 6*t2 + 3*t3) + 
         p2 * (3*t2 - 3*t3) + p3 * t3;
}

// Helper function to determine color hints based on position
function getColorHintByPosition([x, y], width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const distance = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
  const maxDistance = Math.sqrt(cx ** 2 + cy ** 2);
  
  if (distance < maxDistance * 0.3) return 'center';
  if (x < width * 0.33) return 'left';
  if (x > width * 0.66) return 'right';
  if (y < height * 0.33) return 'top';
  if (y > height * 0.66) return 'bottom';
  return 'middle';
}

// Predefined pattern templates
export const PATTERN_TEMPLATES = {
  voronoi: {
    name: 'Organic Cells',
    description: 'Natural, organic cell pattern like bubbles',
    generator: () => generateVoronoiPattern(400, 400, 20)
  },
  triangles: {
    name: 'Triangular',
    description: 'Geometric triangle tessellation',
    generator: () => generateTrianglePattern(400, 400)
  },
  hexagons: {
    name: 'Honeycomb',
    description: 'Hexagonal honeycomb pattern',
    generator: () => generateHexagonPattern(400, 400)
  },
  grid: {
    name: 'Grid',
    description: 'Simple rectangular grid',
    generator: () => generateGridPattern(400, 400, 8, 8)
  },
  diamonds: {
    name: 'Diamond',
    description: 'Diamond/rhombus pattern',
    generator: () => generateDiamondPattern(400, 400)
  }
};