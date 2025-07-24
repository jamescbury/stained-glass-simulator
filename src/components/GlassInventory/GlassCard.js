import React from 'react';
import { getColorName } from '../../utils/colorDetection';
import { GLASS_TEXTURES } from '../../constants/glassTextures';

const GlassCard = ({ glass, onEdit, onDelete, onSelect, isSelected }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Handle custom textures
  let textureDisplay;
  if (glass.texture && glass.texture.startsWith('custom:')) {
    textureDisplay = glass.texture.substring(7) || 'Custom';
  } else {
    const textureInfo = GLASS_TEXTURES[glass.texture] || GLASS_TEXTURES.cathedral;
    textureDisplay = textureInfo.name;
  }


  return (
    <div 
      className={`glass-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="glass-image-container">
        <img 
          src={glass.imageUrl || glass.imageData} 
          alt={glass.name}
          className="glass-image"
          loading="lazy"
        />
      </div>
      
      <div className="glass-info">
        <h3 className="glass-name">{glass.name}</h3>
        
        {glass.primaryColor && (
          <div className="color-info">
            <div 
              className="color-swatch" 
              style={{ backgroundColor: glass.primaryColor }}
              title={getColorName(glass.primaryColor)}
            />
            <span className="color-name">
              {getColorName(glass.primaryColor)}
            </span>
          </div>
        )}
        
        <div className="texture-info">
          <span className="texture-label">Texture:</span>
          <span className="texture-name">{textureDisplay}</span>
        </div>
        
        {glass.secondaryColors && glass.secondaryColors.length > 0 && glass.secondaryColors.some(color => color && color !== '#808080') && (
          <div className="secondary-colors">
            {glass.secondaryColors.filter(color => color && color !== '#808080').map((color, index) => (
              <div
                key={index}
                className="secondary-color-swatch"
                style={{ backgroundColor: color }}
                title={getColorName(color)}
              />
            ))}
          </div>
        )}
        
        {glass.tags && glass.tags.length > 0 && (
          <div className="tags-container">
            {glass.tags.map(tag => (
              <span key={tag} className="tag-small">{tag}</span>
            ))}
          </div>
        )}
        
        <div className="glass-meta">
          <span className="date-added">Added {formatDate(glass.dateAdded)}</span>
        </div>
      </div>
      
      <div className="glass-actions">
        <button
          className="action-btn edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit glass"
        >
          ✏️
        </button>
        <button
          className="action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete glass"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default GlassCard;