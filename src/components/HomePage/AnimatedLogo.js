import React, { useState, useEffect, useRef, useCallback } from 'react';
import { glassStorage } from '../../services/glassStorage';
import './AnimatedLogo.css';

const AnimatedLogo = () => {
  const [glassInventory, setGlassInventory] = useState([]);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const svgRef = useRef(null);
  const animationRef = useRef({
    currentShapeIndex: 0,
    timeoutId: null,
    shapeGlassMap: {} // Track glass assignments for linked shapes
  });

  // Color groups for shapes (using 1-based numbering, will convert to 0-based)
  const colorGroups = {
    bluesPurples: [3, 4, 7, 8, 10, 11, 12].map(n => n - 1), // Convert to 0-based: [2,3,6,7,9,10,11]
    yellowsReds: [9].map(n => n - 1), // Convert to 0-based: [8]
    greensBrowns: [1, 2, 5, 6].map(n => n - 1) // Convert to 0-based: [0,1,4,5]
  };

  // Shape groups that should use the same glass
  // Using 0-based indices
  const shapeGroups = {
    group1: [9, 7], // shapes 10 and 8 (1-based)
    group2: [6, 3]  // shapes 7 and 4 (1-based)
  };

  // Lighter/darker relationships (0-based indices)
  // Key is the darker shape, value is the lighter shape
  const darkerToLighterMap = {
    4: 5,  // shape 5 is darker, shape 6 is lighter
    1: 0   // shape 2 is darker, shape 1 is lighter
  };

  // Filter glass by color
  const getGlassByColorGroup = (groupName) => {
    const colorKeywords = {
      bluesPurples: ['blue', 'purple', 'violet', 'indigo', 'navy', 'cobalt', 'sapphire', 'azure'],
      yellowsReds: ['yellow', 'red', 'orange', 'amber', 'gold', 'crimson', 'scarlet', 'ruby', 'pink', 'cranberry'],
      greensBrowns: ['green', 'brown', 'olive', 'forest', 'emerald', 'jade', 'tan', 'bronze', 'copper']
    };

    const excludeKeywords = {
      yellowsReds: ['purple', 'violet', 'indigo', 'blue'], // Exclude these from yellow/red group
      bluesPurples: ['green', 'brown', 'olive'],
      greensBrowns: ['blue', 'purple', 'red']
    };

    const keywords = colorKeywords[groupName] || [];
    const excludes = excludeKeywords[groupName] || [];
    
    return glassInventory.filter(glass => {
      const name = String(glass.name || '').toLowerCase();
      const color = String(glass.primaryColor || '').toLowerCase();
      const texture = String(glass.texture || '').toLowerCase();
      
      // Check if it matches any keyword
      const matches = keywords.some(keyword => 
        name.includes(keyword) || color.includes(keyword) || texture.includes(keyword)
      );
      
      // Check if it contains any exclude words
      const excluded = excludes.some(keyword =>
        name.includes(keyword) || color.includes(keyword) || texture.includes(keyword)
      );
      
      return matches && !excluded;
    });
  };

  // Get lighter variants of glass in the same color family
  const getLighterGlass = (referenceGlass, availableGlass) => {
    const lightKeywords = ['light', 'pale', 'soft', 'pastel', 'white', 'clear', 'transparent'];
    return availableGlass.filter(glass => {
      const name = String(glass.name || '').toLowerCase();
      const texture = String(glass.texture || '').toLowerCase();
      return lightKeywords.some(keyword => name.includes(keyword) || texture.includes(keyword));
    });
  };

  // Check if this shape is part of a group
  const getShapeGroup = (shapeIndex) => {
    for (const [groupName, indices] of Object.entries(shapeGroups)) {
      if (indices.includes(shapeIndex)) {
        return { groupName, indices };
      }
    }
    return null;
  };

  useEffect(() => {
    // Load the SVG
    fetch(process.env.PUBLIC_URL + '/logo.svg')
      .then(response => response.text())
      .then(text => {
        if (svgRef.current) {
          svgRef.current.innerHTML = text;
          
          // Setup SVG for animation
          const svg = svgRef.current.querySelector('svg');
          const paths = svg.querySelectorAll('path');
          
          // Store original fills and add identifiers
          paths.forEach((path, index) => {
            path.setAttribute('data-shape-index', index);
            path.setAttribute('data-original-fill', path.getAttribute('fill') || '#cccccc');
            path.style.transition = 'opacity 0.5s ease';
          });
          
          setSvgLoaded(true);
        }
      });

    // Load glass inventory
    const loadGlass = async () => {
      const glass = await glassStorage.getAllGlass();
      setGlassInventory(glass);
    };
    loadGlass();

    // Cleanup
    return () => {
      const timeoutId = animationRef.current.timeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (svgLoaded && glassInventory.length > 0) {
      // Apply initial glass fills immediately
      applyInitialGlassFills();
      
      // Start animation after a delay
      animationRef.current.timeoutId = setTimeout(() => {
        startAnimation();
      }, 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgLoaded, glassInventory]);

  const applyInitialGlassFills = async () => {
    console.log('Applying initial glass fills...');
    if (!svgRef.current) return;
    
    // Apply random glass to all shapes immediately
    for (let i = 0; i < 12; i++) {
      const path = svgRef.current.querySelector(`path[data-shape-index="${i}"]`);
      if (path) {
        const colorGroup = getColorGroupForShape(i);
        let availableGlass = colorGroup ? getGlassByColorGroup(colorGroup) : glassInventory;
        if (availableGlass.length === 0) {
          availableGlass = glassInventory;
        }
        if (availableGlass.length > 0) {
          const glass = availableGlass[Math.floor(Math.random() * availableGlass.length)];
          const rotation = Math.floor(Math.random() * 8) * 45;
          // Apply immediately without animation
          await applyGlassToShape(path, i, glass, rotation, true);
        }
      }
    }
  };

  const startAnimation = () => {
    animationRef.current.currentShapeIndex = 0;
    if (!animationRef.current.shapeGlassMap) {
      animationRef.current.shapeGlassMap = {};
    }
    animateShape(0);
  };

  const getColorGroupForShape = (shapeIndex) => {
    for (const [groupName, indices] of Object.entries(colorGroups)) {
      if (indices.includes(shapeIndex)) {
        return groupName;
      }
    }
    return null;
  };

  const animateShape = async (shapeIndex) => {
    console.log(`Animating shape ${shapeIndex + 1} (index: ${shapeIndex})`);
    
    if (shapeIndex >= 12) {
      // Animation complete, reset after delay
      console.log('Animation complete, resetting...');
      animationRef.current.shapeGlassMap = {}; // Clear glass map for next cycle
      animationRef.current.timeoutId = setTimeout(() => {
        resetLogo();
      }, 3000);
      return;
    }

    // Get the shape path
    const path = svgRef.current?.querySelector(`path[data-shape-index="${shapeIndex}"]`);
    if (!path) {
      console.log('Path not found for index:', shapeIndex);
      // Move to next shape even if this one isn't found
      animationRef.current.timeoutId = setTimeout(() => {
        animateShape(shapeIndex + 1);
      }, 100);
      return;
    }

    // Check if this shape is part of a group
    const shapeGroup = getShapeGroup(shapeIndex);
    let selectedGlass = null;
    let selectedRotation = null;

    if (shapeGroup && animationRef.current.shapeGlassMap && animationRef.current.shapeGlassMap[shapeGroup.groupName]) {
      // Use the same glass as the group
      selectedGlass = animationRef.current.shapeGlassMap[shapeGroup.groupName].glass;
      selectedRotation = animationRef.current.shapeGlassMap[shapeGroup.groupName].rotation;
      
      console.log(`Shape ${shapeIndex + 1} is part of ${shapeGroup.groupName}, using same glass as group`);
      
      // Apply the same glass immediately
      await applyGlassToShape(path, shapeIndex, selectedGlass, selectedRotation, true);
    } else {
      // Get appropriate glass for this shape's color group
      const colorGroup = getColorGroupForShape(shapeIndex);
      let availableGlass = colorGroup ? getGlassByColorGroup(colorGroup) : glassInventory;
      
      if (availableGlass.length === 0) {
        console.log('No glass available for color group:', colorGroup, '- using all glass');
        availableGlass = glassInventory;
      }

      // Check if this shape should be lighter (it's the value in the map)
      const isLighterShape = Object.values(darkerToLighterMap).includes(shapeIndex);
      
      if (isLighterShape) {
        // Find which shape this should be lighter than
        const darkerShapeIndex = Object.keys(darkerToLighterMap).find(
          key => darkerToLighterMap[key] === shapeIndex
        );
        
        if (darkerShapeIndex && animationRef.current.shapeGlassMap && animationRef.current.shapeGlassMap[`shape_${darkerShapeIndex}`]) {
          // Filter for lighter glass
          const lighterOptions = getLighterGlass(
            animationRef.current.shapeGlassMap[`shape_${darkerShapeIndex}`].glass, 
            availableGlass
          );
          if (lighterOptions.length > 0) {
            availableGlass = lighterOptions;
          }
        }
      }

      // Try exactly 3 different glass options
      for (let i = 0; i < 3; i++) {
        const glass = availableGlass[Math.floor(Math.random() * availableGlass.length)];
        const rotation = Math.floor(Math.random() * 8) * 45;
        await applyGlassToShape(path, shapeIndex, glass, rotation, i === 2);
        
        if (i === 2) {
          // Store the final selection
          selectedGlass = glass;
          selectedRotation = rotation;
        }
        
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }

      // Store glass selection for this shape
      if (!animationRef.current.shapeGlassMap) {
        animationRef.current.shapeGlassMap = {};
      }
      animationRef.current.shapeGlassMap[`shape_${shapeIndex}`] = { glass: selectedGlass, rotation: selectedRotation };
      
      // If this shape is part of a group, store it for the group too
      if (shapeGroup) {
        console.log(`Shape ${shapeIndex + 1} is first in ${shapeGroup.groupName}, storing glass for group`);
        animationRef.current.shapeGlassMap[shapeGroup.groupName] = { glass: selectedGlass, rotation: selectedRotation };
      }
    }

    // Move to next shape
    animationRef.current.currentShapeIndex = shapeIndex + 1;
    animationRef.current.timeoutId = setTimeout(() => {
      animateShape(shapeIndex + 1);
    }, 300);
  };

  const applyGlassToShape = async (path, shapeIndex, glass, rotation, isFinal) => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;
    
    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    const patternId = `pattern-${shapeIndex}-${Date.now()}`;
    
    // Get path bounds to scale pattern appropriately
    const bbox = path.getBBox();
    // Make pattern much larger to prevent tiling
    const patternSize = Math.max(bbox.width, bbox.height) * 2;
    
    // Create pattern
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', patternSize);
    pattern.setAttribute('height', patternSize);
    // Center the pattern on the shape
    pattern.setAttribute('x', bbox.x - (patternSize - bbox.width) / 2);
    pattern.setAttribute('y', bbox.y - (patternSize - bbox.height) / 2);
    
    // Apply rotation if needed
    if (rotation > 0) {
      pattern.setAttribute('patternTransform', `rotate(${rotation} ${bbox.x + bbox.width/2} ${bbox.y + bbox.height/2})`);
    }

    // Create image
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    const imageUrl = glass.imageUrl || glass.image || glass.imageData;
    
    if (!imageUrl) {
      console.error('No image URL found for glass:', glass);
      return;
    }
    
    // Set image source and load it - scale to fill entire pattern
    image.setAttribute('width', patternSize);
    image.setAttribute('height', patternSize);
    image.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    image.setAttribute('href', imageUrl);
    
    // Add to pattern immediately
    pattern.appendChild(image);
    defs.appendChild(pattern);

    // Apply fill with simple fade
    path.style.opacity = '0.5';
    path.style.fill = `url(#${patternId})`;
    
    // Wait a bit for the image to load, then fade in
    await new Promise(resolve => setTimeout(resolve, 100));
    path.style.opacity = '1';

    // Clean up old patterns if not final
    if (!isFinal) {
      setTimeout(() => {
        try {
          pattern.remove();
        } catch (e) {
          console.error('Error removing pattern:', e);
        }
      }, 800);
    }
  };

  const resetLogo = () => {
    console.log('Resetting logo...');
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;

    // Don't reset fills - keep the glass patterns visible
    // Just clean up excess patterns to prevent memory buildup
    const defs = svg.querySelector('defs');
    if (defs) {
      // Keep only the most recent pattern for each shape
      const patternsByShape = {};
      const patterns = defs.querySelectorAll('pattern');
      
      patterns.forEach(p => {
        const match = p.id.match(/pattern-(\d+)-(\d+)/);
        if (match) {
          const shapeIndex = match[1];
          const timestamp = parseInt(match[2]);
          if (!patternsByShape[shapeIndex] || timestamp > patternsByShape[shapeIndex].timestamp) {
            patternsByShape[shapeIndex] = { pattern: p, timestamp };
          }
        }
      });
      
      // Remove all patterns except the most recent for each shape
      patterns.forEach(p => {
        const isKept = Object.values(patternsByShape).some(entry => entry.pattern === p);
        if (!isKept) {
          p.remove();
        }
      });
    }

    // Restart animation - continue filling shapes
    animationRef.current.timeoutId = setTimeout(() => {
      startAnimation();
    }, 2000);
  };

  return (
    <div className="animated-logo-container">
      <div ref={svgRef} className="animated-logo" />
    </div>
  );
};

export default AnimatedLogo;