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
        <div className="glass-details">
          <span className="detail-item">{textureDisplay}</span>
          {glass.primaryColor && (
            <span className="detail-item">
              {getColorName(glass.primaryColor)}
            </span>
          )}
          <span className="detail-item">{formatDate(glass.dateAdded)}</span>
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
          Edit
        </button>
        <button
          className="action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete glass"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default GlassCard;