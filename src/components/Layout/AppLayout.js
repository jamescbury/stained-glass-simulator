import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './AppLayout.css';

function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="app-layout">
      <header className="app-header-minimal">
        <button className="hamburger-menu" onClick={toggleMenu}>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        <h1 className="app-title" onClick={() => navigate('/')}>Glassias</h1>
      </header>

      <div className={`nav-overlay ${menuOpen ? 'open' : ''}`} onClick={closeMenu}></div>
      
      <nav className={`side-nav ${menuOpen ? 'open' : ''}`}>
        <div className="nav-header">
          <h2>Menu</h2>
          <button className="close-menu" onClick={closeMenu}>×</button>
        </div>
        
        <NavLink to="/" className="nav-link" onClick={closeMenu}>
          Home
        </NavLink>
        <NavLink to="/inventory" className="nav-link" onClick={closeMenu}>
          Glass Inventory
        </NavLink>
        <NavLink to="/templates" className="nav-link" onClick={closeMenu}>
          Templates
        </NavLink>
        <NavLink to="/workspace" className="nav-link" onClick={closeMenu}>
          Design Workspace
        </NavLink>
      </nav>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;