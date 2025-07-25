import React, { useState, useEffect } from 'react';
import PatternUploader from './PatternUploader';
import PatternGallery from './PatternGallery';
import PatternEditorCanvas from './PatternEditorCanvas';
import { patternStorage } from '../../services/patternStorage';
import { getProcessedTemplates } from '../../data/templateSVGs';
import './PatternEditor.css';

const PatternManager = () => {
  const [patterns, setPatterns] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' or 'viewer'
  const [loadingMessage, setLoadingMessage] = useState('Loading patterns...');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      // Check if default templates have been loaded
      const hasDefaults = await patternStorage.hasDefaultTemplates();
      
      if (!hasDefaults) {
        // Load default templates for first time
        setLoadingMessage('Loading default templates...');
        console.log('Loading default templates...');
        
        // Use placeholder templates for now
        const defaultTemplates = getProcessedTemplates();
        
        // Try to load actual SVG content
        try {
          const { loadDefaultTemplatesData } = await import('../../data/defaultTemplates');
          const actualTemplates = await loadDefaultTemplatesData();
          if (actualTemplates && actualTemplates.length > 0) {
            console.log('Using actual SVG templates');
            // Use actual templates if loading succeeded
            const savePromises = actualTemplates.map(template => patternStorage.addPattern(template));
            await Promise.all(savePromises);
            console.log(`Loaded ${actualTemplates.length} default templates`);
          } else {
            throw new Error('No templates loaded');
          }
        } catch (error) {
          console.error('Failed to load actual templates, using placeholders:', error);
          // Fall back to placeholder templates
          setLoadingMessage('Using placeholder templates...');
          const savePromises = defaultTemplates.map(template => patternStorage.addPattern(template));
          await Promise.all(savePromises);
          console.log(`Loaded ${defaultTemplates.length} placeholder templates`);
        }
      }
      
      // Load all patterns (including defaults)
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

  const handleResetAllPatterns = async () => {
    if (isResetting) return; // Prevent multiple clicks
    
    const confirmMessage = `Are you sure you want to reset ALL templates? This will delete custom templates and reload the defaults.`;
    
    if (window.confirm(confirmMessage)) {
      // Double confirmation for safety
      if (window.confirm('This will reset all templates to defaults. Are you absolutely sure?')) {
        try {
          setIsResetting(true);
          setIsLoading(true);
          setLoadingMessage('Resetting templates...');
          
          // Clear all patterns
          await patternStorage.clearAll();
          
          // Reset state
          setPatterns([]);
          setSelectedPattern(null);
          setViewMode('gallery');
          
          // Reload patterns (which will reload defaults)
          await loadPatterns();
          
          alert('Templates have been reset to defaults successfully.');
        } catch (error) {
          console.error('Error resetting patterns:', error);
          alert('Failed to reset patterns. Please try again.');
        } finally {
          setIsResetting(false);
        }
      }
    }
  };

  return (
    <div className="pattern-manager">
      <div className="pattern-header">
        <h2>Template Editor</h2>
        <div className="header-actions">
          {viewMode === 'viewer' && (
            <button 
              className="back-to-gallery-btn"
              onClick={handleBackToGallery}
            >
              ← Back to Gallery
            </button>
          )}
          {viewMode === 'gallery' && patterns.length > 0 && (
            <button 
              className="reset-all-btn"
              onClick={handleResetAllPatterns}
              title="Reset all templates to defaults"
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : '↻ Reset to Defaults'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'gallery' ? (
        <>
          <PatternUploader onUpload={handleUpload} />
          
          {isLoading ? (
            <div className="loading">{loadingMessage}</div>
          ) : (
            <PatternGallery
              patterns={patterns}
              onSelectPattern={handleSelectPattern}
              onDeletePattern={handleDeletePattern}
            />
          )}
        </>
      ) : (
        <PatternEditorCanvas
          pattern={selectedPattern}
          onBack={handleBackToGallery}
          onPatternModified={handlePatternModified}
        />
      )}
    </div>
  );
};

export default PatternManager;