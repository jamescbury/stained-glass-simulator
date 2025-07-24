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
  onConfirm, 
  onCancel 
}) => {
  const [rotation, setRotation] = useState(0);
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
      
      console.log('Overlay position:', {
        shapeRect,
        viewportRect,
        relativeX,
        relativeY,
        width: shapeRect.width,
        height: shapeRect.height
      });
    }
  }, [pieceElement, zoom, pan, svgContainer]);

  const handleRotationChange = (e) => {
    setRotation(parseInt(e.target.value));
  };

  const handleConfirm = () => {
    onConfirm({
      rotation,
      position,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div 
      className="glass-placement-overlay" 
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
      <div className="placement-preview" style={{ pointerEvents: 'auto' }}>
        {glassData.imageUrl || glassData.imageData ? (
          <div 
            className="glass-texture-preview"
            style={{
              backgroundImage: `url(${glassData.imageData || glassData.imageUrl})`,
              transform: `rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`
            }}
          />
        ) : (
          <div 
            className="glass-color-preview"
            style={{
              backgroundColor: glassData.primaryColor || '#ccc',
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

      <div 
        className="placement-controls"
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '10px',
          pointerEvents: 'auto',
          scale: Math.min(1.2, Math.max(0.5, 1 / Math.sqrt(zoom))) // Scale controls inversely to zoom, but not too extreme
        }}
      >
        <div className="rotation-control">
          <label>Rotation: {rotation}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={handleRotationChange}
            className="rotation-slider"
          />
        </div>
        
        <div className="placement-actions">
          <button 
            className="confirm-btn"
            onClick={handleConfirm}
          >
            Apply Glass
          </button>
          <button 
            className="cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlassPlacementOverlay;