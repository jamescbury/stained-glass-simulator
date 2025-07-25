import { openDB } from 'idb';

const DB_NAME = 'StainedGlassDB';
const DB_VERSION = 2; // Increment version to add new store
const PATTERN_STORE = 'patterns';

// Initialize the database
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create glass inventory store if it doesn't exist
      if (!db.objectStoreNames.contains('glassInventory')) {
        const glassStore = db.createObjectStore('glassInventory', { 
          keyPath: 'id',
          autoIncrement: true 
        });
        
        glassStore.createIndex('name', 'name', { unique: false });
        glassStore.createIndex('texture', 'texture', { unique: false });
        glassStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        glassStore.createIndex('dateAdded', 'dateAdded', { unique: false });
      }
      
      // Create patterns store
      if (!db.objectStoreNames.contains(PATTERN_STORE)) {
        const patternStore = db.createObjectStore(PATTERN_STORE, {
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

// Pattern item structure
class PatternItem {
  constructor(data) {
    this.name = data.name || 'Untitled Pattern';
    this.type = data.type || 'custom'; // 'custom' or 'template'
    this.svgContent = data.svgContent || '';
    this.fileName = data.fileName || '';
    this.fileSize = data.fileSize || 0;
    this.tags = data.tags || [];
    this.notes = data.notes || '';
    this.uploadDate = data.uploadDate || new Date().toISOString();
    this.lastModified = new Date().toISOString();
    this.isDefault = data.isDefault || false;
    this.category = data.category || 'Custom';
    this.difficulty = data.difficulty || 'intermediate';
    this.pieceCount = data.pieceCount || 0;
    this.description = data.description || '';
    
    // Don't set id - let IndexedDB auto-generate it
    if (data.id) {
      this.id = data.id;
    }
  }
}

export const patternStorage = {
  // Add new pattern
  async addPattern(patternData) {
    const db = await initDB();
    const pattern = new PatternItem(patternData);
    delete pattern.id; // Let IndexedDB auto-generate
    const id = await db.add(PATTERN_STORE, pattern);
    return { ...pattern, id };
  },

  // Get all patterns
  async getAllPatterns() {
    const db = await initDB();
    return db.getAll(PATTERN_STORE);
  },

  // Get pattern by ID
  async getPattern(id) {
    const db = await initDB();
    return db.get(PATTERN_STORE, id);
  },

  // Update pattern
  async updatePattern(id, updates) {
    const db = await initDB();
    const existing = await db.get(PATTERN_STORE, id);
    
    if (!existing) {
      throw new Error(`Pattern with id ${id} not found`);
    }
    
    const updated = {
      ...existing,
      ...updates,
      id,
      lastModified: new Date().toISOString()
    };
    
    await db.put(PATTERN_STORE, updated);
    return updated;
  },

  // Delete pattern
  async deletePattern(id) {
    const db = await initDB();
    await db.delete(PATTERN_STORE, id);
  },

  // Check if database is empty
  async isEmpty() {
    const db = await initDB();
    const count = await db.count(PATTERN_STORE);
    return count === 0;
  },

  // Clear all patterns
  async clearAll() {
    const db = await initDB();
    await db.clear(PATTERN_STORE);
  },

  // Check if default templates have been loaded
  async hasDefaultTemplates() {
    const db = await initDB();
    const patterns = await db.getAll(PATTERN_STORE);
    return patterns.some(pattern => pattern.isDefault === true);
  },

  // Get only default templates
  async getDefaultTemplates() {
    const db = await initDB();
    const patterns = await db.getAll(PATTERN_STORE);
    return patterns.filter(pattern => pattern.isDefault === true);
  }
};