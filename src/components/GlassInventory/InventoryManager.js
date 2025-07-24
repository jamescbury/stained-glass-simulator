import React, { useState, useEffect } from 'react';
import { glassStorage, detectGlassTexture, extractColorFromFilename, GLASS_TEXTURES } from '../../services/glassStorage';
import { analyzeImageColors, detectGlassProperties } from '../../utils/colorDetection';
import GlassUploader from './GlassUploader';
import GlassCard from './GlassCard';
import GlassEditor from './GlassEditor';
import './GlassInventory.css';
import '../../utils/resetDatabase'; // Import to add resetGlassDB to window

// Default glass samples to load on first use
const DEFAULT_SAMPLES = [
  'amber_light_transparent.webp',
  'amber_transparent.jpg',
  'black_opal_irridecent.jpg',
  'blue_mottled.webp',
  'brown_transparent.webp',
  'dark_amber_transparent.jpg',
  'green_mottled.webp',
  'lime_blue_mottle.webp',
  'olive_brown_streaky.webp',
  'orange_opal_streaky.webp',
  'purple_streaky.webp',
  'vanilla_turqoise_infusion.webp'
];

const InventoryManager = () => {
  const [glassItems, setGlassItems] = useState([]);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTexture, setFilterTexture] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [allTags, setAllTags] = useState([]);
  const [customTextures, setCustomTextures] = useState([]);

  // Load glass items and initial samples on mount
  useEffect(() => {
    const initializeInventory = async () => {
      await loadInitialSamples();
      await loadGlassItems();
    };
    initializeInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGlassItems = async () => {
    try {
      const items = await glassStorage.getAllGlass();
      setGlassItems(items);
      
      // Extract all unique tags
      const tags = new Set();
      items.forEach(item => {
        item.tags.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags).sort());
      
      // Extract all custom textures
      const customTextureSet = new Set();
      items.forEach(item => {
        if (item.texture && item.texture.startsWith('custom:')) {
          const customName = item.texture.substring(7);
          if (customName) {
            customTextureSet.add(customName);
          }
        }
      });
      setCustomTextures(Array.from(customTextureSet).sort());
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading glass items:', error);
      setIsLoading(false);
    }
  };

  const loadInitialSamples = async () => {
    try {
      const isEmpty = await glassStorage.isEmpty();
      
      if (isEmpty) {
        console.log('Loading default glass samples...');
        
        const samples = await Promise.all(
          DEFAULT_SAMPLES.map(async (filename) => {
            // For local development, we need to include the subdirectory
            const imageUrl = `/stained-glass-simulator/glass_inventory/${filename}`;
            
            // Extract info from filename
            const glassTexture = detectGlassTexture(filename);
            const textureInfo = GLASS_TEXTURES[glassTexture];
            const colorInfo = extractColorFromFilename(filename);
            const name = filename.replace(/\.(webp|jpg|png)$/i, '')
              .replace(/_/g, ' ')
              .replace(/\b\w/g, char => char.toUpperCase());
            
            // Try to analyze colors - skip for now as it may cause CORS issues
            let colorAnalysis = null;
            // Temporarily disable color analysis for preloaded images
            // try {
            //   colorAnalysis = await analyzeImageColors(imageUrl);
            // } catch (error) {
            //   console.warn(`Could not analyze colors for ${filename}:`, error);
            // }
            
            return {
              name,
              imageUrl,
              texture: glassTexture,
              primaryColor: colorInfo?.hex || colorAnalysis?.dominantColor || null,
              secondaryColors: colorAnalysis?.palette.slice(1, 3) || [],
              tags: [], // Don't include texture/color in tags to avoid sync issues
              notes: textureInfo.description
            };
          })
        );
        
        await glassStorage.bulkImport(samples);
      }
    } catch (error) {
      console.error('Error loading initial samples:', error);
    }
  };

  const handleEdit = (glass) => {
    setSelectedGlass(glass);
    setIsEditing(true);
  };

  const handleSaveEdit = async (updatedGlass) => {
    try {
      await glassStorage.updateGlass(updatedGlass.id, updatedGlass);
      await loadGlassItems();
      setIsEditing(false);
      setSelectedGlass(null);
    } catch (error) {
      console.error('Error updating glass:', error);
      alert('Failed to update glass. Please try again.');
    }
  };

  const handleDelete = async (glassId) => {
    if (window.confirm('Are you sure you want to delete this glass?')) {
      try {
        await glassStorage.deleteGlass(glassId);
        await loadGlassItems();
        if (selectedGlass?.id === glassId) {
          setSelectedGlass(null);
        }
      } catch (error) {
        console.error('Error deleting glass:', error);
        alert('Failed to delete glass. Please try again.');
      }
    }
  };

  const handleUpload = async (file, metadata) => {
    try {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result;
        
        // Analyze colors
        let colorAnalysis = null;
        try {
          colorAnalysis = await analyzeImageColors(imageData);
        } catch (error) {
          console.warn('Could not analyze colors:', error);
        }
        
        // Detect glass properties
        const properties = colorAnalysis ? detectGlassProperties(colorAnalysis) : {};
        
        // Add texture description to notes if not already present
        const textureInfo = GLASS_TEXTURES[metadata.texture] || GLASS_TEXTURES.cathedral;
        const notes = metadata.notes || textureInfo.description;
        
        // Remove texture from tags if it exists
        const cleanedTags = metadata.tags ? metadata.tags.filter(tag => {
          const tagLower = tag.toLowerCase();
          return !Object.values(GLASS_TEXTURES).some(texture => 
            texture.name.toLowerCase() === tagLower
          );
        }) : [];
        
        const newGlass = {
          ...metadata,
          tags: cleanedTags,
          imageData,
          imageUrl: imageData, // Use data URL for display
          primaryColor: metadata.primaryColor || colorAnalysis?.dominantColor,
          secondaryColors: colorAnalysis?.palette.slice(1, 3) || [],
          texture: metadata.texture || properties.texture || 'cathedral',
          notes
        };
        
        await glassStorage.addGlass(newGlass);
        await loadGlassItems();
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading glass:', error);
      alert('Failed to upload glass. Please try again.');
    }
  };

  // Filter glass items based on search and filters
  const filteredGlass = glassItems.filter(glass => {
    // Search filter
    if (searchQuery && !glass.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Texture filter
    if (filterTexture !== 'all') {
      if (filterTexture === 'custom') {
        // Show only custom textures
        if (!glass.texture || !glass.texture.startsWith('custom:')) {
          return false;
        }
      } else if (glass.texture !== filterTexture) {
        return false;
      }
    }
    
    // Tag filter
    if (filterTag !== 'all' && !glass.tags.includes(filterTag)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="inventory-manager">
      <div className="inventory-header">
        <h2>Glass Inventory</h2>
        <div className="inventory-stats">
          {glassItems.length} pieces in collection
          <button 
            onClick={() => {
              if (window.confirm('Clear all glass inventory and reload samples?')) {
                window.resetGlassDB();
              }
            }}
            style={{
              marginLeft: '20px',
              padding: '5px 10px',
              fontSize: '0.9rem',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Database
          </button>
        </div>
      </div>

      <div className="inventory-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search glass..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select 
            value={filterTexture} 
            onChange={(e) => setFilterTexture(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Textures</option>
            <option value="clear">Clear</option>
            <option value="cathedral">Cathedral</option>
            <option value="opalescent">Opalescent</option>
            <option value="streaky">Streaky</option>
            <option value="wispy">Wispy</option>
            <option value="textured">Textured</option>
            <option value="other">Other</option>
            <option value="custom">All Custom Textures</option>
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

          <select 
            value={filterTag} 
            onChange={(e) => setFilterTag(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      <GlassUploader onUpload={handleUpload} customTextures={customTextures} />

      {isLoading ? (
        <div className="loading">Loading glass inventory...</div>
      ) : (
        <div className="glass-grid">
          {filteredGlass.map(glass => (
            <GlassCard
              key={glass.id}
              glass={glass}
              onEdit={() => handleEdit(glass)}
              onDelete={() => handleDelete(glass.id)}
              onSelect={() => setSelectedGlass(glass)}
              isSelected={selectedGlass?.id === glass.id}
            />
          ))}
        </div>
      )}

      {isEditing && selectedGlass && (
        <GlassEditor
          glass={selectedGlass}
          customTextures={customTextures}
          onSave={handleSaveEdit}
          onCancel={() => {
            setIsEditing(false);
            setSelectedGlass(null);
          }}
        />
      )}
    </div>
  );
};

export default InventoryManager;