import { useState, useEffect, useCallback } from 'react';
import uploadLimitService from '../services/uploadLimitService';

/**
 * Hook personalizado para manejar límites de uploads de stickers
 * @param {string} userId - ID del usuario autenticado
 * @returns {Object} Estado y funciones del límite de uploads
 */
export const useUploadLimit = (userId) => {
  const [limitData, setLimitData] = useState({
    uploadsInPeriod: 0,
    canUpload: true,
    remainingUploads: 3,
    limit: 3,
    timeWindowHours: 12,
    nextReset: null,
    resetIn: '12h 0m',
    loading: true,
    error: null
  });

  const [isChecking, setIsChecking] = useState(false);

  /**
   * Verifica el límite actual del usuario
   */
  const checkLimit = useCallback(async () => {
    if (!userId) {
      console.log('⚠️ No hay userId, no se puede verificar límite');
      return;
    }

    try {
      setIsChecking(true);
      console.log('🔄 Verificando límite de uploads...');
      
      const result = await uploadLimitService.getLimitInfo(userId);
      
      setLimitData({
        ...result,
        loading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ Error verificando límite:', error);
      
      setLimitData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    } finally {
      setIsChecking(false);
    }
  }, [userId]);

  /**
   * Verifica si el usuario puede hacer un upload
   * @returns {Promise<boolean>}
   */
  const canUpload = useCallback(async () => {
    if (!userId) return false;
    
    try {
      const result = await uploadLimitService.canUserUpload(userId);
      return result;
    } catch (error) {
      console.error('❌ Error verificando si puede subir:', error);
      return false; // En caso de error, no permitir upload
    }
  }, [userId]);

  /**
   * Actualiza el contador después de un upload exitoso
   */
  const refreshAfterUpload = useCallback(async () => {
    console.log('🔄 Actualizando límite después de upload...');
    await checkLimit();
  }, [checkLimit]);

  /**
   * Fuerza una actualización del límite
   */
  const forceRefresh = useCallback(() => {
    checkLimit();
  }, [checkLimit]);

  // Verificar límite al montar el componente o cambiar userId
  useEffect(() => {
    if (userId) {
      checkLimit();
    }
  }, [userId, checkLimit]);

  // Auto-refresh cada 5 minutos para mantener datos actualizados
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh del límite de uploads');
      checkLimit();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [userId, checkLimit]);

  return {
    // Estado del límite
    ...limitData,
    
    // Estados de carga
    isChecking,
    
    // Funciones
    canUpload,
    refreshAfterUpload,
    forceRefresh,
    
    // Información útil para UI
    isAtLimit: limitData.remainingUploads === 0,
    percentageUsed: Math.round((limitData.uploadsInPeriod / limitData.limit) * 100),
    
    // Mensajes para UI
    statusMessage: limitData.canUpload 
      ? `${limitData.remainingUploads} uploads remaining` 
      : `Upload limit reached. Reset in ${limitData.resetIn}`,
    
    limitText: `${limitData.uploadsInPeriod}/${limitData.limit} uploads used (12h window)`
  };
};
