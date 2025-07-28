import React, { useState } from 'react';
import { GLASS_TEXTURES } from '../../constants/glassTextures';
import './GlassEditor.css';

const GlassEditor = ({ glass, customTextures = [], onSave, onCancel }) => {
  const [editedGlass, setEditedGlass] = useState({ ...glass });
  const [tagInput, setTagInput] = useState('');
  
  // Check if texture is custom (starts with 'custom:')
  const isCustomTexture = editedGlass.texture && editedGlass.texture.startsWith('custom:');
  const [showCustomTexture, setShowCustomTexture] = useState(isCustomTexture);
  const [customTextureName, setCustomTextureName] = useState(
    isCustomTexture ? editedGlass.texture.substring(7) : ''
  );

  const handleChange = (field, value) => {
    setEditedGlass(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      // Split by commas and process each tag
      const newTags = tagInput.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag && !editedGlass.tags.includes(tag));
      
      if (newTags.length > 0) {
        setEditedGlass(prev => ({
          ...prev,
          tags: [...prev.tags, ...newTags]
        }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedGlass(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleColorChange = (colorType, value) => {
    if (colorType === 'primary') {
      handleChange('primaryColor', value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedGlass);
  };

  return (
    <div className="glass-editor-overlay" onClick={onCancel}>
      <div className="glass-editor" onClick={(e) => e.stopPropagation()}>
        <div className="editor-header">
          <h3>Edit Glass Details</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="editor-content">
          <div className="editor-preview">
            <img 
              src={glass.imageUrl || glass.imageData} 
              alt={glass.name}
              className="editor-image"
            />
          </div>

          <form onSubmit={handleSubmit} className="editor-form">
            <div className="form-group">
              <label htmlFor="edit-name">Name</label>
              <input
                type="text"
                id="edit-name"
                value={editedGlass.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-texture">Texture</label>
              <div className="simple-select-wrapper">
                <select
                  id="edit-texture"
                  value={showCustomTexture ? 'other' : (editedGlass.texture || 'cathedral')}
                  onChange={(e) => {
                    e.stopPropagation();
                    const texture = e.target.value;
                    
                    if (texture === 'other') {
                      setShowCustomTexture(true);
                      handleChange('texture', 'custom:');
                    } else if (texture.startsWith('custom:')) {
                      // Selected an existing custom texture
                      setShowCustomTexture(false);
                      setCustomTextureName('');
                      handleChange('texture', texture);
                    } else {
                      setShowCustomTexture(false);
                      setCustomTextureName('');
                      const textureInfo = GLASS_TEXTURES[texture];
                      handleChange('texture', texture);
                      // Update notes if they match the old texture description
                      const oldTexture = editedGlass.texture || 'cathedral';
                      if (editedGlass.notes === GLASS_TEXTURES[oldTexture]?.description) {
                        handleChange('notes', textureInfo.description);
                      }
                    }
                  }}
                  className="texture-select"
                >
                  {Object.entries(GLASS_TEXTURES).map(([key, texture]) => (
                    <option key={key} value={key}>
                      {texture.name}
                    </option>
                  ))}
                  {customTextures.length > 0 && (
                    <optgroup label="Custom Textures">
                      {customTextures.map(customTexture => (
                        <option key={`custom:${customTexture}`} value={`custom:${customTexture}`}>
                          {customTexture}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              {showCustomTexture && (
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Enter custom texture name"
                    value={customTextureName}
                    onChange={(e) => {
                      setCustomTextureName(e.target.value);
                      handleChange('texture', `custom:${e.target.value}`);
                    }}
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="primary-color">Primary Color</label>
              <div className="color-inputs">
                <div className="color-input-group">
                  <input
                    type="color"
                    id="primary-color"
                    value={editedGlass.primaryColor || '#808080'}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                  />
                  <input
                    type="text"
                    value={editedGlass.primaryColor || ''}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    placeholder="#RRGGBB"
                    className="color-text"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Tags</label>
              <div className="tag-input-group">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Enter tags separated by commas"
                />
              </div>
              <div className="tags-list">
                {editedGlass.tags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-notes">Notes</label>
              <textarea
                id="edit-notes"
                value={editedGlass.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={onCancel} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GlassEditor;