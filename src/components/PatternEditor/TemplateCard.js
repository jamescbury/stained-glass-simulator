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