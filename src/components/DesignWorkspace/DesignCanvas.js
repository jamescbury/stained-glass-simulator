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
  onPiecesLoaded 
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
              
              console.log('Container size calculated:', {
                svgWidth,
                svgHeight,
                aspectRatio,
                containerWidth: Math.round(containerWidth),
                containerHeight: Math.round(containerHeight)
              });
            }
            
            // Make SVG responsive
            svg.style.width = '100%';
            svg.style.height = '100%';
            
            // Add click handlers to pieces
            result.pieces.forEach((piece, index) => {
              if (!piece.isDecorative) {
                const element = svg.querySelector(`[data-piece-index="${index}"]`);
                if (element) {
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
  }, [template]); // Only re-run when template changes, not onShapeSelect


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
      
      const shapeElement = svgRef.current.querySelector(`[data-piece-index="${shapeIndex}"]`);
      if (!shapeElement) return;
      
      const bbox = shapeElement.getBBox();
      
      // Create clip path from shape
      const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', `glass-clip-${shapeIndex}`);
      
      // Clone the shape for the clip path
      const clipShape = shapeElement.cloneNode(true);
      clipShape.removeAttribute('data-piece-index');
      clipShape.removeAttribute('style');
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
        
        // Calculate the diagonal of the bounding box to ensure coverage at any rotation
        const diagonal = Math.sqrt(bbox.width * bbox.width + bbox.height * bbox.height);
        
        // Make the image square with size equal to diagonal to ensure full coverage
        const size = diagonal * 1.2; // 20% extra for safety
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
        if (application.placement.rotation !== 0) {
          image.setAttribute('transform', 
            `rotate(${application.placement.rotation} ${centerX} ${centerY})`
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
  }, [appliedGlass, pieces]); // Add pieces dependency to ensure SVG is ready

  // Update visual appearance based on glass application
  useEffect(() => {
    if (!svgRef.current) return;

    pieces.forEach((piece, index) => {
      if (piece.isDecorative) return;
      
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
        
        // Highlight selected shape with blue, others black
        if (selectedShapeIndex === index) {
          element.style.stroke = '#0080ff';
          element.style.strokeWidth = '3px';
        } else {
          element.style.stroke = '#000000';
          element.style.strokeWidth = '2px';
        }
        
        // Ensure pointer events are always on
        element.style.pointerEvents = 'all';
      }
    });
  }, [pieces, appliedGlass, selectedShapeIndex]);

  const fitToView = () => {
    // Simply reset to 100% zoom (which is baseScale) and center
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    // Disable wheel zoom - only use controls
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.glass-placement-overlay')) return;
    if (e.target.hasAttribute('data-piece-index')) return;
    
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
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
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="svg-container" 
          style={{ 
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            transformOrigin: '0 0'
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
            onConfirm={(placement) => {
              onGlassApplied(selectedShapeIndex, {
                glassId: placementMode.glassId,
                glassData: placementMode.glassData,
                placement
              });
            }}
            onCancel={() => onShapeSelect(null)}
          />
        )}
      </div>

    </div>
  );
};

export default DesignCanvas;