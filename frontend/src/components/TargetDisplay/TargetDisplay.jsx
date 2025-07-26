import React from 'react';
import './targetDisplay.css';

const TargetDisplay = ({ targetSticker, foundStickers = [], showTarget = true }) => {
  
  if (!showTarget || !targetSticker) return null;

  /**
   * Genera un nombre amigable para mostrar
   */
  const getDisplayName = () => {
    if (targetSticker.descriptionsticker) {
      return targetSticker.descriptionsticker;
    }
    
    return targetSticker.namesticker
      .replace(/\.[^/.]+$/, '') // Remover extensión
      .replace(/[-_]/g, ' ') // Reemplazar guiones y underscores
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalizar palabras
  };

  return (
    <div className="target-display">
      <div className="target-header">
        <div className="target-icon">🎯</div>
        <h3 className="target-title">¡Encuentra este sticker!</h3>
      </div>
      
      <div className="target-content">
        <div className="target-image-container">
          <img 
            src={targetSticker.urlsticker} 
            alt={targetSticker.namesticker}
            className="target-image"
          />
          <div className="target-highlight-ring"></div>
        </div>
        
        <div className="target-info">
          <p className="target-description">
            {getDisplayName()}
          </p>
          
          <div className="target-stats">
            <span className="found-count">
              🎯 Encontrados: {foundStickers.length}
            </span>
          </div>
        </div>
      </div>
      
      <div className="target-pulse-indicator">
        <div className="pulse-ring"></div>
        <div className="pulse-ring-delayed"></div>
      </div>
    </div>
  );
};

export default TargetDisplay;
