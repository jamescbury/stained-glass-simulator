import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { GLASS_TEXTURES } from '../../constants/glassTextures';

const GlassUploader = ({ onUpload, customTextures = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [metadata, setMetadata] = useState({
    name: '',
    texture: 'cathedral',
    tags: [],
    notes: GLASS_TEXTURES.cathedral.description
  });
  const [tagInput, setTagInput] = useState('');
  const [showCustomTexture, setShowCustomTexture] = useState(false);
  const [customTextureName, setCustomTextureName] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Extract name from filename
      const name = file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
      
      setMetadata({
        name,
        texture: 'cathedral',
        tags: [],
        notes: GLASS_TEXTURES.cathedral.description
      });
      setShowForm(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  const handleAddTag = () => {
    if (tagInput.trim()) {
      // Split by commas and process each tag
      const newTags = tagInput.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag && !metadata.tags.includes(tag));
      
      if (newTags.length > 0) {
        setMetadata(prev => ({
          ...prev,
          tags: [...prev.tags, ...newTags]
        }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadedFile || !metadata.name) {
      alert('Please provide a name for the glass');
      return;
    }
    
    await onUpload(uploadedFile, metadata);
    
    // Reset form
    setShowForm(false);
    setUploadedFile(null);
    setPreview(null);
    setMetadata({
      name: '',
      texture: 'cathedral',
      tags: [],
      notes: GLASS_TEXTURES.cathedral.description
    });
    setTagInput('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setUploadedFile(null);
    setPreview(null);
    setMetadata({
      name: '',
      texture: 'cathedral',
      tags: [],
      notes: GLASS_TEXTURES.cathedral.description
    });
    setTagInput('');
    setShowCustomTexture(false);
    setCustomTextureName('');
  };

  return (
    <div className="glass-uploader">
      {!showForm ? (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <p className="upload-text">Drop image here or click to upload</p>
          </div>
        </div>
      ) : (
        <div className="upload-form">
          <h3>Add Glass Details</h3>
          
          <div className="preview-section">
            {preview && (
              <img src={preview} alt="Glass preview" className="glass-preview" />
            )}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Glass Name *</label>
              <input
                type="text"
                id="name"
                value={metadata.name}
                onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Ruby Red Cathedral"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="texture">Glass Texture</label>
              <select
                id="texture"
                value={showCustomTexture ? 'other' : metadata.texture}
                onChange={(e) => {
                  const texture = e.target.value;
                  
                  if (texture === 'other') {
                    setShowCustomTexture(true);
                    setMetadata(prev => ({ 
                      ...prev, 
                      texture: 'custom:',
                      notes: GLASS_TEXTURES.other.description
                    }));
                  } else if (texture.startsWith('custom:')) {
                    // Selected an existing custom texture
                    setShowCustomTexture(false);
                    setCustomTextureName('');
                    setMetadata(prev => ({ 
                      ...prev, 
                      texture,
                      notes: prev.notes === GLASS_TEXTURES[prev.texture]?.description ? 
                             'Custom texture' : prev.notes
                    }));
                  } else {
                    setShowCustomTexture(false);
                    setCustomTextureName('');
                    const textureInfo = GLASS_TEXTURES[texture];
                    setMetadata(prev => ({ 
                      ...prev, 
                      texture,
                      notes: prev.notes === GLASS_TEXTURES[prev.texture]?.description ? 
                             textureInfo.description : prev.notes
                    }));
                  }
                }}
              >
                {Object.entries(GLASS_TEXTURES).map(([key, texture]) => (
                  <option key={key} value={key}>{texture.name}</option>
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
                    setMetadata(prev => ({ 
                      ...prev, 
                      texture: `custom:${e.target.value}`
                    }));
                  }}
                  required
                />
              </div>
            )}
            
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
                <button type="button" onClick={handleAddTag} className="add-tag-btn">
                  Add
                </button>
              </div>
              <div className="tags-list">
                {metadata.tags.map(tag => (
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
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={metadata.notes}
                onChange={(e) => setMetadata(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this glass..."
                rows={3}
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add to Inventory
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GlassUploader;