import React, { useState, useEffect, useRef, useCallback } from 'react';
import { parseSVGPieces } from '../../utils/svgParser';
import { applyHighlightFix, removeHighlightFix, setupSVGHighlighting } from '../../utils/svgHighlightFix';

const PatternViewer = ({ pattern, onBack }) => {
  const [pieces, setPieces] = useState([]);
  const [deletedPieces, setDeletedPieces] = useState(new Set());
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [mouseDown, setMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgContainerRef = useRef(null);
  const svgRef = useRef(null);

  const [modifiedSvgContent, setModifiedSvgContent] = useState('');
  
  useEffect(() => {
    if (pattern && pattern.svgContent) {
      const result = parseSVGPieces(pattern.svgContent, true);
      setPieces(result.pieces);
      setModifiedSvgContent(result.modifiedSvg);
      
      // Normalize size and fit to view after loading
      setTimeout(() => {
        normalizeSVGSize();
        fitToView();
        setupEventListeners(result.pieces);
      }, 100);
    }
  }, [pattern]);


  const setupEventListeners = (parsedPieces) => {
    if (svgContainerRef.current) {
      const svg = svgContainerRef.current.querySelector('svg');
      if (svg) {
        svgRef.current = svg;
        
        // Store original styles
        parsedPieces.forEach((piece, index) => {
          const element = svg.querySelector(`[data-piece-index="${index}"]`);
          if (element && !piece.isDecorative) {
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

  const normalizeSVGSize = () => {
    if (!svgContainerRef.current) return;
    
    const container = svgContainerRef.current;
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    // Get SVG viewBox or width/height
    const viewBox = svg.getAttribute('viewBox');
    let svgWidth, svgHeight;
    
    if (viewBox) {
      const [, , width, height] = viewBox.split(' ').map(parseFloat);
      svgWidth = width;
      svgHeight = height;
    } else {
      svgWidth = parseFloat(svg.getAttribute('width')) || 300;
      svgHeight = parseFloat(svg.getAttribute('height')) || 300;
    }
    
    // Target size similar to sunrise.svg (around 300-400 units)
    const targetSize = 350;
    const maxDimension = Math.max(svgWidth, svgHeight);
    
    // Calculate scale to normalize to target size
    const normalizeScale = targetSize / maxDimension;
    
    // Apply normalization scale to the SVG itself
    if (normalizeScale !== 1) {
      svg.style.transform = `scale(${normalizeScale})`;
      svg.style.transformOrigin = 'center center';
    }
  };

  const fitToView = () => {
    if (!svgContainerRef.current) return;
    
    const container = svgContainerRef.current;
    const svg = container.querySelector('svg');
    if (!svg) return;
    
    const containerRect = container.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    
    const scaleX = (containerRect.width - 100) / svgRect.width;
    const scaleY = (containerRect.height - 100) / svgRect.height;
    const scale = Math.min(scaleX, scaleY, 1);
    
    setZoom(scale);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleMouseDown = (e) => {
    // Don't interact if clicking on controls or panels
    if (e.target.closest('.zoom-controls') || 
        e.target.closest('.pieces-panel')) {
      return;
    }
    
    setMouseDown(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    
    // If clicking on a piece, don't start panning
    if (e.target.hasAttribute('data-piece-index')) {
      return;
    }
  };

  const handleMouseMove = (e) => {
    if (!mouseDown) return;
    
    // Calculate distance moved
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Start panning if moved more than threshold
    if (distance > 3 && !isPanning) {
      setIsPanning(true);
    }
    
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = (e) => {
    // If clicked on a piece and didn't pan, select it
    if (mouseDown && !isPanning && e.target.hasAttribute('data-piece-index')) {
      const pieceIndex = parseInt(e.target.getAttribute('data-piece-index'));
      handlePieceClick(pieceIndex);
    }
    
    // Reset states
    setMouseDown(false);
    setIsPanning(false);
  };

  return (
    <div className="pattern-viewer">
      <div className="viewer-layout">
        <div 
          className={`svg-container ${isPanning ? 'panning' : ''}`}
          ref={svgContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setMouseDown(false);
            setIsPanning(false);
          }}
        >
          <div className="zoom-controls">
            <button onClick={handleZoomIn} title="Zoom In">+</button>
            <button onClick={fitToView} title="Fit to View">⊡</button>
            <button onClick={handleZoomOut} title="Zoom Out">−</button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          </div>
          
          <div className="svg-wrapper">
            <div 
              className="svg-content"
              dangerouslySetInnerHTML={{ __html: modifiedSvgContent }}
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.2s',
                pointerEvents: 'auto'
              }}
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
