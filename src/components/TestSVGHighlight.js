import React, { useState } from 'react';
import './PatternEditor/PatternEditor.css';

const TestSVGHighlight = () => {
  const [selectedPath, setSelectedPath] = useState(null);
  const [hoveredPath, setHoveredPath] = useState(null);

  const handlePathClick = (pathId) => {
    setSelectedPath(pathId === selectedPath ? null : pathId);
  };

  const applyHighlight = (element, type) => {
    if (!element) return;
    
    const originalStrokeWidth = element.getAttribute('data-original-stroke-width') || 
                               element.getAttribute('stroke-width') || '1';
    
    if (type === 'selected') {
      const newWidth = Math.max(parseFloat(originalStrokeWidth) * 10, 15);
      
      // Apply all highlighting techniques
      element.style.vectorEffect = 'non-scaling-stroke';
      element.setAttribute('stroke-width', newWidth.toString());
      element.style.strokeWidth = newWidth + 'px';
      element.style.stroke = '#ff0000';
      element.style.strokeOpacity = '1';
      element.style.filter = 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))';
      element.classList.add('highlighting-selected');
    } else if (type === 'hover') {
      const newWidth = Math.max(parseFloat(originalStrokeWidth) * 5, 8);
      
      element.style.vectorEffect = 'non-scaling-stroke';
      element.setAttribute('stroke-width', newWidth.toString());
      element.style.strokeWidth = newWidth + 'px';
      element.style.stroke = '#0080ff';
      element.style.strokeOpacity = '0.8';
      element.style.filter = 'drop-shadow(0 0 4px rgba(0, 128, 255, 0.6))';
      element.classList.add('highlighting-hover');
    }
  };

  const removeHighlight = (element) => {
    if (!element) return;
    
    const originalStrokeWidth = element.getAttribute('data-original-stroke-width') || '2';
    const originalStroke = element.getAttribute('data-original-stroke') || '#0080ff';
    
    element.setAttribute('stroke-width', originalStrokeWidth);
    element.setAttribute('stroke', originalStroke);
    element.style.strokeWidth = '';
    element.style.stroke = '';
    element.style.strokeOpacity = '';
    element.style.filter = '';
    element.style.vectorEffect = '';
    element.classList.remove('highlighting-selected', 'highlighting-hover');
  };

  React.useEffect(() => {
    // Apply highlighting based on state
    const paths = document.querySelectorAll('[data-test-path]');
    paths.forEach(path => {
      const pathId = path.getAttribute('data-test-path');
      
      // Store original values if not already stored
      if (!path.hasAttribute('data-original-stroke-width')) {
        path.setAttribute('data-original-stroke-width', path.getAttribute('stroke-width') || '2');
        path.setAttribute('data-original-stroke', path.getAttribute('stroke') || '#0080ff');
      }
      
      if (pathId === selectedPath) {
        applyHighlight(path, 'selected');
      } else if (pathId === hoveredPath) {
        applyHighlight(path, 'hover');
      } else {
        removeHighlight(path);
      }
    });
  }, [selectedPath, hoveredPath]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>SVG Stroke Highlighting Test</h1>
      <p>Click on shapes to select them. The highlighting should work equally well on both SVGs.</p>
      
      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        <div>
          <h2>Honeycomb Style (with transforms)</h2>
          <div className="svg-wrapper">
            <svg width="400" height="300" viewBox="0 0 400 300" style={{ border: '1px solid #ddd', background: '#f9f9f9' }}>
              <g>
                <path
                  data-test-path="hex1"
                  d="m 74.282223,522.54014 -54.386502,31.30257 -54.386505,-31.30257 0.08443,-62.75138 54.302078,-31.44881 54.302075,31.44881 z"
                  transform="translate(59.867713,138.67787) scale(0.5)"
                  fill="none"
                  stroke="#0080ff"
                  strokeWidth="3.2"
                  onClick={() => handlePathClick('hex1')}
                  onMouseEnter={() => setHoveredPath('hex1')}
                  onMouseLeave={() => setHoveredPath(null)}
                  style={{ cursor: 'pointer' }}
                />
                <path
                  data-test-path="hex2"
                  d="m 74.282223,522.54014 -54.386502,31.30257 -54.386505,-31.30257 0.08443,-62.75138 54.302078,-31.44881 54.302075,31.44881 z"
                  transform="translate(114.16978,44.623915) scale(0.5)"
                  fill="none"
                  stroke="#0080ff"
                  strokeWidth="3.2"
                  onClick={() => handlePathClick('hex2')}
                  onMouseEnter={() => setHoveredPath('hex2')}
                  onMouseLeave={() => setHoveredPath(null)}
                  style={{ cursor: 'pointer' }}
                />
                <path
                  data-test-path="hex3"
                  d="m 74.282223,522.54014 -54.386502,31.30257 -54.386505,-31.30257 0.08443,-62.75138 54.302078,-31.44881 54.302075,31.44881 z"
                  transform="translate(168.64072,138.67787) scale(0.5)"
                  fill="none"
                  stroke="#0080ff"
                  strokeWidth="3.2"
                  onClick={() => handlePathClick('hex3')}
                  onMouseEnter={() => setHoveredPath('hex3')}
                  onMouseLeave={() => setHoveredPath(null)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            </svg>
          </div>
        </div>
        
        <div>
          <h2>Sunrise Style (no transforms)</h2>
          <div className="svg-wrapper">
            <svg width="400" height="300" viewBox="-100 -100 400 300" style={{ border: '1px solid #ddd', background: '#f9f9f9' }}>
              <g>
                <path
                  data-test-path="sun1"
                  d="m -50,-50 h 100 v 100 h -100 z"
                  fill="#fdd31f"
                  fillOpacity="0.3"
                  stroke="#ff8000"
                  strokeWidth="2"
                  onClick={() => handlePathClick('sun1')}
                  onMouseEnter={() => setHoveredPath('sun1')}
                  onMouseLeave={() => setHoveredPath(null)}
                  style={{ cursor: 'pointer' }}
                />
                <path
                  data-test-path="sun2"
                  d="m 60,-50 h 100 v 100 h -100 z"
                  fill="#f57b20"
                  fillOpacity="0.3"
                  stroke="#ff0080"
                  strokeWidth="2"
                  onClick={() => handlePathClick('sun2')}
                  onMouseEnter={() => setHoveredPath('sun2')}
                  onMouseLeave={() => setHoveredPath(null)}
                  style={{ cursor: 'pointer' }}
                />
                <path
                  data-test-path="sun3"
                  d="m 5,60 h 100 v 80 h -100 z"
                  fill="#c38490"
                  fillOpacity="0.3"
                  stroke="#800080"
                  strokeWidth="2"
                  onClick={() => handlePathClick('sun3')}
                  onMouseEnter={() => setHoveredPath('sun3')}
                  onMouseLeave={() => setHoveredPath(null)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Solution Explanation:</h3>
        <ul>
          <li><strong>vector-effect: non-scaling-stroke</strong> - Ensures stroke width is not affected by transforms</li>
          <li><strong>Both setAttribute and style.strokeWidth</strong> - Double application for better compatibility</li>
          <li><strong>drop-shadow filter</strong> - Provides visible glow effect that works regardless of transforms</li>
          <li><strong>Explicit stroke color and opacity</strong> - Ensures consistent appearance</li>
          <li><strong>CSS classes</strong> - Additional styling hooks for complex cases</li>
        </ul>
        <p>Selected: {selectedPath || 'none'} | Hovered: {hoveredPath || 'none'}</p>
      </div>
    </div>
  );
};

export default TestSVGHighlight;