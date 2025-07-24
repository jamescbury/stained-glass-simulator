import React, { useState, useEffect } from 'react';
import PatternUploader from './PatternUploader';
import PatternGallery from './PatternGallery';
import PatternViewer from './PatternViewer';
import { patternStorage } from '../../services/patternStorage';
import './PatternEditor.css';

const PatternManager = () => {
  const [patterns, setPatterns] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or 'viewer'

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const items = await patternStorage.getAllPatterns();
      setPatterns(items);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading patterns:', error);
      setIsLoading(false);
    }
  };

  const handleUpload = async (file, metadata) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const svgContent = reader.result;
        
        const newPattern = {
          ...metadata,
          svgContent,
          fileName: file.name,
          fileSize: file.size,
          uploadDate: new Date().toISOString()
        };
        
        await patternStorage.addPattern(newPattern);
        await loadPatterns();
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading pattern:', error);
      alert('Failed to upload pattern. Please try again.');
    }
  };

  const handleSelectPattern = (pattern) => {
    setSelectedPattern(pattern);
    setViewMode('viewer');
  };

  const handleDeletePattern = async (patternId) => {
    if (window.confirm('Are you sure you want to delete this pattern?')) {
      try {
        await patternStorage.deletePattern(patternId);
        await loadPatterns();
        if (selectedPattern?.id === patternId) {
          setSelectedPattern(null);
          setViewMode('gallery');
        }
      } catch (error) {
        console.error('Error deleting pattern:', error);
        alert('Failed to delete pattern. Please try again.');
      }
    }
  };

  const handleBackToGallery = () => {
    setViewMode('gallery');
  };

  const handlePatternModified = async (patternId, updates) => {
    try {
      await patternStorage.updatePattern(patternId, updates);
      // Reload patterns to reflect changes
      await loadPatterns();
    } catch (error) {
      console.error('Error updating pattern:', error);
    }
  };

  return (
    <div className="pattern-manager">
      <div className="pattern-header">
        <h2>Template Editor</h2>
        {viewMode === 'viewer' && (
          <button 
            className="back-to-gallery-btn"
            onClick={handleBackToGallery}
          >
            ← Back to Gallery
          </button>
        )}
      </div>

      {viewMode === 'gallery' ? (
        <>
          <PatternUploader onUpload={handleUpload} />
          
          {isLoading ? (
            <div className="loading">Loading patterns...</div>
          ) : (
            <PatternGallery
              patterns={patterns}
              onSelectPattern={handleSelectPattern}
              onDeletePattern={handleDeletePattern}
            />
          )}
        </>
      ) : (
        <PatternViewer
          pattern={selectedPattern}
          onBack={handleBackToGallery}
          onPatternModified={handlePatternModified}
        />
      )}
    </div>
  );
};

export default PatternManager;