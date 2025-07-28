import React, { useState, useRef, useEffect } from 'react';
import GlassCard from './GlassCard';
import './GlassCoverflow.css';

const GlassCoverflow = ({ glassItems, onGlassSelect, selectedGlass, onEdit, onDelete }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  useEffect(() => {
    // Find the index of selected glass if it exists
    if (selectedGlass) {
      const index = glassItems.findIndex(glass => glass.id === selectedGlass.id);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  }, [selectedGlass, glassItems]);

  const handlePrevious = () => {
    setActiveIndex((prevIndex) => {
      return prevIndex === 0 ? glassItems.length - 1 : prevIndex - 1;
    });
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => {
      return prevIndex === glassItems.length - 1 ? 0 : prevIndex + 1;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setCurrentX(deltaX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Determine swipe direction
    if (currentX > 50) {
      handlePrevious();
    } else if (currentX < -50) {
      handleNext();
    }
    
    setCurrentX(0);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    setCurrentX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (currentX > 50) {
      handlePrevious();
    } else if (currentX < -50) {
      handleNext();
    }
    
    setCurrentX(0);
  };

  const getTransform = (index) => {
    const totalItems = glassItems.length;
    let offset = index - activeIndex;
    
    // Handle wrapping for infinite loop
    if (offset > totalItems / 2) {
      offset -= totalItems;
    } else if (offset < -totalItems / 2) {
      offset += totalItems;
    }
    
    const absOffset = Math.abs(offset);
    
    // Calculate position and rotation
    let translateX = offset * 120;
    let translateZ = absOffset > 2 ? -200 : -absOffset * 60;
    let rotateY = 0;
    
    if (offset < 0) {
      rotateY = Math.min(45, absOffset * 15);
    } else if (offset > 0) {
      rotateY = Math.max(-45, -absOffset * 15);
    }
    
    // Add drag offset to current item
    if (index === activeIndex && isDragging) {
      translateX += currentX * 0.5;
    }
    
    // Calculate opacity
    const opacity = absOffset > 3 ? 0 : 1 - (absOffset * 0.2);
    
    // Scale for depth
    const scale = absOffset > 2 ? 0.8 : 1 - (absOffset * 0.1);
    
    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex: glassItems.length - absOffset,
      pointerEvents: absOffset > 2 ? 'none' : 'auto'
    };
  };

  return (
    <div 
      className="glass-coverflow"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className="coverflow-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="coverflow-track">
          {glassItems.map((glass, index) => (
            <div
              key={glass.id}
              className={`coverflow-item ${index === activeIndex ? 'active' : ''}`}
              style={getTransform(index)}
              onClick={() => {
                if (index === activeIndex) {
                  onGlassSelect(glass);
                } else {
                  setActiveIndex(index);
                }
              }}
            >
              <GlassCard
                glass={glass}
                onEdit={() => onEdit(glass)}
                onDelete={() => onDelete(glass.id)}
                onSelect={() => onGlassSelect(glass)}
                isSelected={selectedGlass?.id === glass.id}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="coverflow-controls">
        <button 
          className="coverflow-nav prev" 
          onClick={handlePrevious}
        >
          ‹
        </button>
        
        <div className="coverflow-indicators">
          {glassItems.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === activeIndex ? 'active' : ''}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        
        <button 
          className="coverflow-nav next" 
          onClick={handleNext}
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default GlassCoverflow;