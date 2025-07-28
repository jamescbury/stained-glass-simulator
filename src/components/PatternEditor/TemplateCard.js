import React from 'react';

const TemplateCard = ({ template, onEdit, onDelete, isSelected }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Create a data URL for the SVG preview
  const getSvgPreview = () => {
    if (!template.svgContent) return null;
    
    // Parse the SVG to get viewBox dimensions
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.svgContent, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    if (svgElement) {
      // Ensure the SVG has proper dimensions for preview
      svgElement.setAttribute('width', '100%');
      svgElement.setAttribute('height', '100%');
      
      // Convert back to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      // Create data URL
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    }
    
    return null;
  };

  return (
    <div 
      className={`template-card ${isSelected ? 'selected' : ''}`}
    >
      <div className="template-image-container">
        {template.svgContent ? (
          <div 
            className="template-svg-preview"
            dangerouslySetInnerHTML={{ __html: template.svgContent }}
          />
        ) : (
          <div className="template-placeholder">
            <span>No Preview</span>
          </div>
        )}
      </div>
      
      <div className="template-info">
        <h3 className="template-name">{template.name}</h3>
        <div className="template-details">
          <span className="detail-item">{template.pieceCount || 0} pieces</span>
          {template.category && (
            <span className="detail-item">{template.category}</span>
          )}
          <span className="detail-item">{formatDate(template.dateAdded)}</span>
        </div>
      </div>
      
      <div className="template-actions">
        <button
          className="action-btn edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit template"
        >
          Edit
        </button>
        <button
          className="action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete template"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;