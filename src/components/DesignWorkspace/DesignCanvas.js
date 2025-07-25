import React, { useState, useEffect, useRef } from 'react';
import { parseSVGPieces } from '../../utils/svgParser';
import GlassPlacementOverlay from './GlassPlacementOverlay';
import './DesignCanvas.css';

const DesignCanvas = ({ 
  template, 
  appliedGlass, 
  selectedShapeIndex, 
  onShapeSelect,
  placementMode,
  onGlassApplied,
  onRemoveGlass,
  onPiecesLoaded,
  hiddenPieces = new Set(),
  glassRotation = 0
}) => {
  const [pieces, setPieces] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const svgContainerRef = useRef(null);
  const svgRef = useRef(null);
  const [modifiedSvgContent, setModifiedSvgContent] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 400, height: 400 });
  const onShapeSelectRef = useRef(onShapeSelect);
  
  // Keep ref up to date
  useEffect(() => {
    onShapeSelectRef.current = onShapeSelect;
  }, [onShapeSelect]);

  useEffect(() => {
    if (template && template.svgContent) {
      // Parse and modify the SVG content
      let modifiedContent = template.svgContent;
      
      // Remove width and height attributes to allow viewBox scaling
      const parser = new DOMParser();
      const doc = parser.parseFromString(modifiedContent, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (svgElement) {
        // Remove width/height attributes so SVG scales with viewBox
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        
        // Ensure we have a viewBox
        if (!svgElement.hasAttribute('viewBox')) {
          // If no viewBox, create one from width/height
          const width = parseFloat(svgElement.getAttribute('width')) || 100;
          const height = parseFloat(svgElement.getAttribute('height')) || 100;
          svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        
        modifiedContent = new XMLSerializer().serializeToString(doc);
      }
      
      const result = parseSVGPieces(modifiedContent, true);
      setPieces(result.pieces);
      setModifiedSvgContent(result.modifiedSvg);
      
      // Notify parent component about loaded pieces
      if (onPiecesLoaded) {
        onPiecesLoaded(result.pieces);
      }
      
      // Reset zoom and pan when template changes
      setZoom(1);
      setPan({ x: 0, y: 0 });
      
      // Setup after loading
      setTimeout(() => {
        if (svgContainerRef.current) {
          const svg = svgContainerRef.current.querySelector('svg');
          if (svg) {
            svgRef.current = svg;
            
            // Calculate container size based on viewport and SVG aspect ratio
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
              const [, , svgWidth, svgHeight] = viewBox.split(' ').map(parseFloat);
              const aspectRatio = svgWidth / svgHeight;
              
              // Get viewport dimensions
              const viewport = svgContainerRef.current;
              const viewportRect = viewport.getBoundingClientRect();
              const padding = 80; // Padding around SVG
              
              const maxWidth = viewportRect.width - padding;
              const maxHeight = viewportRect.height - padding;
              
              let containerWidth, containerHeight;
              
              // Calculate dimensions maintaining aspect ratio
              if (maxWidth / maxHeight > aspectRatio) {
                // Height constrained
                containerHeight = maxHeight;
                containerWidth = containerHeight * aspectRatio;
              } else {
                // Width constrained
                containerWidth = maxWidth;
                containerHeight = containerWidth / aspectRatio;
              }
              
              setContainerSize({
                width: Math.round(containerWidth),
                height: Math.round(containerHeight)
              });
              
              // Container size calculated
            }
            
            // Make SVG responsive
            svg.style.width = '100%';
            svg.style.height = '100%';
            
            // Add click handlers to pieces
            result.pieces.forEach((piece, index) => {
              if (!piece.isDecorative) {
                const element = svg.querySelector(`[data-piece-index="${index}"]`);
                if (element) {
                  // Visibility will be handled by separate effect
                  
                  // Store original fill if not already stored
                  if (!element.hasAttribute('data-original-fill')) {
                    element.setAttribute('data-original-fill', element.getAttribute('fill') || 'none');
                  }
                  
                  element.style.cursor = 'pointer';
                  element.style.pointerEvents = 'all';
                  element.style.vectorEffect = 'non-scaling-stroke';
                  
                  // Ensure fill is visible for clicking
                  if (!element.getAttribute('fill') || element.getAttribute('fill') === 'none') {
                    element.setAttribute('fill', 'transparent');
                  }
                  
                  // Set initial stroke to black
                  element.style.stroke = '#000000';
                  element.style.strokeWidth = '2px';
                  element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onShapeSelectRef.current(index);
                  });
                }
              }
            });
          }
        }
      }, 100);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.svgContent]); // Only re-run when SVG content actually changes

  // Handle piece visibility changes
  useEffect(() => {
    if (!svgRef.current) return;
    
    pieces.forEach((piece, index) => {
      if (!piece.isDecorative) {
        const element = svgRef.current.querySelector(`[data-piece-index="${index}"]`);
        if (element) {
          element.style.display = hiddenPieces.has(index) ? 'none' : 'block';
        }
      }
    });
  }, [pieces, hiddenPieces]);

  // Create glass rendering with clip paths
  useEffect(() => {
    if (!svgRef.current) return;

    // Get or create defs element
    let defs = svgRef.current.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgRef.current.insertBefore(defs, svgRef.current.firstChild);
    }

    // Clear existing clip paths and glass groups
    const existingClips = defs.querySelectorAll('clipPath[id^="glass-clip-"]');
    existingClips.forEach(c => c.remove());
    
    const existingGlass = svgRef.current.querySelectorAll('g[id^="glass-group-"]');
    existingGlass.forEach(g => g.remove());

    // Create glass renders for each applied piece
    Object.entries(appliedGlass).forEach(([shapeIndex, application]) => {
      const index = parseInt(shapeIndex);
      if (hiddenPieces.has(index)) return;
      
      const shapeElement = svgRef.current.querySelector(`[data-piece-index="${shapeIndex}"]`);
      if (!shapeElement) return;
      
      const bbox = shapeElement.getBBox();
      
      // Check if this shape has no fill (stroke-only)
      const hasStrokeOnly = shapeElement.style.fill === 'none' || 
                           shapeElement.getAttribute('fill') === 'none' ||
                           (shapeElement.getAttribute('style') && shapeElement.getAttribute('style').includes('fill:none'));
      
      // Create clip path from shape
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', `glass-clip-${shapeIndex}`);
      // Use userSpaceOnUse to ensure clip path uses same coordinate system as the content
      clipPath.setAttribute('clipPathUnits', 'userSpaceOnUse');
      
      // Create a new shape element for the clip path to avoid style conflicts
      let clipShape;
      const tagName = shapeElement.tagName.toLowerCase();
      
      if (tagName === 'path') {
        clipShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        clipShape.setAttribute('d', shapeElement.getAttribute('d'));
      } else if (tagName === 'polygon') {
        clipShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        clipShape.setAttribute('points', shapeElement.getAttribute('points'));
      } else if (tagName === 'rect') {
        clipShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        ['x', 'y', 'width', 'height'].forEach(attr => {
          if (shapeElement.hasAttribute(attr)) {
            clipShape.setAttribute(attr, shapeElement.getAttribute(attr));
          }
        });
      } else if (tagName === 'circle') {
        clipShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ['cx', 'cy', 'r'].forEach(attr => {
          if (shapeElement.hasAttribute(attr)) {
            clipShape.setAttribute(attr, shapeElement.getAttribute(attr));
          }
        });
      } else {
        // Fallback: clone the element
        clipShape = shapeElement.cloneNode(true);
        clipShape.removeAttribute('data-piece-index');
        clipShape.removeAttribute('style');
        clipShape.removeAttribute('class');
      }
      
      // Set fill for clipping - use attribute not style to ensure it works
      clipShape.setAttribute('fill', '#000');
      clipShape.setAttribute('stroke', 'none');
      
      // Set fill-rule to ensure proper filling
      // If the original has fill-rule, preserve it; otherwise use nonzero
      if (shapeElement.hasAttribute('fill-rule')) {
        clipShape.setAttribute('fill-rule', shapeElement.getAttribute('fill-rule'));
      } else {
        clipShape.setAttribute('fill-rule', 'nonzero');
      }
      
      // Apply transforms if present
      if (shapeElement.hasAttribute('transform')) {
        clipShape.setAttribute('transform', shapeElement.getAttribute('transform'));
      }
      
      clipPath.appendChild(clipShape);
      defs.appendChild(clipPath);
      
      // Create a group for the glass
      const glassGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      glassGroup.setAttribute('id', `glass-group-${shapeIndex}`);
      glassGroup.setAttribute('clip-path', `url(#glass-clip-${shapeIndex})`);
      
      if (application.glassData.imageUrl || application.glassData.imageData) {
        // Create image element
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', application.glassData.imageData || application.glassData.imageUrl);
        
        // Calculate size based on shape's bounding box
        // Use diagonal to ensure full coverage at any rotation angle
        const rotation = application.placement.rotation || 0;
        
        // Calculate the diagonal of the bounding box
        // This ensures the image covers the shape even when rotated 45 degrees
        const diagonal = Math.sqrt(bbox.width * bbox.width + bbox.height * bbox.height);
        const padding = 20; // Add padding to ensure edges are covered
        const size = diagonal + padding;
        
        // Center the square image on the shape
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        const x = centerX - size / 2;
        const y = centerY - size / 2;
        
        image.setAttribute('x', x);
        image.setAttribute('y', y);
        image.setAttribute('width', size);
        image.setAttribute('height', size);
        image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        
        // Apply rotation around shape center
        if (rotation !== 0) {
          image.setAttribute('transform', 
            `rotate(${rotation} ${centerX} ${centerY})`
          );
        }
        
        glassGroup.appendChild(image);
      } else {
        // Create a filled rectangle for solid color glass
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', bbox.x);
        rect.setAttribute('y', bbox.y);
        rect.setAttribute('width', bbox.width);
        rect.setAttribute('height', bbox.height);
        rect.setAttribute('fill', application.glassData.primaryColor || '#cccccc');
        rect.setAttribute('fill-opacity', '0.9');
        
        glassGroup.appendChild(rect);
      }
      
      // Insert the glass group before the shape (so it renders behind)
      shapeElement.parentNode.insertBefore(glassGroup, shapeElement);
    });
  }, [appliedGlass, pieces, hiddenPieces]); // Add dependencies to ensure SVG is ready

  // Update visual appearance based on glass application
  useEffect(() => {
    if (!svgRef.current) return;

    pieces.forEach((piece, index) => {
      if (piece.isDecorative || hiddenPieces.has(index)) return;
      
      const element = svgRef.current.querySelector(`[data-piece-index="${index}"]`);
      if (element) {
        // Always keep shape transparent or with original fill for clicking
        const glassApplication = appliedGlass[index];
        const originalFill = element.getAttribute('data-original-fill');
        
        if (!originalFill || originalFill === 'none') {
          element.setAttribute('fill', 'transparent');
        } else {
          element.setAttribute('fill', originalFill);
        }
        
        // The actual glass rendering is handled by the clip path approach
        if (glassApplication) {
          element.setAttribute('fill-opacity', '0.1'); // Very subtle to show shape boundary
        } else {
          element.removeAttribute('fill-opacity');
        }
        
        // Ensure strokes scale properly
        element.style.vectorEffect = 'non-scaling-stroke';
        
        // Highlight selected shape with enhanced visual feedback
        if (selectedShapeIndex === index) {
          element.style.stroke = '#0080ff';
          element.style.strokeWidth = '4px';
          element.style.filter = 'drop-shadow(0 0 8px rgba(0, 128, 255, 0.6))';
          element.classList.add('selected-piece');
        } else {
          element.style.stroke = '#000000';
          element.style.strokeWidth = '2px';
          element.style.filter = '';
          element.classList.remove('selected-piece');
        }
        
        // Ensure pointer events are always on
        element.style.pointerEvents = 'all';
      }
    });
  }, [pieces, appliedGlass, selectedShapeIndex, hiddenPieces]);

  const fitToView = () => {
    // Simply reset to 100% zoom (which is baseScale) and center
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom is disabled - zoom only via buttons

  const handleMouseDown = (e) => {
    // Mouse down event
    
    // Don't pan if clicking on overlay
    if (e.target.closest('.glass-placement-preview') || e.target.closest('.placement-controls-fixed')) return;
    
    // Don't pan if clicking on a shape piece
    if (e.target.hasAttribute('data-piece-index')) return;
    
    // Start panning for all other clicks
    // Starting pan
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoomIn = () => setZoom(prev => {
    const newZoom = Math.min(prev * 1.2, 5);
    return Math.round(newZoom * 100) / 100; // Round to 2 decimal places
  });
  
  const handleZoomOut = () => setZoom(prev => {
    const newZoom = Math.max(prev / 1.2, 0.1);
    return Math.round(newZoom * 100) / 100; // Round to 2 decimal places
  });

  return (
    <div className="design-canvas">
      <div className="canvas-controls">
        <button onClick={handleZoomOut} title="Zoom Out">−</button>
        <button onClick={fitToView} title="Reset to Fit">⊡</button>
        <button onClick={handleZoomIn} title="Zoom In">+</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
      </div>

      <div 
        className={`canvas-viewport ${isPanning ? 'panning' : ''}`}
        ref={svgContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="svg-container" 
          style={{ 
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        >
          <div 
            className="svg-content-wrapper"
            style={{
              width: `${containerSize.width}px`,
              height: `${containerSize.height}px`,
              position: 'relative'
            }}
            dangerouslySetInnerHTML={{ __html: modifiedSvgContent }} 
          />
        </div>
        
        {/* Glass Placement Overlay - Outside svg-container to avoid transform issues */}
        {placementMode && selectedShapeIndex !== null && (
          <GlassPlacementOverlay
            piece={pieces[selectedShapeIndex]}
            pieceElement={svgRef.current?.querySelector(`[data-piece-index="${selectedShapeIndex}"]`)}
            glassData={placementMode.glassData}
            zoom={zoom}
            pan={pan}
            containerSize={containerSize}
            svgContainer={svgContainerRef.current?.querySelector('.svg-container')}
            rotation={glassRotation}
          />
        )}
      </div>

    </div>
  );
};

export default DesignCanvas;