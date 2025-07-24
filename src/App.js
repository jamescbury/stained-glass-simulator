import React, { useState } from 'react';
import './App.css';
import InventoryManager from './components/GlassInventory/InventoryManager';

function App() {
  const [activeView, setActiveView] = useState('inventory');

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stained Glass Simulator</h1>
        <nav className="app-nav">
          <button 
            className={`nav-btn ${activeView === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveView('inventory')}
          >
            Glass Inventory
          </button>
          <button 
            className={`nav-btn ${activeView === 'pattern' ? 'active' : ''}`}
            onClick={() => setActiveView('pattern')}
            disabled
          >
            Pattern Editor (Coming Soon)
          </button>
          <button 
            className={`nav-btn ${activeView === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveView('workspace')}
            disabled
          >
            Design Workspace (Coming Soon)
          </button>
        </nav>
      </header>
      <main>
        {activeView === 'inventory' && <InventoryManager />}
        {activeView === 'pattern' && (
          <div className="coming-soon">
            <h2>Pattern Editor</h2>
            <p>Upload and edit SVG patterns - Coming in Phase 2</p>
          </div>
        )}
        {activeView === 'workspace' && (
          <div className="coming-soon">
            <h2>Design Workspace</h2>
            <p>Apply glass to patterns - Coming in Phase 3</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;