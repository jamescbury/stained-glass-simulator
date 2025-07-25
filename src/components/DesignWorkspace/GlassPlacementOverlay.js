import React, { useState, useEffect, useRef } from 'react';
import './GlassPlacementOverlay.css';

const GlassPlacementOverlay = ({ 
  piece, 
  pieceElement, 
  glassData, 
  zoom,
  pan,
  containerSize,
  svgContainer,
  rotation = 0
}) => {
  const [position] = useState({ x: 0, y: 0 }); // TODO: implement drag functionality
  const overlayRef = useRef(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    // Position overlay over the selected piece
    if (pieceElement && svgContainer) {
      // Get the shape's position on screen
      const shapeRect = pieceElement.getBoundingClientRect();
      const viewport = svgContainer.parentElement;
      const viewportRect = viewport.getBoundingClientRect();
      
      // Calculate position relative to the viewport
      const relativeX = shapeRect.left + shapeRect.width / 2 - viewportRect.left;
      const relativeY = shapeRect.top + shapeRect.height / 2 - viewportRect.top;
      
      setOverlayPosition({
        x: relativeX,
        y: relativeY,
        width: shapeRect.width,
        height: shapeRect.height
      });
      
      // Overlay position calculated
    }
  }, [pieceElement, zoom, pan, svgContainer]);

  return (
    /* Glass preview on the shape - no controls */
    <div 
      className="glass-placement-preview" 
      ref={overlayRef}
      style={{
        position: 'absolute',
        left: `${overlayPosition.x - overlayPosition.width / 2}px`,
        top: `${overlayPosition.y - overlayPosition.height / 2}px`,
        width: `${overlayPosition.width}px`,
        height: `${overlayPosition.height}px`,
        pointerEvents: 'none'
      }}
    >
      <div className="placement-preview" style={{ 
        overflow: 'hidden',
        borderRadius: '4px',
        width: '100%',
        height: '100%'
      }}>
        {glassData.imageUrl || glassData.imageData ? (
          <div 
            className="glass-texture-preview"
            style={{
              backgroundImage: `url(${glassData.imageData || glassData.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: `${Math.SQRT2 * 100}%`, // ~141% to cover diagonal
              height: `${Math.SQRT2 * 100}%`,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`
            }}
          />
        ) : (
          <div 
            className="glass-color-preview"
            style={{
              backgroundColor: glassData.primaryColor || '#ccc',
              width: '100%',
              height: '100%',
              transform: `rotate(${rotation}deg)`
            }}
          />
        )}
        
        {glassData.texture === 'streaky' && (
          <div 
            className="grain-direction-indicator"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className="grain-line" />
            <div className="grain-arrow">↕</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlassPlacementOverlay;