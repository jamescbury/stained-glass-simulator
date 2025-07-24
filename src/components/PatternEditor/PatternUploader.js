import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// Template patterns available in public folder
const TEMPLATE_PATTERNS = [
  { name: 'Daisy', file: 'daisy.svg', description: 'Simple flower pattern' },
  { name: 'Fence', file: 'fence.svg', description: 'Geometric fence design' },
  { name: 'Honeycomb', file: 'honeycomb.svg', description: 'Hexagonal honeycomb pattern' },
  { name: 'Squiggle Fence', file: 'squigle_fence.svg', description: 'Wavy fence pattern' },
  { name: 'Sunflower', file: 'sunflower.svg', description: 'Detailed sunflower design' },
  { name: 'Sunrise', file: 'sunrise.svg', description: 'Sunrise landscape pattern' }
];

const PatternUploader = ({ onUpload }) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const metadata = {
        name: file.name.replace(/\.svg$/i, '').replace(/[_-]/g, ' '),
        type: 'custom',
        tags: [],
        notes: ''
      };
      onUpload(file, metadata);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg']
    },
    maxFiles: 1
  });

  const handleTemplateSelect = async (template) => {
    try {
      const response = await fetch(`/stained-glass-simulator/template_patterns/${template.file}`);
      const svgText = await response.text();
      
      // Create a File object from the SVG text
      const file = new File([svgText], template.file, { type: 'image/svg+xml' });
      
      const metadata = {
        name: template.name,
        type: 'template',
        tags: ['template'],
        notes: template.description
      };
      
      onUpload(file, metadata);
      setShowTemplates(false);
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template pattern.');
    }
  };

  return (
    <div className="pattern-uploader">
      <div className="upload-options">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <div className="upload-icon">📐</div>
            <p>Drag & drop SVG pattern here</p>
            <p className="small">or click to select file</p>
            <p className="formats">SVG files only</p>
          </div>
        </div>
        
        <div className="or-divider">
          <span>OR</span>
        </div>
        
        <button 
          className="template-btn"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          <div className="template-icon">🎨</div>
          <p>Choose from Templates</p>
        </button>
      </div>

      {showTemplates && (
        <div className="template-gallery">
          <h3>Template Patterns</h3>
          <div className="template-grid">
            {TEMPLATE_PATTERNS.map(template => (
              <div 
                key={template.file}
                className="template-card"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="template-preview">
                  <img 
                    src={`/stained-glass-simulator/template_patterns/${template.file}`}
                    alt={template.name}
                  />
                </div>
                <h4>{template.name}</h4>
                <p>{template.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternUploader;