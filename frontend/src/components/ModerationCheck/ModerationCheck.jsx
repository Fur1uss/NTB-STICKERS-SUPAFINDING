import React, { useState, useEffect } from 'react';
import moderationService from '../../services/moderationService.js';
import './ModerationCheck.css';

const ModerationCheck = ({ file, onModerationComplete, onClose, onUploadSuccess }) => {
  const [status, setStatus] = useState('loading'); // loading, analyzing, success, error, inappropriate
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [hasNotified, setHasNotified] = useState(false);

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
      } else {
        setStatus('inappropriate');
      }

      // Notificar al componente padre solo una vez
      if (!hasNotified) {
        console.log('📞 Notificando resultado de moderación al componente padre');
        setHasNotified(true);
        onModerationComplete(moderationResult);
      } else {
        console.log('🛑 Moderación ya notificada, ignorando llamada duplicada');
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
            <h2>Verificando contenido...</h2>
            <p>Estamos analizando tu imagen</p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
              Esto puede tomar unos segundos
            </p>
          </div>
        );

      case 'analyzing':
        return (
          <div className="moderation-check-content">
            <div className="loading-spinner"></div>
            <h2>Analizando imagen...</h2>
            <p>Verificando contenido apropiado</p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
              Procesando {progress}%
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="moderation-check-content success">
            <div className="success-icon">✅</div>
            <h2>¡Imagen apropiada!</h2>
            <p>Tu sticker ha pasado la verificación de moderación</p>
            {result && (
              <div className="moderation-details">
                <p><strong>Categoría principal:</strong> {result.dominantCategory}</p>
                <p><strong>Confianza:</strong> {result.confidence}%</p>
              </div>
            )}
            <button className="moderation-button" onClick={() => {
              // El upload ya se inició automáticamente, notificar éxito y cerrar
              if (onUploadSuccess) {
                onUploadSuccess();
              }
              handleClose();
            }}>
              Continuar
            </button>
          </div>
        );

      case 'inappropriate':
        return (
          <div className="moderation-check-content inappropriate">
            <div className="inappropriate-icon">🚫</div>
            <h2>Contenido inapropiado detectado</h2>
            <p>Tu imagen no cumple con las políticas de contenido</p>
            {result && (
              <div className="moderation-details">
                <p><strong>Categoría detectada:</strong> {result.dominantCategory}</p>
                <p><strong>Confianza:</strong> {result.confidence}%</p>
                <p><strong>Umbral:</strong> {result.threshold}%</p>
                <div className="category-breakdown">
                  <h4>Desglose por categorías:</h4>
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
              Intentar con otra imagen
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="moderation-check-content error">
            <div className="error-icon">❌</div>
            <h2>Error en la moderación</h2>
            <p>{error || 'Ocurrió un error al analizar la imagen'}</p>
            <p style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
              💡 No te preocupes, puedes continuar subiendo tu imagen sin verificación.
            </p>
            <div className="error-actions">
              <button className="moderation-button" onClick={performModeration}>
                Reintentar
              </button>
              <button className="moderation-button secondary" onClick={() => handleClose()}>
                Continuar sin moderación
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