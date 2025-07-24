import React from 'react';

const PatternGallery = ({ patterns, onSelectPattern, onDeletePattern }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (patterns.length === 0) {
    return (
      <div className="empty-gallery">
        <p>No templates uploaded yet. Upload an SVG or choose from templates to get started!</p>
      </div>
    );
  }

  return (
    <div className="pattern-gallery">
      <h3>My Templates</h3>
      <div className="pattern-grid">
        {patterns.map(pattern => (
          <div 
            key={pattern.id} 
            className="pattern-card"
            onClick={() => onSelectPattern(pattern)}
          >
            <div className="pattern-preview">
              <div 
                className="svg-preview-content"
                dangerouslySetInnerHTML={{ __html: pattern.svgContent }}
              />
            </div>
            
            <div className="pattern-info">
              <h4>{pattern.name}</h4>
              <div className="pattern-meta">
                <span className="pattern-type">{pattern.type}</span>
                <span className="pattern-size">{formatFileSize(pattern.fileSize)}</span>
              </div>
              <div className="pattern-date">
                Added {formatDate(pattern.uploadDate)}
              </div>
            </div>
            
            <button
              className="delete-pattern-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePattern(pattern.id);
              }}
              title="Delete pattern"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatternGallery;