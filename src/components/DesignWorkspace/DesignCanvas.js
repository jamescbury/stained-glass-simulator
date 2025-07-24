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
  onRemoveGlass 
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
                  // Ensure fill is visible for clicking
                  if (!element.getAttribute('fill') || element.getAttribute('fill') === 'none') {
                    element.setAttribute('fill', 'transparent');
                  }
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


  // Update visual appearance based on glass application
  useEffect(() => {
    if (!svgRef.current) return;

    pieces.forEach((piece, index) => {
      if (piece.isDecorative) return;
      
      const element = svgRef.current.querySelector(`[data-piece-index="${index}"]`);
      if (element) {
        // Apply glass if present
        const glassApplication = appliedGlass[index];
        if (glassApplication) {
          // For now, just show the primary color
          // Later we'll implement proper glass texture rendering
          element.style.fill = glassApplication.glassData.primaryColor || '#ccc';
          element.style.fillOpacity = '0.8';
        } else {
          // Keep transparent fill for clicking
          const originalFill = element.getAttribute('data-original-fill');
          if (!originalFill || originalFill === 'none') {
            element.style.fill = 'transparent';
          } else {
            element.style.fill = originalFill;
          }
          element.style.fillOpacity = '';
        }
        
        // Highlight selected shape
        if (selectedShapeIndex === index) {
          element.style.stroke = '#ff0000';
          element.style.strokeWidth = '3';
        } else {
          element.style.stroke = '#000000';
          element.style.strokeWidth = '1';
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

      {/* Shape Info Panel */}
      {selectedShapeIndex !== null && (
        <div className="shape-info-panel">
          <h4>Shape #{selectedShapeIndex + 1}</h4>
          {appliedGlass[selectedShapeIndex] ? (
            <>
              <p>Glass: {appliedGlass[selectedShapeIndex].glassData.name}</p>
              <button 
                className="remove-glass-btn"
                onClick={() => onRemoveGlass(selectedShapeIndex)}
              >
                Remove Glass
              </button>
            </>
          ) : (
            <p>No glass applied</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DesignCanvas;