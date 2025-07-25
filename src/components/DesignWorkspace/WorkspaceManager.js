import React, { useState, useEffect } from 'react';
import { patternStorage } from '../../services/patternStorage';
import { glassStorage } from '../../services/glassStorage';
import DesignCanvas from './DesignCanvas';
import SidePanel from './SidePanel';
import './DesignWorkspace.css';

const WorkspaceManager = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [glassInventory, setGlassInventory] = useState([]);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isLoading, setIsLoading] = useState(true);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [appliedGlass, setAppliedGlass] = useState({}); // shapeIndex -> glass application data
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);
  const [placementMode, setPlacementMode] = useState(null); // null or { glassId, glassData }
  const [pieces, setPieces] = useState([]);
  const [glassRotation, setGlassRotation] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, glassData] = await Promise.all([
        patternStorage.getAllPatterns(),
        glassStorage.getAllGlass()
      ]);
      
      setTemplates(templatesData);
      setGlassInventory(glassData);
      
      // Auto-select first template if available
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading workspace data:', error);
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    setSelectedTemplate(template);
    // Reset state when changing templates
    setAppliedGlass({});
    setSelectedShapeIndex(null);
    setPlacementMode(null);
    setPieces([]);
  };

  const handleGlassSelect = (glass) => {
    if (selectedShapeIndex !== null) {
      // Enter placement mode
      setPlacementMode({
        glassId: glass.id,
        glassData: glass
      });
    }
  };

  const handleGlassApplied = (shapeIndex, glassApplication) => {
    setAppliedGlass(prev => ({
      ...prev,
      [shapeIndex]: glassApplication
    }));
    setPlacementMode(null);
    setGlassRotation(0); // Reset rotation after applying
    // Keep shape selected so user can see what they just applied
  };

  const handleRemoveGlass = (shapeIndex) => {
    setAppliedGlass(prev => {
      const newApplied = { ...prev };
      delete newApplied[shapeIndex];
      return newApplied;
    });
  };

  const handleShapeSelect = (shapeIndex) => {
    setSelectedShapeIndex(shapeIndex);
    // Exit placement mode if selecting a different shape
    if (placementMode && shapeIndex !== selectedShapeIndex) {
      setPlacementMode(null);
    }
  };

  const calculateStatistics = () => {
    const stats = {
      totalShapes: 0,
      shapesWithGlass: Object.keys(appliedGlass).length,
      glassTypes: {},
      totalArea: 0
    };

    // Count glass usage
    Object.values(appliedGlass).forEach(application => {
      const glassName = application.glassData.name;
      stats.glassTypes[glassName] = (stats.glassTypes[glassName] || 0) + 1;
    });

    return stats;
  };

  if (isLoading) {
    return <div className="loading">Loading workspace...</div>;
  }

  if (templates.length === 0) {
    return (
      <div className="empty-workspace">
        <h2>No Templates Available</h2>
        <p>Please upload some templates first in the Templates section.</p>
      </div>
    );
  }

  return (
    <div className="design-workspace">
      <div className="workspace-header">
        <div className="template-selector">
          <label>Template:</label>
          <select 
            value={selectedTemplate?.id || ''} 
            onChange={(e) => handleTemplateChange(e.target.value)}
          >
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="project-name">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
          />
        </div>
        
      </div>

      <div className="workspace-content">
        {selectedTemplate && (
          <DesignCanvas
            template={selectedTemplate}
            appliedGlass={appliedGlass}
            selectedShapeIndex={selectedShapeIndex}
            onShapeSelect={handleShapeSelect}
            placementMode={placementMode}
            onGlassApplied={handleGlassApplied}
            onRemoveGlass={handleRemoveGlass}
            onPiecesLoaded={setPieces}
            glassRotation={glassRotation}
          />
        )}
        
        <SidePanel
          glassInventory={glassInventory}
          appliedGlass={appliedGlass}
          pieces={pieces}
          selectedShapeIndex={selectedShapeIndex}
          onGlassSelect={handleGlassSelect}
          onShapeSelect={handleShapeSelect}
          onRemoveGlass={handleRemoveGlass}
          isOpen={showSidePanel}
          onToggle={() => setShowSidePanel(!showSidePanel)}
          placementMode={placementMode}
          onGlassApplied={handleGlassApplied}
          onCancelPlacement={() => {
            setPlacementMode(null);
            setGlassRotation(0);
          }}
          glassRotation={glassRotation}
          onRotationChange={setGlassRotation}
        />
      </div>
    </div>
  );
};

export default WorkspaceManager;