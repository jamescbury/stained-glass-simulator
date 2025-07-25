import React, { useState } from 'react';
import './App.css';
import InventoryManager from './components/GlassInventory/InventoryManager';
import PatternManager from './components/PatternEditor/PatternManager';
import WorkspaceManager from './components/DesignWorkspace/WorkspaceManager';

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
          >
            Templates
          </button>
          <button 
            className={`nav-btn ${activeView === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveView('workspace')}
          >
            Design Workspace
          </button>
        </nav>
      </header>
      <main>
        {activeView === 'inventory' && <InventoryManager />}
        {activeView === 'pattern' && <PatternManager />}
        {activeView === 'workspace' && <WorkspaceManager />}
      </main>
    </div>
  );
}

export default App;