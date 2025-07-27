import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModerationService from '../../services/imageModeration.js';
import './ModerationCheck.css';

const moderationService = new ModerationService();

const ModerationCheck = ({ file, onModerationComplete, onClose, onUploadSuccess }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, analyzing, success, error, inappropriate
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [hasNotified, setHasNotified] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  useEffect(() => {
    if (file && !hasNotified) {
      console.log('🔄 Iniciando moderación para archivo:', file.name);
      
      // Aplicar delay de 5 segundos antes de iniciar la moderación
      console.log('⏰ Iniciando delay de 5 segundos...');
      const delayTimer = setTimeout(() => {
        console.log('⏰ Delay completado, iniciando moderación...');
        performModeration();
      }, 5000); // 5 segundos de delay
      
      // Cleanup del timer si el componente se desmonta
      return () => {
        clearTimeout(delayTimer);
      };
    }
  }, [file, hasNotified]);

  // Efecto para countdown cuando la imagen es aprobada (sin redirección automática)
  useEffect(() => {
    if (status === 'success') {
      // Solo mostrar countdown, el componente padre manejará el cierre
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Cleanup del interval
      return () => {
        clearInterval(countdownInterval);
      };
    }
  }, [status]);

  /**
   * Realiza la moderación de la imagen
   */
  const performModeration = async () => {
    try {
      setStatus('loading');
      setProgress(10);
      setError('');

      // Simular progreso de carga del modelo
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Cargar modelo si no está cargado
      if (!moderationService.isReady()) {
        await moderationService.loadModel();
      }

      clearInterval(progressInterval);
      setProgress(95);
      setStatus('analyzing');

      // Analizar la imagen
      const moderationResult = await moderationService.analyzeImage(file);
      
      setProgress(100);
      setResult(moderationResult);

      if (moderationResult.isAppropriate) {
        setStatus('success');
        // Notificar al componente padre que la imagen es apropiada para proceder con upload
        if (!hasNotified) {
          console.log('📞 Notificando resultado de moderación (apropiada) al componente padre');
          setHasNotified(true);
          onModerationComplete(moderationResult);
        }
      } else {
        setStatus('inappropriate');
        // Solo notificar al componente padre si NO es apropiada
        if (!hasNotified) {
          console.log('📞 Notificando resultado de moderación (inapropiada) al componente padre');
          setHasNotified(true);
          onModerationComplete(moderationResult);
        }
      }

    } catch (error) {
      console.error('❌ Error en moderación:', error);
      
      // Proporcionar mensajes de error más específicos
      let errorMessage = 'Error al analizar la imagen';
      if (error.message.includes('No se pudo cargar el modelo')) {
        errorMessage = 'No se pudo cargar el sistema de moderación. Continuando sin verificación.';
      } else if (error.message.includes('Tipo de imagen no soportado')) {
        errorMessage = 'Formato de imagen no soportado. Por favor, usa PNG, JPG o WebP.';
      } else if (error.message.includes('No se pudo cargar la imagen')) {
        errorMessage = 'No se pudo procesar la imagen. Verifica que el archivo no esté corrupto.';
      }
      
      setError(errorMessage);
      setStatus('error');
      
      // Notificar al componente padre solo una vez
      if (!hasNotified) {
        console.log('📞 Notificando error de moderación al componente padre');
        setHasNotified(true);
        onModerationComplete({ error: errorMessage });
      } else {
        console.log('🛑 Error de moderación ya notificado, ignorando llamada duplicada');
      }
    }
  };

  /**
   * Maneja el cierre del componente
   */
  const handleClose = () => {
    console.log('🔄 Cerrando moderación...');
    if (onClose) {
      onClose();
    }
  };

    /**
   * Renderiza el contenido según el estado
   */
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="moderation-check-content">
            <div className="loading-spinner"></div>
            <h2>Checking image...</h2>
            <p>We're analyzing your image</p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
              This may take a few seconds
            </p>
          </div>
        );

      case 'analyzing':
        return (
          <div className="moderation-check-content">
            <div className="loading-spinner"></div>
            <h2>Analyzing image...</h2>
            <p>Checking for appropriate content</p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
              Processing {progress}%
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="moderation-check-content success">
            <div className="success-icon">✅</div>
            <h2>Image Approved!</h2>
            {result && (
              <div className="moderation-details">
                <p><strong>Main Category:</strong> {result.dominantCategory}</p>
                <p><strong>Confidence:</strong> {result.confidence}%</p>
              </div>
            )}
            <div className="redirect-info">
              <p>Redirecting to home in <strong>{redirectCountdown}</strong> seconds...</p>
            </div>
            <button className="moderation-button" onClick={() => {
              // Redireccionar inmediatamente si el usuario hace clic
              console.log('🏠 Redirección manual a la página principal...');
              navigate('/');
            }}>
              Go to Home Now
            </button>
          </div>
        );

      case 'inappropriate':
        return (
          <div className="moderation-check-content inappropriate">
            <div className="inappropriate-icon">🚫</div>
            <h2>Inappropriate Content Detected</h2>
            <p>Your image does not comply with content policies</p>
            {result && (
              <div className="moderation-details">
                <p><strong>Detected Category:</strong> {result.dominantCategory}</p>
                <p><strong>Confidence:</strong> {result.confidence}%</p>
                <p><strong>Threshold:</strong> {result.threshold}%</p>
                <div className="category-breakdown">
                  <h4>Category Breakdown:</h4>
                  {Object.entries(result.percentages).map(([category, percentage]) => (
                    <div key={category} className="category-item">
                      <span className="category-name">{category}:</span>
                      <span className="category-percentage">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button className="moderation-button inappropriate" onClick={() => handleClose()}>
              Try Another Image
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="moderation-check-content error">
            <div className="error-icon">❌</div>
            <h2>Moderation Error</h2>
            <p>{error || 'An error occurred while analyzing the image'}</p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
              💡 Don't worry, you can continue uploading your image without verification.
            </p>
            <div className="error-actions">
              <button className="moderation-button" onClick={performModeration}>
                Retry
              </button>
              <button className="moderation-button secondary" onClick={() => handleClose()}>
                Continue Without Moderation
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
};

export default ModerationCheck; 