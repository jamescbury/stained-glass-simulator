import React, { useState } from 'react';
import './GlassInventoryPanel.css';

const GlassInventoryPanel = ({ inventory, onGlassSelect, selectedShapeIndex }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTexture, setSelectedTexture] = useState('all');

  const filteredInventory = inventory.filter(glass => {
    const matchesSearch = glass.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTexture = selectedTexture === 'all' || glass.texture === selectedTexture;
    return matchesSearch && matchesTexture;
  });

  const textures = ['all', 'cathedral', 'opalescent', 'streaky', 'wispy', 'textured', 'clear'];

  return (
    <div className="glass-inventory-panel">
      <h3>Glass Inventory</h3>
      
      {selectedShapeIndex === null && (
        <div className="panel-hint">
          Select a shape to apply glass
        </div>
      )}

      <div className="inventory-filters">
        <input
          type="text"
          placeholder="Search glass..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={selectedTexture} 
          onChange={(e) => setSelectedTexture(e.target.value)}
          className="texture-filter"
        >
          {textures.map(texture => (
            <option key={texture} value={texture}>
              {texture === 'all' ? 'All Textures' : texture.charAt(0).toUpperCase() + texture.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="workspace-glass-grid">
        {filteredInventory.map(glass => (
          <div
            key={glass.id}
            className={`workspace-glass-item ${selectedShapeIndex === null ? 'disabled' : ''}`}
            onClick={() => selectedShapeIndex !== null && onGlassSelect(glass)}
            title={glass.name}
          >
            {glass.imageUrl || glass.imageData ? (
              <img 
                src={glass.imageData || glass.imageUrl} 
                alt={glass.name}
                className="glass-thumbnail"
              />
            ) : (
              <div 
                className="glass-color-swatch"
                style={{ backgroundColor: glass.primaryColor || '#ccc' }}
              />
            )}
            <div className="glass-info">
              <div className="glass-name">{glass.name}</div>
              <div className="glass-texture">{glass.texture}</div>
              {glass.texture === 'streaky' && (
                <div className="grain-indicator" title="Streaky - has grain direction">
                  ↕
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="no-results">
          No glass found matching your criteria
        </div>
      )}
    </div>
  );
};

export default GlassInventoryPanel;