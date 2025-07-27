import React, { useState, useEffect } from 'react';
import './OrientationGuard.css';

const OrientationGuard = ({ children }) => {
  const [isValidOrientation, setIsValidOrientation] = useState(true);
  const [screenInfo, setScreenInfo] = useState({ width: 0, height: 0, ratio: 0 });

  const checkOrientation = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;

    // Actualizar información de pantalla
    setScreenInfo({ width, height, ratio });

    // Ser mucho más permisivo: solo bloquear dispositivos muy pequeños o verticales extremos
    // Permitir desde 4:3 (1.33) hasta ultrawide 21:9+ (2.4)
    const minRatio = 1.2;   // Muy permisivo
    const minWidth = 900;   // Ancho mínimo reducido
    const minHeight = 500;  // Alto mínimo reducido
    
    // Solo bloquear si es muy estrecho, muy pequeño, o claramente vertical
    const isValid = ratio >= minRatio && width >= minWidth && height >= minHeight;
    
    console.log('📱 Verificación de orientación (permisiva):', {
      width,
      height,
      ratio: ratio.toFixed(3),
      minRatio,
      isValid,
      orientation: width > height ? 'horizontal' : 'vertical'
    });

    setIsValidOrientation(isValid);
  };

  useEffect(() => {
    // Verificar orientación al montar
    checkOrientation();

    // Agregar listener para cambios de tamaño/orientación con debounce más largo
    let resizeTimeout;
    
    const handleResize = () => {
      // Debounce largo para evitar interrumpir el juego durante ajustes de ventana
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkOrientation, 500); // 500ms de delay
    };

    const handleOrientationChange = () => {
      // Delay más largo para orientación móvil
      setTimeout(checkOrientation, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Función para bloquear todos los eventos
  const handleBlockEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <>
      {/* El contenido del juego siempre se renderiza */}
      {children}
      
      {/* Overlay de bloqueo que aparece solo cuando es necesario */}
      {!isValidOrientation && (
        <div 
          className="orientation-overlay"
          onMouseDown={handleBlockEvent}
          onMouseUp={handleBlockEvent}
          onMouseMove={handleBlockEvent}
          onClick={handleBlockEvent}
          onDoubleClick={handleBlockEvent}
          onContextMenu={handleBlockEvent}
          onTouchStart={handleBlockEvent}
          onTouchMove={handleBlockEvent}
          onTouchEnd={handleBlockEvent}
          onTouchCancel={handleBlockEvent}
          onPointerDown={handleBlockEvent}
          onPointerUp={handleBlockEvent}
          onPointerMove={handleBlockEvent}
          onPointerCancel={handleBlockEvent}
          onKeyDown={handleBlockEvent}
          onKeyUp={handleBlockEvent}
          onKeyPress={handleBlockEvent}
          onWheel={handleBlockEvent}
          onScroll={handleBlockEvent}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'all',
            userSelect: 'none',
            touchAction: 'none'
          }}
        >
          <div className="orientation-guard">
            <div className="orientation-message">
              <div className="orientation-icon">
                📱➡️💻
              </div>
              
              <h1 className="orientation-title">
                Screen Too Small!
              </h1>
              
              <div className="orientation-content">
                <p className="orientation-description">
                  This game requires a <strong>larger screen</strong> for the best experience.
                </p>
                
                <div className="current-resolution">
                  <p>📊 Current resolution: <span className="resolution-text">{screenInfo.width} × {screenInfo.height}</span></p>
                  <p>📐 Aspect ratio: <span className="ratio-text">{screenInfo.ratio.toFixed(3)}:1</span></p>
                  <p>🎯 Minimum required: <span className="target-ratio">900×500 pixels</span></p>
                </div>

                <div className="orientation-instructions">
                  <div className="instruction-item">
                    <span className="instruction-icon">📱</span>
                    <span>On mobile: Rotate to landscape or use a tablet</span>
                  </div>
                  <div className="instruction-item">
                    <span className="instruction-icon">💻</span>
                    <span>On PC: Increase window size</span>
                  </div>
                  <div className="instruction-item">
                    <span className="instruction-icon">🖥️</span>
                    <span>Works on: any resolution ≥ 900×500</span>
                  </div>
                </div>
              </div>

              <div className="orientation-animation">
                <div className="device-rotate">
                  <div className="device vertical"></div>
                  <div className="arrow">↻</div>
                  <div className="device horizontal"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrientationGuard;
