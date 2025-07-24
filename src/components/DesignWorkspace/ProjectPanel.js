import React from 'react';
import './ProjectPanel.css';

const ProjectPanel = ({ 
  projectName, 
  statistics, 
  appliedGlass, 
  glassInventory,
  onRemoveGlass 
}) => {
  // Get glass usage summary
  const glassUsage = {};
  Object.entries(appliedGlass).forEach(([shapeIndex, application]) => {
    const glassName = application.glassData.name;
    if (!glassUsage[glassName]) {
      glassUsage[glassName] = {
        count: 0,
        texture: application.glassData.texture,
        color: application.glassData.primaryColor,
        shapes: []
      };
    }
    glassUsage[glassName].count++;
    glassUsage[glassName].shapes.push(parseInt(shapeIndex) + 1);
  });

  return (
    <div className="project-panel">
      <div className="project-header">
        <h3>{projectName}</h3>
        <div className="project-stats">
          <span>Shapes with glass: {statistics.shapesWithGlass}</span>
          <span>Glass types used: {Object.keys(glassUsage).length}</span>
        </div>
      </div>

      <div className="project-content">
        <div className="glass-usage-section">
          <h4>Glass Usage</h4>
          {Object.keys(glassUsage).length === 0 ? (
            <p className="empty-state">No glass applied yet</p>
          ) : (
            <div className="glass-usage-list">
              {Object.entries(glassUsage).map(([glassName, usage]) => (
                <div key={glassName} className="glass-usage-item">
                  <div className="usage-header">
                    <div className="glass-preview">
                      {usage.color && (
                        <div 
                          className="color-dot" 
                          style={{ backgroundColor: usage.color }}
                        />
                      )}
                      <span className="glass-name">{glassName}</span>
                    </div>
                    <span className="usage-count">×{usage.count}</span>
                  </div>
                  <div className="usage-details">
                    <span className="texture-badge">{usage.texture}</span>
                    <span className="shapes-list">
                      Shapes: {usage.shapes.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="applied-glass-section">
          <h4>Applied Glass Details</h4>
          {Object.entries(appliedGlass).length === 0 ? (
            <p className="empty-state">Select shapes and apply glass to see details</p>
          ) : (
            <div className="applied-glass-list">
              {Object.entries(appliedGlass).map(([shapeIndex, application]) => (
                <div key={shapeIndex} className="applied-glass-item">
                  <span className="shape-number">Shape #{parseInt(shapeIndex) + 1}</span>
                  <span className="glass-name">{application.glassData.name}</span>
                  {application.placement && (
                    <span className="rotation">
                      {Math.round(application.placement.rotation)}°
                    </span>
                  )}
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveGlass(shapeIndex)}
                    title="Remove glass"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectPanel;