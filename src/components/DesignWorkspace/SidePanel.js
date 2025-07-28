import React, { useState } from 'react';
import './SidePanel.css';

const SidePanel = ({ 
  glassInventory, 
  appliedGlass, 
  pieces,
  selectedShapeIndex,
  onGlassSelect, 
  onShapeSelect,
  onRemoveGlass,
  isOpen,
  onToggle,
  placementMode,
  onGlassApplied,
  onCancelPlacement,
  glassRotation,
  onRotationChange
}) => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'applied'
  const [searchFilter, setSearchFilter] = useState('');

  // Calculate glass usage summary
  const getGlassUsage = () => {
    const usage = {};
    Object.entries(appliedGlass).forEach(([shapeIndex, application]) => {
      const glassId = application.glassId;
      const glassData = application.glassData;
      if (!usage[glassId]) {
        usage[glassId] = {
          glass: glassData,
          count: 0,
          shapes: []
        };
      }
      usage[glassId].count++;
      usage[glassId].shapes.push(parseInt(shapeIndex));
    });
    return usage;
  };

  const glassUsage = getGlassUsage();

  // Filter glass inventory
  const filteredGlass = glassInventory.filter(glass => {
    if (!searchFilter) return true;
    const search = searchFilter.toLowerCase();
    return (
      glass.name?.toLowerCase().includes(search) ||
      glass.code?.toLowerCase().includes(search) ||
      glass.manufacturer?.toLowerCase().includes(search)
    );
  });

  // Group glass by primary color
  const groupGlassByColor = () => {
    const grouped = {};
    filteredGlass.forEach(glass => {
      const color = glass.primaryColor || '#999999';
      if (!grouped[color]) {
        grouped[color] = {
          color: color,
          items: []
        };
      }
      grouped[color].items.push(glass);
    });
    
    // Sort groups by luminance (light to dark)
    return Object.values(grouped).sort((a, b) => {
      const getLuminance = (hex) => {
        // Handle cases where hex might not be a string or might be invalid
        if (!hex || typeof hex !== 'string') return 0;
        // Ensure hex starts with # and is valid length
        const cleanHex = hex.startsWith('#') ? hex : '#' + hex;
        if (cleanHex.length < 7) return 0;
        
        const r = parseInt(cleanHex.substring(1,3), 16);
        const g = parseInt(cleanHex.substring(3,5), 16);
        const b = parseInt(cleanHex.substring(5,7), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b);
      };
      return getLuminance(b.color) - getLuminance(a.color);
    });
  };


  const colorGroups = groupGlassByColor();

  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`}>
      <button className="panel-toggle" onClick={onToggle}>
        {isOpen ? '›' : '‹'}
      </button>

      {isOpen && (
        <div className="panel-content">
          <div className="panel-tabs">
            <button 
              className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Glass Inventory
            </button>
            <button 
              className={`tab ${activeTab === 'applied' ? 'active' : ''}`}
              onClick={() => setActiveTab('applied')}
            >
              Applied Glass
            </button>
          </div>

          {activeTab === 'inventory' ? (
            <div className="inventory-content">
              {/* Glass Placement Controls */}
              {placementMode && selectedShapeIndex !== null && (
                <div className="glass-placement-section">
                  <h3>Glass Placement</h3>
                  <div className="placement-preview-info">
                    <span className="glass-name">{placementMode.glassData.name}</span>
                    <span className="shape-info">Shape #{selectedShapeIndex + 1}</span>
                  </div>
                  <div className="rotation-control">
                    <label>Rotation: {glassRotation}°</label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={glassRotation}
                      onChange={(e) => onRotationChange(parseInt(e.target.value))}
                      className="rotation-slider"
                    />
                  </div>
                  <div className="placement-actions">
                    <button 
                      className="confirm-btn"
                      onClick={() => {
                        onGlassApplied(selectedShapeIndex, {
                          glassId: placementMode.glassId,
                          glassData: placementMode.glassData,
                          placement: {
                            rotation: glassRotation,
                            position: { x: 0, y: 0 },
                            timestamp: new Date().toISOString()
                          }
                        });
                        onRotationChange(0); // Reset rotation
                      }}
                    >
                      Apply Glass
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        onCancelPlacement();
                        onRotationChange(0);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <div className="search-filter">
                <input
                  type="text"
                  placeholder="Search glass by name or code..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="search-input"
                />
              </div>
              {selectedShapeIndex === null && !placementMode && (
                <div className="selection-hint">
                  <p>👆 Select a shape in the canvas to apply glass</p>
                </div>
              )}
              <div className="glass-container">
                <div className="glass-grid">
                  {colorGroups.flatMap(group => 
                    group.items.map(glass => (
                      <div 
                        key={glass.id}
                        className="glass-tile"
                        onClick={() => onGlassSelect(glass)}
                        title={glass.name}
                      >
                        {glass.imageUrl || glass.imageData ? (
                          <div 
                            className="glass-preview"
                            style={{ 
                              backgroundImage: `url(${glass.imageData || glass.imageUrl})` 
                            }}
                          />
                        ) : (
                          <div 
                            className="glass-preview color-only"
                            style={{ 
                              backgroundColor: glass.primaryColor || '#ccc' 
                            }}
                          />
                        )}
                        <span className="glass-label">{glass.code || glass.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="applied-content">
              <div className="panel-section">
                <h3>Applied Glass Details</h3>
                <div className="applied-list">
                  {Object.entries(appliedGlass).map(([shapeIndex, application]) => {
                    const index = parseInt(shapeIndex);
                    const isSelected = selectedShapeIndex === index;
                    return (
                      <div 
                        key={shapeIndex}
                        className={`applied-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => onShapeSelect(index)}
                      >
                        <div className="shape-info">
                          <span className="shape-label">Shape #{index + 1}</span>
                          <span className="glass-name">{application.glassData.name}</span>
                        </div>
                        <div className="shape-actions">
                          {application.placement.rotation !== 0 && (
                            <span className="rotation-info">{application.placement.rotation}°</span>
                          )}
                          <button 
                            className="remove-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveGlass(index);
                            }}
                            title="Remove glass"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(appliedGlass).length === 0 && (
                    <p className="empty-message">No glass applied yet</p>
                  )}
                </div>
              </div>

              <div className="panel-section">
                <h3>Glass Usage Summary</h3>
                <div className="usage-list">
                  {Object.entries(glassUsage).map(([glassId, usage]) => (
                    <div key={glassId} className="usage-item">
                      <div className="usage-header">
                        <span className="glass-name">{usage.glass.name}</span>
                        <span className="usage-count">{usage.count} piece{usage.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="usage-shapes">
                        Used in shapes: {usage.shapes.map(s => `#${s + 1}`).join(', ')}
                      </div>
                    </div>
                  ))}
                  {Object.keys(glassUsage).length === 0 && (
                    <p className="empty-message">No glass used yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidePanel;