import React, { useState, useEffect } from 'react';
import { glassStorage, detectGlassTexture, extractColorFromFilename, GLASS_TEXTURES } from '../../services/glassStorage';
import { analyzeImageColors, detectGlassProperties } from '../../utils/colorDetection';
import GlassUploader from './GlassUploader';
import GlassCoverflow from './GlassCoverflow';
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
  'copper_blue_streaky.jpg',
  'cranberry_pink_white_soft_streaky.jpg',
  'dark_amber_transparent.jpg',
  'green_mottled.webp',
  'iradized_accordian_rainbow.jpg',
  'lime_blue_mottle.webp',
  'olive_brown_streaky.webp',
  'orange_opal_streaky.webp',
  'pink_opal_streaky.jpg',
  'purple_streaky.webp',
  'spring_green_yellow_martigras.jpg',
  'true_blue_streaky.jpg',
  'turquoise_blue_white_streaky.jpg',
  'van_gogh_copper_gold.jpg',
  'van_gogh_spring_green.jpg',
  'vanilla_turqoise_infusion.webp',
  'white_streaky.jpg',
  'youghiogheny_emerald.jpg',
  'youghiogheny_lime.jpg'
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
            // Use PUBLIC_URL to work in both local and GitHub Pages
            const imageUrl = `${process.env.PUBLIC_URL}/glass_inventory/${filename}`;
            
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

  // Export inventory
  const exportInventory = () => {
    const dataStr = JSON.stringify(glassItems, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `glass-inventory-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  // Import inventory
  const importInventory = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedGlass = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedGlass)) {
          throw new Error('Invalid inventory format');
        }
        
        // Add each glass item
        for (const glass of importedGlass) {
          // Skip if already exists (by name)
          const exists = glassItems.some(g => g.name === glass.name);
          if (!exists) {
            await glassStorage.addGlass({
              ...glass,
              id: undefined, // Let storage assign new ID
              addedAt: new Date().toISOString()
            });
          }
        }
        
        // Reload
        await loadGlassItems();
        alert(`Imported ${importedGlass.length} glass items!`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import inventory. Please check the file format.');
      }
    };
    reader.readAsText(file);
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
      <div className="inventory-main">
        <div className="inventory-header">
          <h2>Glass Inventory</h2>
          <div className="inventory-stats">
            {glassItems.length} pieces in your collection
          </div>
        </div>

        {isLoading ? (
          <div className="loading">Loading glass inventory...</div>
        ) : filteredGlass.length === 0 ? (
          <div className="empty-state">
            <h3>No glass found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <GlassCoverflow
            glassItems={filteredGlass}
            onGlassSelect={setSelectedGlass}
            selectedGlass={selectedGlass}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      <div className="inventory-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3>Add Inventory</h3>
          <GlassUploader onUpload={handleUpload} customTextures={customTextures} />
          <div style={{ marginTop: '1rem' }}>
            <label className="import-json-button" style={{ cursor: 'pointer', display: 'block' }}>
              Import from JSON
              <input 
                type="file" 
                accept=".json" 
                onChange={importInventory} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Search</h3>
          <input
            type="text"
            placeholder="Search Glass"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          
          <div style={{ marginTop: '1rem' }}>
            <div className="filter-group">
              <label className="filter-label">Glass Texture</label>
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
            </div>

            <div className="filter-group">
              <label className="filter-label">Glass Colors</label>
              <select 
                value={filterTag} 
                onChange={(e) => setFilterTag(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Colors</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Controls</h3>
          <div className="action-buttons">
            <button 
              onClick={exportInventory}
              className="export-button"
            >
              Export
            </button>
            <button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = importInventory;
                input.click();
              }}
              className="import-button"
            >
              Import
            </button>
            <button 
              onClick={async () => {
                const confirmLoad = window.confirm('This will add all default glass samples to your inventory. Continue?');
                if (confirmLoad) {
                  try {
                    const samples = await Promise.all(
                      DEFAULT_SAMPLES.map(async (filename) => {
                        const imageUrl = `${process.env.PUBLIC_URL || ''}/glass_inventory/${filename}`;
                        
                        const glassTexture = detectGlassTexture(filename);
                        const color = extractColorFromFilename(filename);
                        const name = filename
                          .replace(/\.(jpg|webp|png)$/, '')
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase());
                        
                        return {
                          name,
                          texture: glassTexture.key,
                          primaryColor: color,
                          notes: glassTexture.description,
                          tags: [glassTexture.name, ...filename.split(/[_.]/).filter(tag => tag.length > 2)],
                          imageUrl: imageUrl,
                          dateAdded: new Date().toISOString()
                        };
                      })
                    );
                    
                    for (const glass of samples) {
                      const exists = glassItems.some(g => g.name === glass.name);
                      if (!exists) {
                        await glassStorage.addGlass(glass);
                      }
                    }
                    
                    await loadGlassItems();
                    alert('Default glass samples loaded successfully!');
                  } catch (error) {
                    console.error('Error loading default samples:', error);
                    alert('Failed to load default samples. Please check the console for details.');
                  }
                }
              }}
              className="import-button"
              style={{ backgroundColor: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' }}
            >
              Load Default Samples
            </button>
          </div>
        </div>
        </div>
      </div>

      {isEditing && selectedGlass && (
        <div className="glass-editor-modal">
          <GlassEditor
            glass={selectedGlass}
            customTextures={customTextures}
            onSave={handleSaveEdit}
            onCancel={() => {
              setIsEditing(false);
              setSelectedGlass(null);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InventoryManager;