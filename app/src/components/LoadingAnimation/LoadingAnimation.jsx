import React, { useState, useEffect } from 'react';
import './LoadingAnimation.css';

const LoadingAnimation = () => {
  const [currentFrame, setCurrentFrame] = useState(1);

  // Array de imágenes de loading
  const loadingFrames = [
    '/loading01.webp',
    '/loading02.webp',
    '/loading03.webp',
    '/loading04.webp'
  ];

  useEffect(() => {
    // Cambiar frame cada 400ms para que dure aproximadamente 3 segundos el ciclo completo
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev >= 4 ? 1 : prev + 1;
        return nextFrame;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-animation-container">
      <img 
        src={loadingFrames[currentFrame - 1]}
        alt={`Loading frame ${currentFrame}`}
        className="loading-frame-large"
      />
    </div>
  );
};

export default LoadingAnimation;
