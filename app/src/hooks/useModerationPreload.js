import { useState, useEffect } from 'react';
import moderationService from '../services/moderationService.js';

/**
 * Hook para precargar el modelo de moderación en segundo plano
 * Mejora la experiencia del usuario al tener el modelo listo cuando se necesite
 */
export const useModerationPreload = () => {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Precargar el modelo cuando el componente se monta
    preloadModel();
  }, []);

  /**
   * Precarga el modelo de moderación
   */
  const preloadModel = async () => {
    // Solo precargar si no está ya cargado y no está en proceso
    if (moderationService.isReady() || isPreloading) {
      setIsPreloaded(true);
      return;
    }

    try {
      setIsPreloading(true);
      setError(null);
      
      // Precargar el modelo en segundo plano
      await moderationService.loadModel();
      
      setIsPreloaded(true);
      setIsPreloading(false);
      
    } catch (error) {
      console.error('❌ Error precargando modelo de moderación:', error);
      setError(error.message);
      setIsPreloading(false);
      // No establecer isPreloaded como false para permitir carga bajo demanda
    }
  };

  /**
   * Reintenta la precarga del modelo
   */
  const retryPreload = () => {
    setError(null);
    preloadModel();
  };

  return {
    isPreloaded,
    isPreloading,
    error,
    retryPreload,
    // Exponer el estado del servicio para verificación adicional
    serviceReady: moderationService.isReady(),
    serviceLoadingState: moderationService.getLoadingState()
  };
}; 