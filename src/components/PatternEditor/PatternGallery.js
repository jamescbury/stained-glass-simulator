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

  // Separate patterns by type
  const defaultPatterns = patterns.filter(p => p.isDefault);
  const customPatterns = patterns.filter(p => !p.isDefault);

  return (
    <div className="pattern-gallery">
      {/* Default Templates Section */}
      {defaultPatterns.length > 0 && (
        <>
          <h3>Standard Templates</h3>
          <div className="pattern-grid">
            {defaultPatterns.map(pattern => (
              <div 
                key={pattern.id} 
                className="pattern-card default-pattern"
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
                    <span className="pattern-category">{pattern.category}</span>
                    <span className="pattern-difficulty">{pattern.difficulty}</span>
                  </div>
                  <div className="pattern-description">
                    {pattern.description}
                  </div>
                  <div className="pattern-stats">
                    <span>{pattern.pieceCount} pieces</span>
                  </div>
                </div>
                
                <button
                  className="delete-pattern-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePattern(pattern.id);
                  }}
                  title="Remove template"
                >
                  ×
                </button>
                
                <span className="default-badge">Default</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Custom Templates Section */}
      {customPatterns.length > 0 && (
        <>
          <h3>My Custom Templates</h3>
          <div className="pattern-grid">
            {customPatterns.map(pattern => (
              <div 
                key={pattern.id} 
                className="pattern-card custom-pattern"
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
                    <span className="pattern-type">Custom</span>
                    <span className="pattern-size">{formatFileSize(pattern.fileSize)}</span>
                  </div>
                  <div className="pattern-date">
                    Added {formatDate(pattern.uploadDate)}
                  </div>
                  {pattern.pieceCount > 0 && (
                    <div className="pattern-stats">
                      <span>{pattern.pieceCount} pieces</span>
                    </div>
                  )}
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
        </>
      )}
    </div>
  );
};

export default PatternGallery;