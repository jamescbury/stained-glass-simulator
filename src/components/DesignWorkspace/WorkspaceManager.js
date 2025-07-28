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
    // Reset all state when changing templates
    setAppliedGlass({});
    setSelectedShapeIndex(null);
    setPlacementMode(null);
    setPieces([]);
    setGlassRotation(0);
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
      totalShapes: pieces.length,
      shapesWithGlass: 0,
      glassTypes: {},
      totalArea: 0,
      glassUsage: [] // Array of glass usage details
    };

    // Count glass usage and build detailed list
    const glassMap = new Map();
    
    // Only count glass applications for valid pieces in the current template
    Object.entries(appliedGlass).forEach(([shapeIndex, application]) => {
      const index = parseInt(shapeIndex);
      
      // Verify this shape index exists in the current pieces array
      if (index >= 0 && index < pieces.length) {
        stats.shapesWithGlass++;
        
        const glassId = application.glassId;
        const glassData = application.glassData;
        
        if (!glassMap.has(glassId)) {
          glassMap.set(glassId, {
            glass: glassData,
            count: 0,
            shapes: []
          });
        }
        
        const usage = glassMap.get(glassId);
        usage.count++;
        usage.shapes.push(index + 1); // User-friendly numbering
      }
    });
    
    // Convert map to array for easier rendering
    stats.glassUsage = Array.from(glassMap.values()).sort((a, b) => 
      a.glass.name.localeCompare(b.glass.name)
    );

    return stats;
  };
  
  const handleExportCSV = () => {
    const stats = calculateStatistics();
    
    // Create CSV content
    let csvContent = "Glass Usage Report\n";
    csvContent += `Project Name: ${projectName}\n`;
    csvContent += `Template: ${selectedTemplate?.name || 'Unknown'}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    csvContent += "Summary\n";
    csvContent += `Total Shapes,${stats.totalShapes}\n`;
    csvContent += `Shapes with Glass,${stats.shapesWithGlass}\n`;
    csvContent += `Completion,${stats.totalShapes > 0 ? Math.round((stats.shapesWithGlass / stats.totalShapes) * 100) : 0}%\n`;
    csvContent += `Glass Types Used,${stats.glassUsage.length}\n\n`;
    
    csvContent += "Glass Usage Details\n";
    csvContent += "Glass Name,Code,Manufacturer,Quantity,Shape Numbers\n";
    
    stats.glassUsage.forEach(usage => {
      csvContent += `"${usage.glass.name}","${usage.glass.code || ''}","${usage.glass.manufacturer || 'Unknown'}",${usage.count},"#${usage.shapes.join(', #')}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${projectName.replace(/[^a-z0-9]/gi, '_')}_glass_usage.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    // Create a print-specific view
    const printWindow = window.open('', '_blank');
    const stats = calculateStatistics();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${projectName} - Stained Glass Project</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #ddd;
            }
            
            .header h1 {
              margin: 0 0 10px 0;
              color: #2c3e50;
            }
            
            .header .date {
              color: #666;
              font-size: 14px;
            }
            
            .template-preview {
              margin: 30px auto;
              text-align: center;
              page-break-inside: avoid;
            }
            
            .template-preview svg {
              max-width: 100%;
              max-height: 600px;
              border: 1px solid #ddd;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .statistics {
              margin-top: 40px;
              page-break-inside: avoid;
            }
            
            .statistics h2 {
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            
            .stat-box {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #dee2e6;
            }
            
            .stat-box h3 {
              margin: 0 0 10px 0;
              color: #495057;
              font-size: 16px;
            }
            
            .stat-value {
              font-size: 28px;
              font-weight: bold;
              color: #3498db;
            }
            
            .glass-usage {
              margin-top: 30px;
            }
            
            .glass-item {
              background: #fff;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 15px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .glass-info {
              flex: 1;
            }
            
            .glass-name {
              font-weight: bold;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            
            .glass-details {
              font-size: 14px;
              color: #666;
            }
            
            .glass-shapes {
              font-size: 12px;
              color: #888;
              margin-top: 5px;
            }
            
            .glass-preview {
              width: 60px;
              height: 60px;
              border-radius: 4px;
              border: 1px solid #ddd;
              margin-left: 20px;
            }
            
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${projectName || 'Untitled Project'}</h1>
            <div class="date">Generated on ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
          
          <div class="template-preview">
            <h2>Template: ${selectedTemplate?.name || 'Unknown'}</h2>
            <div id="svg-container"></div>
          </div>
          
          <div class="statistics">
            <h2>Project Statistics</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <h3>Total Shapes</h3>
                <div class="stat-value">${stats.totalShapes}</div>
              </div>
              <div class="stat-box">
                <h3>Shapes with Glass</h3>
                <div class="stat-value">${stats.shapesWithGlass}</div>
              </div>
              <div class="stat-box">
                <h3>Completion</h3>
                <div class="stat-value">${stats.totalShapes > 0 ? Math.round((stats.shapesWithGlass / stats.totalShapes) * 100) : 0}%</div>
              </div>
              <div class="stat-box">
                <h3>Glass Types Used</h3>
                <div class="stat-value">${stats.glassUsage.length}</div>
              </div>
            </div>
          </div>
          
          <div class="glass-usage">
            <h2>Glass Usage Details</h2>
            ${stats.glassUsage.map(usage => `
              <div class="glass-item">
                <div class="glass-info">
                  <div class="glass-name">${usage.glass.name}</div>
                  <div class="glass-details">
                    ${usage.glass.code ? `Code: ${usage.glass.code} | ` : ''}
                    ${usage.glass.manufacturer || 'Unknown Manufacturer'}
                  </div>
                  <div class="glass-shapes">
                    Used in ${usage.count} shape${usage.count !== 1 ? 's' : ''}: 
                    #${usage.shapes.join(', #')}
                  </div>
                </div>
                ${usage.glass.imageUrl || usage.glass.imageData ? `
                  <div class="glass-preview" style="background-image: url(${usage.glass.imageData || usage.glass.imageUrl}); background-size: cover; background-position: center;"></div>
                ` : usage.glass.primaryColor ? `
                  <div class="glass-preview" style="background-color: ${usage.glass.primaryColor}"></div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Generated by Stained Glass Simulator</p>
          </div>
          
          <script>
            // We'll inject the SVG content here
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
    
    // Get the current SVG content with applied glass
    setTimeout(() => {
      const svgElement = document.querySelector('.svg-content-wrapper svg');
      if (svgElement) {
        const svgClone = svgElement.cloneNode(true);
        
        // Remove selection indicators and reset strokes
        svgClone.querySelectorAll('[data-piece-index]').forEach(el => {
          el.classList.remove('selected-piece');
          el.style.filter = '';
          // Reset stroke to black for print
          el.setAttribute('stroke', '#000000');
          el.setAttribute('stroke-width', '1');
        });
        
        // Remove any red flash fills
        svgClone.querySelectorAll('[data-piece-index]').forEach(el => {
          const originalFill = el.getAttribute('data-original-fill');
          if (originalFill && originalFill !== 'none') {
            el.setAttribute('fill', originalFill);
          }
          el.style.fill = '';
          el.style.fillOpacity = '';
        });
        
        const svgContainer = printWindow.document.getElementById('svg-container');
        if (svgContainer) {
          svgContainer.innerHTML = svgClone.outerHTML;
        }
      }
      
      printWindow.document.close();
    }, 100);
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
        
        <div className="workspace-actions">
          <button 
            className="export-button"
            onClick={() => handleExportCSV()}
            title="Export CSV"
          >
            Export CSV
          </button>
          <button 
            className="controls-button"
            onClick={() => setShowSidePanel(!showSidePanel)}
            title="Toggle controls"
          >
            Controls
          </button>
        </div>
        
      </div>

      <div className="workspace-content">
        {selectedTemplate && (
          <DesignCanvas
            key={selectedTemplate.id} // Force remount when template changes
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