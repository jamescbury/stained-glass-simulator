import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage/HomePage';
import AppLayout from './components/Layout/AppLayout';
import InventoryManager from './components/GlassInventory/InventoryManager';
import PatternManager from './components/PatternEditor/PatternManager';
import WorkspaceManager from './components/DesignWorkspace/WorkspaceManager';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/inventory" element={
          <AppLayout>
            <InventoryManager />
          </AppLayout>
        } />
        <Route path="/templates" element={
          <AppLayout>
            <PatternManager />
          </AppLayout>
        } />
        <Route path="/workspace" element={
          <AppLayout>
            <WorkspaceManager />
          </AppLayout>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;