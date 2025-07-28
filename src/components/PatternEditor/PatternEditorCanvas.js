import React, { useState } from 'react';
import DesignCanvas from '../DesignWorkspace/DesignCanvas';
import '../DesignWorkspace/DesignCanvas.css';
import './PatternEditorCanvas.css';

const PatternEditorCanvas = ({ 
  pattern, 
  onBack,
  onPatternModified
}) => {
  const [selectedPieceIndex, setSelectedPieceIndex] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [deletedPieces, setDeletedPieces] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pieceToDelete, setPieceToDelete] = useState(null);

  // Guard against missing pattern
  if (!pattern || !pattern.svgContent) {
    return (
      <div className="pattern-editor-empty">
        <p>No pattern selected</p>
        <button onClick={onBack}>Back to Gallery</button>
      </div>
    );
  }

  // Create a modified SVG content that excludes deleted pieces
  const getModifiedSvgContent = () => {
    if (!pattern || !pattern.svgContent || deletedPieces.size === 0) {
      return pattern?.svgContent || '';
    }
    
    // Get the current SVG content from the DesignCanvas
    const svgContainer = document.querySelector('.svg-content-wrapper');
    if (!svgContainer) {
      console.error('SVG container not found');
      return pattern.svgContent;
    }
    
    const svg = svgContainer.querySelector('svg');
    if (!svg) {
      console.error('SVG element not found');
      return pattern.svgContent;
    }
    
    // Clone the SVG to avoid modifying the displayed one
    const svgClone = svg.cloneNode(true);
    
    // Remove deleted pieces
    deletedPieces.forEach(index => {
      const elements = svgClone.querySelectorAll(`[data-piece-index="${index}"]`);
      elements.forEach(element => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    });
    
    // Clean up our custom attributes
    const allElements = svgClone.querySelectorAll('[data-piece-index]');
    allElements.forEach(el => {
      el.removeAttribute('data-piece-index');
      el.removeAttribute('data-original-fill');
      el.removeAttribute('data-original-stroke');
      el.removeAttribute('data-original-stroke-width');
      el.removeAttribute('data-original-fill-opacity');
      // Remove inline styles we added
      if (el.style.cursor) el.style.removeProperty('cursor');
      if (el.style.pointerEvents) el.style.removeProperty('pointer-events');
      if (el.style.vectorEffect) el.style.removeProperty('vector-effect');
      if (el.style.stroke) el.style.removeProperty('stroke');
      if (el.style.strokeWidth) el.style.removeProperty('stroke-width');
    });
    
    // Serialize
    const serializer = new XMLSerializer();
    let serialized = serializer.serializeToString(svgClone);
    
    // Ensure we have the XML declaration
    if (!serialized.startsWith('<?xml')) {
      serialized = '<?xml version="1.0" encoding="UTF-8"?>\n' + serialized;
    }
    
    return serialized;
  };

  const handlePieceSelect = (index) => {
    if (index !== null && deletedPieces.has(index)) return;
    setSelectedPieceIndex(index);
    
    // Auto-scroll to the selected shape in the list
    if (index !== null) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const shapeElement = document.querySelector(`.shape-item[data-shape-index="${index}"]`);
        if (shapeElement) {
          shapeElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest'  // Use 'nearest' instead of 'center' for better performance
          });
        }
      });
    }
  };

  const handleDeleteClick = (index) => {
    if (index !== null && !deletedPieces.has(index)) {
      setPieceToDelete(index);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (pieceToDelete !== null) {
      setDeletedPieces(prev => new Set([...prev, pieceToDelete]));
      setShowDeleteConfirm(false);
      setPieceToDelete(null);
      setSelectedPieceIndex(null);
    }
  };

  const handleSaveAndExit = async () => {
    if (deletedPieces.size > 0 && onPatternModified) {
      const modifiedSvgContent = getModifiedSvgContent();
      console.log('Saving modified pattern with', deletedPieces.size, 'deletions');
      console.log('Pattern ID:', pattern.id);
      console.log('Modified SVG length:', modifiedSvgContent.length);
      console.log('Deleted pieces:', Array.from(deletedPieces));
      
      // Call the modification handler and wait for it
      await onPatternModified(pattern.id, { svgContent: modifiedSvgContent });
      console.log('Pattern modification complete');
    }
    if (onBack) {
      onBack();
    }
  };

  const handlePiecesLoaded = (loadedPieces) => {
    setPieces(loadedPieces);
    // Removed unused editablePieces calculation
  };

  return (
    <div className="pattern-editor-canvas">
      <div className="editor-header">
        <button className="back-btn" onClick={handleSaveAndExit}>
          ← Back to Gallery
        </button>
        <h2>Editing: {pattern?.name}</h2>
        <div className="editor-actions">
          <span className="piece-count">
            {pieces.filter((p, i) => !p.isDecorative && !deletedPieces.has(i)).length} shapes
          </span>
        </div>
      </div>

      <div className="editor-layout">
        <DesignCanvas
          template={pattern}
          appliedGlass={{}} // No glass in template editor
          selectedShapeIndex={selectedPieceIndex}
          onShapeSelect={handlePieceSelect}
          placementMode={null} // No placement mode in template editor
          onGlassApplied={() => {}} // Not used in template editor
          onRemoveGlass={() => {}} // Not used in template editor
          onPiecesLoaded={handlePiecesLoaded}
          hiddenPieces={deletedPieces} // Pass deleted pieces to hide them
        />

        <div className="shapes-panel">
          <h3>Template Shapes ({pieces.filter((p, i) => !p.isDecorative && !deletedPieces.has(i)).length})</h3>
          <div className="shapes-list">
            {pieces.map((piece, index) => {
              if (piece.isDecorative || deletedPieces.has(index)) return null;
              
              const displayIndex = pieces.filter((p, i) => !p.isDecorative && !deletedPieces.has(i) && i < index).length + 1;
              
              return (
                <div
                  key={index}
                  className={`shape-item ${selectedPieceIndex === index ? 'selected' : ''}`}
                  data-shape-index={index}
                  onClick={() => handlePieceSelect(index)}
                >
                  <div className="shape-number">#{displayIndex}</div>
                  <div className="shape-info">
                    <div className="shape-type">Shape</div>
                    {piece.attributes?.fill && piece.attributes.fill !== 'none' && (
                      <div 
                        className="shape-color" 
                        style={{ backgroundColor: piece.attributes.fill }}
                      />
                    )}
                  </div>
                  <button
                    className="delete-shape-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(index);
                    }}
                    title="Delete this shape"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>

          {deletedPieces.size > 0 && (
            <div className="deleted-info">
              <p>{deletedPieces.size} shape{deletedPieces.size !== 1 ? 's' : ''} deleted</p>
              <button 
                className="undo-all-btn"
                onClick={() => {
                  setDeletedPieces(new Set());
                  setSelectedPieceIndex(null);
                }}
              >
                Undo All Deletions
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Delete Shape?</h3>
            <p>Are you sure you want to delete shape #{pieces.filter((p, i) => !p.isDecorative && !deletedPieces.has(i) && i < pieceToDelete).length + 1}?</p>
            <div className="confirm-actions">
              <button className="confirm-yes" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button className="confirm-no" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternEditorCanvas;