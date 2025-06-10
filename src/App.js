import React, { useState } from 'react';
import './App.css';
import StainedGlassSimulator from './components/StainedGlassSimulator';

function App() {
  return (
    <div className="App">
      <h1>Stained Glass Simulator</h1>
      <StainedGlassSimulator />
    </div>
  );
}

export default App;