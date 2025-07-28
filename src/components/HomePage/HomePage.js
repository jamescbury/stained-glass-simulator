import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <div className="homepage-container">
        <div className="logo-side">
          <img src={process.env.PUBLIC_URL + '/logo.svg'} alt="Glassias Logo" className="homepage-logo" />
        </div>
        
        <div className="content-side">
          <div className="content-wrapper">
            <h1 className="brand-name">Glassias</h1>
            <p className="tagline">Your Stained Glass Assistant</p>
            
            <div className="subtitle-section">
              <p className="subtitle-line">test out your designs</p>
              <p className="subtitle-line italic">before you bust your glass</p>
            </div>
            
            <div className="nav-buttons">
              <div className="button-row">
                <button 
                  className="nav-button"
                  onClick={() => navigate('/inventory')}
                >
                  Glass<br />Inventory
                </button>
                <button 
                  className="nav-button"
                  onClick={() => navigate('/templates')}
                >
                  Design<br />Templates
                </button>
              </div>
              <button 
                className="nav-button workbench-button"
                onClick={() => navigate('/workspace')}
              >
                Workbench
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="homepage-footer">
        <span>A vibecode experiment built with Claude Code</span>
        <svg className="claude-logo" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#000000"/>
          <path d="M17.5 12.5L13.5 8.5V11.5H7.5C6.4 11.5 5.5 12.4 5.5 13.5V14.5H7.5V13.5C7.5 13.5 7.5 12.5 8.5 12.5H13.5V15.5L17.5 12.5Z" fill="white"/>
        </svg>
      </footer>
    </div>
  );
}

export default HomePage;