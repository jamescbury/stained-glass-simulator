import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseSVGPieces } from '../../utils/svgParser';
import { applyHighlightFix, removeHighlightFix, setupSVGHighlighting } from '../../utils/svgHighlightFix';

const PatternViewer = ({ pattern, onBack, onPatternModified }) => {
  const [pieces, setPieces] = useState([]);
  const [deletedPieces, setDeletedPieces] = useState(new Set());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const svgContainerRef = useRef(null);
  const svgRef = useRef(null);

  const [modifiedSvgContent, setModifiedSvgContent] = useState('');
  
  useEffect(() => {
    if (pattern && pattern.svgContent) {
      const result = parseSVGPieces(pattern.svgContent, true);
      setPieces(result.pieces);
      setModifiedSvgContent(result.modifiedSvg);
      
      
      // Setup event listeners after loading
      setTimeout(() => {
        setupEventListeners(result.pieces);
      }, 100);
    }
  }, [pattern]);


  const setupEventListeners = (parsedPieces) => {
    if (svgContainerRef.current) {
      const svg = svgContainerRef.current.querySelector('svg');
      if (svg) {
        svgRef.current = svg;
        
        // Ensure all SVG elements are visible
        svg.style.width = 'auto';
        svg.style.height = 'auto';
        
        // Store original styles
        parsedPieces.forEach((piece, index) => {
          const element = svg.querySelector(`[data-piece-index="${index}"]`);
          if (element) {
            // Ensure strokes are visible for all elements
            if (!element.getAttribute('stroke') || element.getAttribute('stroke') === 'none') {
              element.style.stroke = '#000000';
              element.style.strokeWidth = '2';
            }
            element.style.vectorEffect = 'non-scaling-stroke';
            
            if (!piece.isDecorative) {
              // Store original stroke and fill values
              element.setAttribute('data-original-stroke', element.getAttribute('stroke') || 'none');
              element.setAttribute('data-original-stroke-width', element.getAttribute('stroke-width') || '1');
              element.setAttribute('data-original-fill', element.getAttribute('fill') || 'none');
              element.setAttribute('data-original-fill-opacity', element.getAttribute('fill-opacity') || '1');
              
              // Make element interactive
              element.style.cursor = 'pointer';
              
              // Ensure element can be brought to front on interaction
              element.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                // Bring to front
                element.parentNode.appendChild(element);
              });
              
              element.addEventListener('mouseenter', () => setHoveredPiece(index));
              element.addEventListener('mouseleave', () => setHoveredPiece(null));
            }
          }
        });
      }
    }
  };


  const updateHighlighting = useCallback(() => {
    if (!svgRef.current) return;
    
    // Ensure SVG has proper highlighting setup
    setupSVGHighlighting(svgRef.current.parentElement);
    
    // Update all pieces directly
    pieces.forEach((piece, index) => {
      if (piece.isDecorative || deletedPieces.has(index)) return;
      
      const element = svgRef.current.querySelector(`[data-piece-index="${index}"]`);
      if (element) {
        if (selectedPiece === index) {
          applyHighlightFix(element, 'selected');
          console.log(`Applied highlight fix to piece ${index} (selected)`);
        } else if (hoveredPiece === index) {
          applyHighlightFix(element, 'hover');
        } else {
          removeHighlightFix(element);
        }
      }
    });
  }, [pieces, selectedPiece, hoveredPiece, deletedPieces]);

  useEffect(() => {
    // Update highlighting when selection changes
    if (svgRef.current && pieces.length > 0) {
      updateHighlighting();
    }
  }, [selectedPiece, hoveredPiece, pieces, deletedPieces, updateHighlighting]);

  const handlePieceClick = (pieceIndex) => {
    setSelectedPiece(pieceIndex === selectedPiece ? null : pieceIndex);
  };

  const handleDeletePiece = (pieceIndex, e) => {
    e.stopPropagation(); // Prevent selecting the piece
    
    // Add to deleted pieces set
    setDeletedPieces(prev => new Set([...prev, pieceIndex]));
    
    // Hide the element in the SVG
    if (svgRef.current) {
      const element = svgRef.current.querySelector(`[data-piece-index="${pieceIndex}"]`);
      if (element) {
        element.style.display = 'none';
      }
    }
    
    // Deselect if this piece was selected
    if (selectedPiece === pieceIndex) {
      setSelectedPiece(null);
    }
  };

  // Generate modified SVG content with deleted pieces removed
  const generateModifiedSVG = useCallback(() => {
    if (!svgRef.current || deletedPieces.size === 0) {
      return pattern.svgContent; // Return original if no changes
    }

    // Clone the SVG element
    const svgClone = svgRef.current.cloneNode(true);
    
    // Remove deleted pieces from the clone
    deletedPieces.forEach(index => {
      const element = svgClone.querySelector(`[data-piece-index="${index}"]`);
      if (element) {
        element.remove();
      }
    });

    // Remove data attributes we added for tracking
    const allElements = svgClone.querySelectorAll('[data-piece-index]');
    allElements.forEach(el => {
      el.removeAttribute('data-piece-index');
      el.removeAttribute('data-original-stroke');
      el.removeAttribute('data-original-stroke-width');
      el.removeAttribute('data-original-fill');
      el.removeAttribute('data-original-fill-opacity');
      // Clean up any inline styles we added
      el.style.cursor = '';
      el.style.vectorEffect = '';
      el.style.strokeWidth = '';
      el.style.stroke = '';
      el.style.strokeOpacity = '';
      el.style.filter = '';
      el.style.zIndex = '';
      el.classList.remove('highlighting-selected', 'highlighting-hover');
    });

    // Return the cleaned SVG as a string
    return svgClone.outerHTML;
  }, [deletedPieces, pattern.svgContent]);

  // Save modifications when component unmounts
  useEffect(() => {
    return () => {
      if (onPatternModified && deletedPieces.size > 0) {
        const modifiedSvg = generateModifiedSVG();
        onPatternModified(pattern.id, { svgContent: modifiedSvg });
      }
    };
  }, [generateModifiedSVG, onPatternModified, pattern.id, deletedPieces]);

  // Wrap onBack to save changes first
  const handleBackClick = useCallback(() => {
    if (onPatternModified && deletedPieces.size > 0) {
      const modifiedSvg = generateModifiedSVG();
      onPatternModified(pattern.id, { svgContent: modifiedSvg });
    }
    if (onBack) {
      onBack();
    }
  }, [onBack, onPatternModified, generateModifiedSVG, pattern.id, deletedPieces]);


  const fitToView = () => {
    // Simply reset to 100% zoom and center
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoom(prev => {
    const newZoom = Math.min(prev * 1.2, 5);
    return Math.round(newZoom * 100) / 100;
  });
  
  const handleZoomOut = () => setZoom(prev => {
    const newZoom = Math.max(prev / 1.2, 0.1);
    return Math.round(newZoom * 100) / 100;
  });

  const handleMouseDown = (e) => {
    if (e.target.closest('.zoom-controls')) return;
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

  return (
    <div className="pattern-viewer">
      <div className="viewer-layout">
        <div 
          className={`canvas-viewport ${isPanning ? 'panning' : ''}`}
          ref={svgContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsPanning(false)}
        >
          <div className="zoom-controls">
            <button onClick={handleZoomIn} title="Zoom In">+</button>
            <button onClick={fitToView} title="Fit to View">⊡</button>
            <button onClick={handleZoomOut} title="Zoom Out">−</button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          </div>
          
          <div className="svg-container" 
            style={{ 
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            <div 
              className="svg-content"
              dangerouslySetInnerHTML={{ __html: modifiedSvgContent }}
            />
          </div>
        </div>
        
        <div className="pieces-panel">
          <h3>Pattern Pieces ({pieces.filter((p, i) => !p.isDecorative && !deletedPieces.has(i)).length})</h3>
          <div className="pieces-list">
            {pieces.map((piece, index) => {
              if (piece.isDecorative || deletedPieces.has(index)) return null;
              
              return (
                <div
                  key={index}
                  className={`piece-item ${selectedPiece === index ? 'selected' : ''} ${hoveredPiece === index ? 'hovered' : ''}`}
                  onClick={() => handlePieceClick(index)}
                  onMouseEnter={() => setHoveredPiece(index)}
                  onMouseLeave={() => setHoveredPiece(null)}
                >
                  <div className="piece-number">#{pieces.filter((p, i) => !p.isDecorative && !deletedPieces.has(i) && i < index).length + 1}</div>
                  <div className="piece-details">
                    <div className="piece-type">shape</div>
                    {piece.attributes.fill && piece.attributes.fill !== 'none' && (
                      <div className="piece-color" style={{ backgroundColor: piece.attributes.fill }}></div>
                    )}
                    {piece.area && <div className="piece-area">Area: {piece.area.toFixed(0)}</div>}
                  </div>
                  <button
                    className="delete-piece-btn"
                    onClick={(e) => handleDeletePiece(index, e)}
                    title="Delete this shape"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
          
          <div className="viewer-info">
            <p>Click on shapes to select them</p>
            <p>If you have difficulty selecting shapes, check your SVG</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternViewer;
