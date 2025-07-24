import { openDB } from 'idb';

const DB_NAME = 'StainedGlassDB';
const DB_VERSION = 2; // Updated to match patternStorage.js
const GLASS_STORE = 'glassInventory';

// Prevent concurrent bulk imports
let bulkImportInProgress = false;

// Initialize the database
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create glass inventory store if it doesn't exist
      if (!db.objectStoreNames.contains(GLASS_STORE)) {
        const store = db.createObjectStore(GLASS_STORE, { 
          keyPath: 'id',
          autoIncrement: true 
        });
        
        // Create indexes for searching
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('texture', 'texture', { unique: false });
        store.createIndex('color', 'primaryColor', { unique: false });
        store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }
      
      // Create patterns store if it doesn't exist (for v2)
      if (!db.objectStoreNames.contains('patterns')) {
        const patternStore = db.createObjectStore('patterns', {
          keyPath: 'id',
          autoIncrement: true
        });
        
        patternStore.createIndex('name', 'name', { unique: false });
        patternStore.createIndex('type', 'type', { unique: false });
        patternStore.createIndex('uploadDate', 'uploadDate', { unique: false });
      }
    }
  });
}

// Glass data structure
class GlassItem {
  constructor(data) {
    // Don't include id in the object - let IndexedDB auto-generate it
    this.name = data.name || 'Untitled Glass';
    this.imageUrl = data.imageUrl || null;
    this.imageData = data.imageData || null; // Base64 for offline storage
    this.texture = data.texture || 'cathedral'; // Default to cathedral
    this.primaryColor = data.primaryColor || null;
    this.secondaryColors = data.secondaryColors || [];
    this.tags = data.tags || [];
    this.notes = data.notes || '';
    this.dateAdded = data.dateAdded || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
  }
}

// CRUD Operations
export const glassStorage = {
  // Add new glass item
  async addGlass(glassData) {
    const db = await initDB();
    const glass = new GlassItem(glassData);
    glass.lastModified = new Date().toISOString();
    
    const id = await db.add(GLASS_STORE, glass);
    return { ...glass, id };
  },

  // Get all glass items
  async getAllGlass() {
    const db = await initDB();
    return db.getAll(GLASS_STORE);
  },

  // Get glass by ID
  async getGlass(id) {
    const db = await initDB();
    return db.get(GLASS_STORE, id);
  },

  // Update glass item
  async updateGlass(id, updates) {
    const db = await initDB();
    const existing = await db.get(GLASS_STORE, id);
    
    if (!existing) {
      throw new Error(`Glass item with id ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      lastModified: new Date().toISOString()
    };
    
    await db.put(GLASS_STORE, updated);
    return updated;
  },

  // Delete glass item
  async deleteGlass(id) {
    const db = await initDB();
    await db.delete(GLASS_STORE, id);
  },

  // Search glass by name
  async searchByName(query) {
    const db = await initDB();
    const allGlass = await db.getAll(GLASS_STORE);
    
    return allGlass.filter(glass => 
      glass.name.toLowerCase().includes(query.toLowerCase())
    );
  },

  // Filter by texture
  async filterByTexture(texture) {
    const db = await initDB();
    return db.getAllFromIndex(GLASS_STORE, 'texture', texture);
  },

  // Filter by color
  async filterByColor(color) {
    const db = await initDB();
    const allGlass = await db.getAll(GLASS_STORE);
    
    return allGlass.filter(glass => 
      glass.primaryColor === color || 
      glass.secondaryColors.includes(color)
    );
  },

  // Filter by tags
  async filterByTag(tag) {
    const db = await initDB();
    return db.getAllFromIndex(GLASS_STORE, 'tags', tag);
  },

  // Bulk import (for initial samples)
  async bulkImport(glassItems) {
    // Prevent concurrent imports
    if (bulkImportInProgress) {
      console.log('Bulk import already in progress, skipping');
      return 0;
    }
    
    bulkImportInProgress = true;
    
    try {
      const db = await initDB();
      
      // Check if samples already exist to prevent duplicates
      const existingCount = await db.count(GLASS_STORE);
      if (existingCount > 0) {
        console.log('Database already has items, skipping bulk import');
        return 0;
      }
      
      const tx = db.transaction(GLASS_STORE, 'readwrite');
      
      const promises = glassItems.map(item => {
        const glass = new GlassItem(item);
        // Don't set id - let IndexedDB auto-generate it
        delete glass.id;
        return tx.store.add(glass);
      });
      
      await Promise.all(promises);
      await tx.done;
      
      console.log(`Bulk imported ${glassItems.length} items`);
      return glassItems.length;
    } finally {
      bulkImportInProgress = false;
    }
  },

  // Check if database is empty (for initial load)
  async isEmpty() {
    const db = await initDB();
    const count = await db.count(GLASS_STORE);
    return count === 0;
  },

  // Clear all data (be careful!)
  async clearAll() {
    const db = await initDB();
    await db.clear(GLASS_STORE);
  }
};

// Re-export GLASS_TEXTURES for convenience
export { GLASS_TEXTURES } from '../constants/glassTextures';

// Helper to detect glass texture from filename
export function detectGlassTexture(filename) {
  const lower = filename.toLowerCase();
  
  if (lower.includes('transparent')) return 'clear';
  if (lower.includes('opal')) return 'opalescent';
  if (lower.includes('streaky')) return 'streaky';
  if (lower.includes('mottled') || lower.includes('mottle')) return 'textured';
  if (lower.includes('wispy')) return 'wispy';
  
  return 'cathedral'; // Default texture
}

// Helper to extract color hints from filename
export function extractColorFromFilename(filename) {
  const colorMap = {
    amber: '#FFBF00',
    black: '#000000',
    blue: '#0000FF',
    brown: '#964B00',
    green: '#00FF00',
    lime: '#32CD32',
    olive: '#808000',
    orange: '#FFA500',
    purple: '#800080',
    vanilla: '#F3E5AB',
    turquoise: '#40E0D0',
    'turqoise': '#40E0D0' // Handle misspelling
  };
  
  const lower = filename.toLowerCase();
  
  for (const [color, hex] of Object.entries(colorMap)) {
    if (lower.includes(color)) {
      return { name: color, hex };
    }
  }
  
  return null;
}