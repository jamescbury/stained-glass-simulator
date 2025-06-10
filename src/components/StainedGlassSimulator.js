import React, { useState, useRef } from 'react';
import './StainedGlassSimulator.css';
import { PATTERN_TEMPLATES, parseSVGFile } from './PatternGenerator';

const GLASS_COLORS = {
  reds: [
    { name: 'Ruby', hex: '#E0115F', rgb: [224, 17, 95] },
    { name: 'Crimson', hex: '#DC143C', rgb: [220, 20, 60] },
    { name: 'Rose', hex: '#FF007F', rgb: [255, 0, 127] },
    { name: 'Burgundy', hex: '#800020', rgb: [128, 0, 32] },
  ],
  blues: [
    { name: 'Sapphire', hex: '#0F52BA', rgb: [15, 82, 186] },
    { name: 'Cobalt', hex: '#0047AB', rgb: [0, 71, 171] },
    { name: 'Azure', hex: '#007FFF', rgb: [0, 127, 255] },
    { name: 'Navy', hex: '#000080', rgb: [0, 0, 128] },
  ],
  greens: [
    { name: 'Emerald', hex: '#50C878', rgb: [80, 200, 120] },
    { name: 'Forest', hex: '#228B22', rgb: [34, 139, 34] },
    { name: 'Jade', hex: '#00A86B', rgb: [0, 168, 107] },
    { name: 'Olive', hex: '#808000', rgb: [128, 128, 0] },
  ],
  yellows: [
    { name: 'Amber', hex: '#FFBF00', rgb: [255, 191, 0] },
    { name: 'Gold', hex: '#FFD700', rgb: [255, 215, 0] },
    { name: 'Honey', hex: '#FFB300', rgb: [255, 179, 0] },
    { name: 'Citrine', hex: '#E4D00A', rgb: [228, 208, 10] },
  ],
  purples: [
    { name: 'Amethyst', hex: '#9966CC', rgb: [153, 102, 204] },
    { name: 'Violet', hex: '#7F00FF', rgb: [127, 0, 255] },
    { name: 'Lavender', hex: '#B57EDC', rgb: [181, 126, 220] },
    { name: 'Plum', hex: '#8B008B', rgb: [139, 0, 139] },
  ],
  neutrals: [
    { name: 'Clear', hex: '#F5F5F5', rgb: [245, 245, 245] },
    { name: 'Smoke', hex: '#708090', rgb: [112, 128, 144] },
    { name: 'Frost', hex: '#E0E0E0', rgb: [224, 224, 224] },
    { name: 'Charcoal', hex: '#36454F', rgb: [54, 69, 79] },
  ],
};

const GLASS_TEXTURES = {
  clear: { 
    name: 'Clear', 
    opacity: 0.1,
    pattern: 'none',
    description: 'Transparent glass with minimal texture'
  },
  cathedral: { 
    name: 'Cathedral', 
    opacity: 0.2,
    pattern: 'subtle',
    description: 'Lightly textured, semi-transparent'
  },
  opalescent: { 
    name: 'Opalescent', 
    opacity: 0.15,
    pattern: 'milky',
    description: 'Milky, semi-opaque with color variations'
  },
  streaky: { 
    name: 'Streaky', 
    opacity: 0.25,
    pattern: 'streaks',
    description: 'Streaks of color variation'
  },
  wispy: { 
    name: 'Wispy', 
    opacity: 0.3,
    pattern: 'wispy',
    description: 'Wispy white streaks through color'
  },
  textured: { 
    name: 'Textured', 
    opacity: 0.05,
    pattern: 'rough',
    description: 'Heavily textured surface'
  },
};

const LIGHTING_CONDITIONS = {
  bright: { name: 'Bright Sunlight', intensity: 1.0 },
  medium: { name: 'Cloudy Day', intensity: 0.7 },
  dim: { name: 'Evening Light', intensity: 0.4 },
  backlit: { name: 'Backlit', intensity: 0.9 },
};

const SHAPES = {
  square: { name: 'Square', path: 'M 0,0 L 100,0 L 100,100 L 0,100 Z' },
  rectangle: { name: 'Rectangle', path: 'M 0,0 L 150,0 L 150,100 L 0,100 Z' },
  diamond: { name: 'Diamond', path: 'M 50,0 L 100,50 L 50,100 L 0,50 Z' },
  triangle: { name: 'Triangle', path: 'M 50,0 L 100,100 L 0,100 Z' },
  hexagon: { name: 'Hexagon', path: 'M 30,0 L 70,0 L 100,50 L 70,100 L 30,100 L 0,50 Z' },
  circle: { name: 'Circle', path: 'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0' },
};

const BACKGROUND_IMAGES = {
  none: { name: 'None', url: null },
  sky: { name: 'Sky', url: 'https://images.unsplash.com/photo-1517483000871-1dbf64a6e1c6?w=1200&h=800&fit=crop' },
  forest: { name: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&h=800&fit=crop' },
  sunset: { name: 'Sunset', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1200&h=800&fit=crop' },
  garden: { name: 'Garden', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop' },
  ocean: { name: 'Ocean', url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=800&fit=crop' },
};

// Simple polygon-based piece renderer
const PolygonPiece = ({ piece, onClick, isSelected, lighting }) => {
  const patternId = `pattern-${piece.label}`;
  const lightedColor = applyLighting(piece.color, LIGHTING_CONDITIONS[lighting].intensity, piece.texture);
  
  // Convert points array to SVG polygon points string
  const pointsString = piece.points.map(p => `${p[0]},${p[1]}`).join(' ');
  
  return (
    <g 
      onClick={() => onClick(piece)}
      style={{ cursor: 'pointer' }}
      className={isSelected ? 'selected-piece' : ''}
    >
      <defs>
        <TexturePattern pattern={piece.texture.pattern} id={patternId} />
      </defs>
      <polygon
        points={pointsString}
        fill={lightedColor}
        stroke="#333"
        strokeWidth="2"
      />
      {piece.texture.pattern !== 'none' && (
        <polygon
          points={pointsString}
          fill={`url(#${patternId})`}
          stroke="none"
        />
      )}
    </g>
  );
};

// Helper to assign colors based on position hints
function assignColorsToPattern(pieces) {
  return pieces.map(piece => {
    let color;
    switch(piece.colorHint) {
      case 'center':
        color = GLASS_COLORS.yellows[0];
        break;
      case 'left':
      case 'top':
        color = GLASS_COLORS.blues[Math.floor(Math.random() * 2)];
        break;
      case 'right':
      case 'bottom':
        color = GLASS_COLORS.reds[Math.floor(Math.random() * 2)];
        break;
      case 'primary':
        color = GLASS_COLORS.blues[0];
        break;
      case 'secondary':
        color = GLASS_COLORS.purples[0];
        break;
      default:
        color = GLASS_COLORS.greens[Math.floor(Math.random() * 2)];
    }
    return {
      ...piece,
      color: color,
      texture: GLASS_TEXTURES.cathedral,
      id: `${piece.label}-${Date.now()}`
    };
  });
}

function applyLighting(color, intensity, texture) {
  const r = Math.round(color.rgb[0] * intensity);
  const g = Math.round(color.rgb[1] * intensity);
  const b = Math.round(color.rgb[2] * intensity);
  // For better color visibility, we'll use a minimum opacity
  const opacity = Math.max(1 - texture.opacity, 0.6);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Generate color variants (lighter and darker shades)
function generateColorVariants(baseColor) {
  const variants = [];
  const factors = [0.3, 0.6, 1, 1.3, 1.6];
  
  factors.forEach(factor => {
    const r = Math.min(255, Math.round(baseColor.rgb[0] * factor));
    const g = Math.min(255, Math.round(baseColor.rgb[1] * factor));
    const b = Math.min(255, Math.round(baseColor.rgb[2] * factor));
    
    variants.push({
      name: `${baseColor.name} ${factor < 1 ? 'Dark' : factor > 1 ? 'Light' : ''}`.trim(),
      hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
      rgb: [r, g, b]
    });
  });
  
  return variants;
}

// Get complementary colors
function getComplementaryColors(baseColor) {
  const allColors = Object.values(GLASS_COLORS).flat();
  const baseHue = rgbToHue(baseColor.rgb);
  
  // Find colors with complementary hues
  return allColors.filter(color => {
    const hue = rgbToHue(color.rgb);
    const hueDiff = Math.abs(hue - baseHue);
    // Complementary colors are ~180 degrees apart, analogous are ~30-60 degrees
    return (hueDiff > 150 && hueDiff < 210) || (hueDiff > 30 && hueDiff < 90);
  }).slice(0, 8);
}

function rgbToHue(rgb) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  
  return hue;
}

// Parse user prompt to determine pattern type
function parsePrompt(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('organic') || lowerPrompt.includes('cell') || lowerPrompt.includes('bubble')) {
    return 'voronoi';
  } else if (lowerPrompt.includes('triangle') || lowerPrompt.includes('triangular')) {
    return 'triangles';
  } else if (lowerPrompt.includes('hex') || lowerPrompt.includes('honeycomb')) {
    return 'hexagons';
  } else if (lowerPrompt.includes('grid') || lowerPrompt.includes('square')) {
    return 'grid';
  } else if (lowerPrompt.includes('diamond') || lowerPrompt.includes('rhombus')) {
    return 'diamonds';
  }
  
  // Default to voronoi for natural patterns
  return 'voronoi';
}

// Get color from hint
function getColorFromHint(hint) {
  const colorMap = {
    'red': GLASS_COLORS.reds[0],
    'rose': GLASS_COLORS.reds[2],
    'blue': GLASS_COLORS.blues[0],
    'green': GLASS_COLORS.greens[0],
    'yellow': GLASS_COLORS.yellows[0],
    'amber': GLASS_COLORS.yellows[1],
    'gold': GLASS_COLORS.yellows[1],
    'purple': GLASS_COLORS.purples[0],
    'charcoal': GLASS_COLORS.neutrals[3],
  };
  
  return colorMap[hint] || GLASS_COLORS.blues[0];
}

const TexturePattern = ({ pattern, id }) => {
  switch (pattern) {
    case 'subtle':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill="white" opacity="0.1"/>
          <circle cx="2" cy="2" r="0.5" fill="white" opacity="0.2"/>
        </pattern>
      );
    case 'milky':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="10" height="10">
          <rect width="10" height="10" fill="white" opacity="0.3"/>
          <circle cx="3" cy="3" r="2" fill="white" opacity="0.4"/>
          <circle cx="8" cy="8" r="1.5" fill="white" opacity="0.3"/>
        </pattern>
      );
    case 'streaks':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="20" height="100">
          <rect width="20" height="100" fill="transparent"/>
          <path d="M0,0 Q10,50 5,100" stroke="white" strokeWidth="3" fill="none" opacity="0.3"/>
          <path d="M10,0 Q15,30 12,100" stroke="white" strokeWidth="2" fill="none" opacity="0.2"/>
        </pattern>
      );
    case 'wispy':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="30" height="30">
          <rect width="30" height="30" fill="transparent"/>
          <circle cx="10" cy="10" r="8" fill="white" opacity="0.2" filter="blur(3px)"/>
          <circle cx="25" cy="20" r="5" fill="white" opacity="0.15" filter="blur(2px)"/>
        </pattern>
      );
    case 'rough':
      return (
        <pattern id={id} patternUnits="userSpaceOnUse" width="5" height="5">
          <rect width="5" height="5" fill="transparent"/>
          <rect x="0" y="0" width="2" height="2" fill="black" opacity="0.1"/>
          <rect x="3" y="2" width="2" height="2" fill="black" opacity="0.1"/>
          <rect x="1" y="3" width="2" height="2" fill="black" opacity="0.1"/>
        </pattern>
      );
    default:
      return null;
  }
};


// Enhanced Color Picker Component
const EnhancedColorPicker = ({ currentColor, onColorSelect, onClose }) => {
  const variants = generateColorVariants(currentColor);
  const complementary = getComplementaryColors(currentColor);
  
  return (
    <div className="enhanced-color-picker">
      <div className="picker-header">
        <h4>Choose Color</h4>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="color-section">
        <h5>Color Variants</h5>
        <div className="color-row">
          {variants.map((color, index) => (
            <button
              key={index}
              className="color-option"
              style={{ backgroundColor: color.hex }}
              onClick={() => onColorSelect(color)}
              title={color.name}
            />
          ))}
        </div>
      </div>
      
      <div className="color-section">
        <h5>Complementary Colors</h5>
        <div className="color-grid-small">
          {complementary.map((color, index) => (
            <button
              key={index}
              className="color-option"
              style={{ backgroundColor: color.hex }}
              onClick={() => onColorSelect(color)}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const DraggableShape = ({ shape, position, color, texture, isSelected, onClick, onDrag, lighting }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const patternId = `pattern-${shape.id}`;

  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      onDrag({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const lightedColor = applyLighting(color, LIGHTING_CONDITIONS[lighting].intensity, texture);

  return (
    <div
      className={`draggable-shape ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100">
        <defs>
          <TexturePattern pattern={texture.pattern} id={patternId} />
          <filter id={`blur-${shape.id}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
          </filter>
        </defs>
        <path
          d={SHAPES[shape.type].path}
          fill={lightedColor}
          stroke="#333"
          strokeWidth="2"
          filter={texture.pattern === 'rough' ? `url(#blur-${shape.id})` : 'none'}
        />
        {texture.pattern !== 'none' && (
          <path
            d={SHAPES[shape.type].path}
            fill={`url(#${patternId})`}
            stroke="none"
          />
        )}
      </svg>
    </div>
  );
};

const StainedGlassSimulator = () => {
  const [shapes, setShapes] = useState([]);
  const [selectedShapeId, setSelectedShapeId] = useState(null);
  const [selectedColor, setSelectedColor] = useState(GLASS_COLORS.reds[0]);
  const [selectedTexture, setSelectedTexture] = useState(GLASS_TEXTURES.cathedral);
  const [lighting, setLighting] = useState('bright');
  const [nextShapeType, setNextShapeType] = useState('square');
  const [backgroundImage, setBackgroundImage] = useState('sky');
  const [customBackground, setCustomBackground] = useState(null);
  const [mode, setMode] = useState('manual'); // 'manual' or 'design'
  const [userPrompt, setUserPrompt] = useState('');
  const [currentDesign, setCurrentDesign] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTexturePicker, setShowTexturePicker] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const workspaceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load available templates on mount
  React.useEffect(() => {
    loadAvailableTemplates();
  }, []);

  const loadAvailableTemplates = async () => {
    // List of templates to include
    const templates = [
      { name: 'sunflower_full', displayName: '🌻 Sunflower', description: 'Complete sunflower with stem' },
      { name: 'sunrise', displayName: '🌅 Sunrise', description: 'Colorful sunrise scene' }
    ];
    
    setAvailableTemplates(templates);
  };

  const loadTemplateSVG = async (templateName) => {
    try {
      const response = await fetch(`/template_svgs/${templateName}.svg`);
      const svgText = await response.text();
      const pieces = await parseSVGFile(svgText, true); // true to preserve colors
      if (pieces.length > 0) {
        // Check if pieces already have colors
        const hasColors = pieces.some(p => p.color);
        const designPieces = hasColors ? 
          pieces.map(piece => ({
            ...piece,
            texture: piece.texture || GLASS_TEXTURES.cathedral,
            id: `${piece.label}-${Date.now()}`
          })) :
          assignColorsToPattern(pieces);
        setCurrentDesign({
          type: templateName,
          viewBox: '0 0 400 400',
          pieces: designPieces
        });
      } else {
        alert(`No valid pieces found in ${templateName}.svg. This may be an embedded image rather than vector paths, which cannot be used for stained glass patterns.`);
      }
    } catch (error) {
      console.error(`Error loading ${templateName}:`, error);
      alert(`Failed to load ${templateName}.svg`);
    }
  };

  const generateDesign = () => {
    const patternType = parsePrompt(userPrompt);
    const template = PATTERN_TEMPLATES[patternType];
    
    if (template) {
      // Generate the pattern pieces
      const pieces = template.generator();
      
      // Assign colors and textures
      const designPieces = assignColorsToPattern(pieces);
      
      setCurrentDesign({
        type: patternType,
        viewBox: '0 0 400 400',
        pieces: designPieces
      });
      setMode('design');
    }
  };
  
  const handleSVGUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'image/svg+xml') {
      const text = await file.text();
      const pieces = await parseSVGFile(text);
      
      if (pieces.length > 0) {
        const designPieces = assignColorsToPattern(pieces);
        
        setCurrentDesign({
          type: 'custom',
          viewBox: '0 0 400 400',
          pieces: designPieces
        });
        setMode('design');
      } else {
        alert('No valid polygons found in the SVG file.');
      }
    }
  };

  const handlePieceClick = (piece) => {
    setSelectedPiece(piece);
    setShowColorPicker(true);
  };

  const updatePieceColor = (color) => {
    if (selectedPiece && currentDesign) {
      const updatedPieces = currentDesign.pieces.map(p => 
        p.label === selectedPiece.label ? { ...p, color } : p
      );
      setCurrentDesign({ ...currentDesign, pieces: updatedPieces });
      // Update selectedPiece reference
      setSelectedPiece({ ...selectedPiece, color });
    }
  };

  const updatePieceTexture = (texture) => {
    if (selectedPiece && currentDesign) {
      const updatedPieces = currentDesign.pieces.map(p => 
        p.label === selectedPiece.label ? { ...p, texture } : p
      );
      setCurrentDesign({ ...currentDesign, pieces: updatedPieces });
      // Update selectedPiece reference
      setSelectedPiece({ ...selectedPiece, texture });
    }
  };

  const convertDesignToShapes = () => {
    if (!currentDesign) return;
    
    // For now, we'll inform the user that complex designs need to stay in design mode
    alert('This design uses complex shapes that work best in Design Mode. You can still customize colors and textures by clicking on each piece!');
    
    // In a future update, we could convert paths to simpler shapes or export as SVG
    // For now, keep the design in design mode for proper display
  };

  const addShape = (shapeType) => {
    const newShape = {
      id: Date.now(),
      type: shapeType,
      position: { x: 50 + shapes.length * 30, y: 150 },
      color: selectedColor,
      texture: selectedTexture
    };
    setShapes([...shapes, newShape]);
  };

  const updateShapePosition = (id, newPosition) => {
    setShapes(shapes.map(shape => 
      shape.id === id ? { ...shape, position: newPosition } : shape
    ));
  };

  const updateShapeColor = (id, color) => {
    setShapes(shapes.map(shape => 
      shape.id === id ? { ...shape, color } : shape
    ));
  };

  const updateShapeTexture = (id, texture) => {
    setShapes(shapes.map(shape => 
      shape.id === id ? { ...shape, texture } : shape
    ));
  };

  const deleteShape = (id) => {
    setShapes(shapes.filter(shape => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  };

  const handleShapeClick = (id) => {
    if (selectedShapeId === id) {
      updateShapeColor(id, selectedColor);
      updateShapeTexture(id, selectedTexture);
    } else {
      setSelectedShapeId(id);
    }
  };

  const handleWorkspaceClick = () => {
    setSelectedShapeId(null);
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomBackground(e.target.result);
        setBackgroundImage('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const getBackgroundUrl = () => {
    if (backgroundImage === 'custom' && customBackground) {
      return customBackground;
    }
    return BACKGROUND_IMAGES[backgroundImage]?.url;
  };

  return (
    <div className="simulator-container">
      <div className="controls-panel">
        <div className="control-group">
          <h3>Design Mode</h3>
          <div className="mode-selector">
            <button 
              className={`mode-button ${mode === 'manual' ? 'active' : ''}`}
              onClick={() => setMode('manual')}
            >
              Manual Design
            </button>
            <button 
              className={`mode-button ${mode === 'design' ? 'active' : ''}`}
              onClick={() => setMode('design')}
            >
              Template Design
            </button>
          </div>
        </div>

        {mode === 'design' && (
          <>
            <div className="control-group">
              <h3>Describe Your Design</h3>
              <div className="prompt-input-group">
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., 'organic cells', 'triangles', 'honeycomb'"
                  className="prompt-input"
                  onKeyPress={(e) => e.key === 'Enter' && generateDesign()}
                />
                <button onClick={generateDesign} className="generate-button">
                  Generate
                </button>
              </div>
            </div>

            <div className="control-group">
              <h3>Built-in Designs</h3>
              <div className="template-buttons">
                {availableTemplates.map((template) => (
                  <button
                    key={template.name}
                    className="template-button"
                    onClick={() => loadTemplateSVG(template.name)}
                  >
                    <span>{template.displayName}</span>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <h3>Geometric Patterns</h3>
              <div className="pattern-buttons">
                {Object.entries(PATTERN_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    className="pattern-button"
                    onClick={() => {
                      const pieces = template.generator();
                      const designPieces = assignColorsToPattern(pieces);
                      setCurrentDesign({
                        type: key,
                        viewBox: '0 0 400 400',
                        pieces: designPieces
                      });
                    }}
                  >
                    <span>{template.name}</span>
                    <small>{template.description}</small>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="control-group">
              <h3>Upload Custom SVG</h3>
              <input
                type="file"
                accept=".svg"
                onChange={handleSVGUpload}
                className="svg-upload"
              />
              <p className="help-text">Upload an SVG with your own design</p>
            </div>
          </>
        )}

        {mode === 'manual' && (
          <>
            <div className="control-group">
              <h3>Add Shapes</h3>
              <div className="shape-buttons">
                {Object.entries(SHAPES).map(([key, shape]) => (
                  <button
                    key={key}
                    className={`shape-button ${nextShapeType === key ? 'selected' : ''}`}
                    onClick={() => {
                      setNextShapeType(key);
                      addShape(key);
                    }}
                  >
                    <svg width="40" height="40" viewBox="0 0 100 100">
                      <path
                        d={shape.path}
                        fill="rgba(255, 255, 255, 0.2)"
                        stroke="#fff"
                        strokeWidth="2"
                        transform="scale(0.4) translate(75, 75)"
                      />
                    </svg>
                    <span>{shape.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <h3>Glass Texture</h3>
              <p className="help-text">Select texture type for new pieces</p>
              <div className="texture-buttons">
                {Object.entries(GLASS_TEXTURES).map(([key, texture]) => (
                  <button
                    key={key}
                    className={`texture-button ${selectedTexture.name === texture.name ? 'selected' : ''}`}
                    onClick={() => setSelectedTexture(texture)}
                    title={texture.description}
                  >
                    <span className="texture-name">{texture.name}</span>
                    <span className="texture-opacity">{Math.round((1 - texture.opacity) * 100)}% opaque</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <h3>Select Color</h3>
              <p className="help-text">Click a shape to apply color & texture</p>
              <div className="color-grid">
                {Object.entries(GLASS_COLORS).map(([category, colors]) => (
                  <div key={category} className="color-category">
                    <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                    <div className="color-row">
                      {colors.map((color) => (
                        <button
                          key={color.name}
                          className={`color-swatch ${selectedColor.name === color.name ? 'selected' : ''}`}
                          style={{ backgroundColor: color.hex }}
                          onClick={() => setSelectedColor(color)}
                          title={color.name}
                        >
                          <span className="color-name">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="control-group">
          <h3>Background</h3>
          <div className="background-buttons">
            {Object.entries(BACKGROUND_IMAGES).map(([key, bg]) => (
              <button
                key={key}
                className={`background-button ${backgroundImage === key ? 'selected' : ''}`}
                onClick={() => setBackgroundImage(key)}
              >
                {bg.name}
              </button>
            ))}
            <button
              className={`background-button ${backgroundImage === 'custom' ? 'selected' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="control-group">
          <h3>Lighting Condition</h3>
          <div className="lighting-buttons">
            {Object.entries(LIGHTING_CONDITIONS).map(([key, value]) => (
              <button
                key={key}
                className={`lighting-button ${lighting === key ? 'selected' : ''}`}
                onClick={() => setLighting(key)}
              >
                {value.name}
              </button>
            ))}
          </div>
        </div>

        {selectedShapeId && (
          <div className="control-group">
            <button
              className="delete-button"
              onClick={() => deleteShape(selectedShapeId)}
            >
              Delete Selected Shape
            </button>
          </div>
        )}
      </div>

      <div className="workspace-panel">
        <h3>Workspace</h3>
        {mode === 'manual' ? (
          <p className="help-text">Drag shapes to arrange • Click shape to apply color & texture</p>
        ) : (
          <p className="help-text">Click on design pieces to customize colors</p>
        )}
        
        <div 
          className="workspace" 
          ref={workspaceRef}
          onClick={handleWorkspaceClick}
          style={{
            backgroundImage: getBackgroundUrl() ? `url(${getBackgroundUrl()})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {mode === 'design' && currentDesign ? (
            <svg width="100%" height="100%" viewBox={currentDesign.viewBox || "0 0 400 400"} style={{ position: 'absolute', top: 0, left: 0 }}>
              {currentDesign.pieces.map((piece, index) => (
                <PolygonPiece
                  key={index}
                  piece={piece}
                  onClick={handlePieceClick}
                  isSelected={selectedPiece?.label === piece.label}
                  lighting={lighting}
                />
              ))}
            </svg>
          ) : (
            shapes.map(shape => (
              <DraggableShape
                key={shape.id}
                shape={shape}
                position={shape.position}
                color={shape.color}
                texture={shape.texture}
                isSelected={selectedShapeId === shape.id}
                onClick={() => handleShapeClick(shape.id)}
                onDrag={(pos) => updateShapePosition(shape.id, pos)}
                lighting={lighting}
              />
            ))
          )}
        </div>
        
        <div className="lighting-info">
          Lighting: {LIGHTING_CONDITIONS[lighting].name} ({Math.round(LIGHTING_CONDITIONS[lighting].intensity * 100)}% intensity)
        </div>
      </div>

      {showColorPicker && selectedPiece && (
        <div className="picker-overlay" onClick={() => setShowColorPicker(false)}>
          <div className="picker-container" onClick={(e) => e.stopPropagation()}>
            <EnhancedColorPicker
              currentColor={selectedPiece.color}
              onColorSelect={(color) => {
                updatePieceColor(color);
                setShowColorPicker(false);
              }}
              onClose={() => setShowColorPicker(false)}
            />
            
            <div className="texture-selector">
              <h4>Select Texture</h4>
              <div className="texture-options">
                {Object.entries(GLASS_TEXTURES).map(([key, texture]) => (
                  <button
                    key={key}
                    className={`texture-option ${selectedPiece.texture.name === texture.name ? 'selected' : ''}`}
                    onClick={() => updatePieceTexture(texture)}
                  >
                    {texture.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StainedGlassSimulator;