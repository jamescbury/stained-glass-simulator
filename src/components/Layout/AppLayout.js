import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './AppLayout.css';

function AppLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <header className="app-header-minimal">
        <h1 className="app-title" onClick={() => navigate('/')}>Glassias</h1>
        
        <nav className="header-nav">
          <NavLink to="/inventory" className="header-nav-button">
            Inventory
          </NavLink>
          <NavLink to="/templates" className="header-nav-button">
            Templates
          </NavLink>
          <NavLink to="/workspace" className="header-nav-button">
            Workspace
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;