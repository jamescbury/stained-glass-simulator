import { glassStorage } from '../services/glassStorage';

export async function resetDatabase() {
  try {
    console.log('Clearing database...');
    await glassStorage.clearAll();
    console.log('Database cleared. Page will reload to reinitialize samples.');
    window.location.reload();
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

// Add to window for easy access in console
if (typeof window !== 'undefined') {
  window.resetGlassDB = resetDatabase;
}