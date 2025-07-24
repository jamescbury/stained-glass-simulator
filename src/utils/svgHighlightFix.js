// SVG Highlight Fix Utility
// This module provides functions to ensure SVG stroke highlighting works correctly
// with transformed elements

export const applyHighlightFix = (element, highlightType = 'selected') => {
  if (!element) return;
  
  // Store original values if not already stored
  if (!element.hasAttribute('data-original-stroke-width')) {
    element.setAttribute('data-original-stroke-width', element.getAttribute('stroke-width') || '1');
    element.setAttribute('data-original-stroke', element.getAttribute('stroke') || 'none');
    element.setAttribute('data-original-fill', element.getAttribute('fill') || 'none');
  }
  
  const originalStrokeWidth = parseFloat(element.getAttribute('data-original-stroke-width')) || 1;
  
  // Calculate new stroke width based on highlight type
  let newStrokeWidth;
  let strokeColor;
  let glowSize;
  let glowOpacity;
  
  switch (highlightType) {
    case 'selected':
      newStrokeWidth = Math.max(originalStrokeWidth * 10, 15);
      strokeColor = '#ff0000';
      glowSize = 8;
      glowOpacity = 0.8;
      break;
    case 'hover':
      newStrokeWidth = Math.max(originalStrokeWidth * 5, 8);
      strokeColor = '#0080ff';
      glowSize = 4;
      glowOpacity = 0.6;
      break;
    default:
      newStrokeWidth = originalStrokeWidth;
      strokeColor = element.getAttribute('data-original-stroke');
  }
  
  // Apply multiple techniques for maximum compatibility
  // 1. Set vector-effect to prevent transform scaling
  element.style.vectorEffect = 'non-scaling-stroke';
  
  // 2. Set stroke width using both attribute and style
  element.setAttribute('stroke-width', newStrokeWidth.toString());
  element.style.strokeWidth = newStrokeWidth + 'px';
  
  // 3. Set stroke color and opacity
  element.style.stroke = strokeColor;
  element.style.strokeOpacity = '1';
  
  // 4. Add drop-shadow for additional visibility
  if (highlightType !== 'none') {
    element.style.filter = `drop-shadow(0 0 ${glowSize}px rgba(${hexToRgb(strokeColor)}, ${glowOpacity}))`;
  }
  
  // 5. Ensure element is on top
  element.style.zIndex = highlightType === 'selected' ? '1000' : '999';
  
  // 6. Add CSS class for additional styling hooks
  element.classList.add(`highlighting-${highlightType}`);
};

export const removeHighlightFix = (element) => {
  if (!element) return;
  
  // Restore original values
  const originalStroke = element.getAttribute('data-original-stroke');
  const originalStrokeWidth = element.getAttribute('data-original-stroke-width') || '1';
  const originalFill = element.getAttribute('data-original-fill') || 'none';
  
  // If original stroke was 'none' or not set, use a default visible stroke
  // to ensure shapes remain visible
  const strokeToApply = (!originalStroke || originalStroke === 'none') ? '#000000' : originalStroke;
  
  element.setAttribute('stroke', strokeToApply);
  element.setAttribute('stroke-width', originalStrokeWidth);
  element.setAttribute('fill', originalFill);
  
  // Clear all style overrides
  element.style.vectorEffect = '';
  element.style.strokeWidth = '';
  element.style.stroke = '';
  element.style.strokeOpacity = '';
  element.style.filter = '';
  element.style.zIndex = '';
  
  // Remove CSS classes
  element.classList.remove('highlighting-selected', 'highlighting-hover');
};

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '255, 0, 0';
}

// Function to check if an element has a transform
export const hasTransform = (element) => {
  return element.hasAttribute('transform') || 
         (element.style.transform && element.style.transform !== 'none');
};

// Function to ensure all SVG elements in a container have proper highlighting setup
export const setupSVGHighlighting = (svgContainer) => {
  if (!svgContainer) return;
  
  // Find all SVG elements
  const svgElements = svgContainer.querySelectorAll('svg');
  
  svgElements.forEach(svg => {
    // Add the svg-wrapper class if not present
    const wrapper = svg.closest('.svg-wrapper');
    if (!wrapper) {
      svg.parentElement.classList.add('svg-wrapper');
    }
    
    // Ensure all path, polygon, rect, circle, ellipse elements have vector-effect
    const shapes = svg.querySelectorAll('path, polygon, rect, circle, ellipse');
    shapes.forEach(shape => {
      // Add vector-effect as a base style for all shapes
      if (hasTransform(shape)) {
        shape.style.vectorEffect = 'non-scaling-stroke';
      }
    });
  });
};

// Export a complete solution object
export const SVGHighlightSolution = {
  apply: applyHighlightFix,
  remove: removeHighlightFix,
  setup: setupSVGHighlighting,
  hasTransform
};