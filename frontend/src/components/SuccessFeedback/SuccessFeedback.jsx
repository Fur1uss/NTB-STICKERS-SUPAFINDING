import React, { useEffect } from 'react';
import './successFeedback.css';

const SuccessFeedback = ({ show, stickerName, onHide }) => {
  
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        if (onHide) onHide();
      }, 1500); // Reducido a 1.5 segundos
      
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className={`success-notification ${show ? 'show' : ''}`}>
      <div className="success-content">
        <div className="success-icon">🎉</div>
        <div className="success-text">
          <div className="success-title">¡Encontrado!</div>
          <div className="success-message">{stickerName}</div>
          <div className="success-bonus">+5s bonus</div>
        </div>
      </div>
      <div className="success-progress-bar"></div>
    </div>
  );
};

export default SuccessFeedback;
