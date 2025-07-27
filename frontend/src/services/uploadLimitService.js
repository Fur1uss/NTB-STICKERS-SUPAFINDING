import supabase from '../config/supabaseClient.js';

/**
 * Servicio para manejar límites de uploads de stickers
 * LÍMITE: 1 sticker cada 1 hora por usuario
 */
class UploadLimitService {
  constructor() {
    this.UPLOAD_LIMIT = 1;           // 1 sticker por ventana
    this.TIME_WINDOW_HOURS = 1;      // Ventana de 1 hora
  }

  /**
   * Verifica si el usuario puede subir un sticker basado en uploads de la última hora
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información sobre el límite de uploads
   */
  async checkDailyLimit(userId) {
    try {
      console.log('⏰ Verificando límite de 1 hora para usuario:', userId);
      
      // Verificar uploads en la última hora usando la consulta optimizada
      const { data: recentUploads, error } = await supabase
        .from('stickers')
        .select('id, namesticker, created_at')
        .eq('iduser', userId)
        .gte('created_at', new Date(Date.now() - (this.TIME_WINDOW_HOURS * 60 * 60 * 1000)).toISOString());

      if (error) {
        console.error('❌ Error verificando uploads recientes:', error);
        throw new Error('Error checking recent uploads');
      }

      const uploadsInLastHour = recentUploads?.length || 0;
      const canUpload = uploadsInLastHour === 0; // Solo puede subir si NO hay uploads en 1 hora
      const remainingUploads = canUpload ? 1 : 0;

      // Calcular cuándo podrá subir de nuevo
      let nextAllowedTime = null;
      let resetIn = 'Disponible ahora';
      
      if (!canUpload && recentUploads.length > 0) {
        // Encontrar el upload más reciente y calcular cuándo expira el límite
        const mostRecentUpload = new Date(recentUploads[0].created_at);
        nextAllowedTime = new Date(mostRecentUpload.getTime() + (this.TIME_WINDOW_HOURS * 60 * 60 * 1000));
        
        const timeUntilReset = nextAllowedTime.getTime() - Date.now();
        const minutesLeft = Math.floor(timeUntilReset / (1000 * 60));
        const secondsLeft = Math.floor((timeUntilReset % (1000 * 60)) / 1000);
        
        resetIn = minutesLeft > 0 ? `${minutesLeft}m ${secondsLeft}s` : `${secondsLeft}s`;
      }

      const result = {
        uploadsInPeriod: uploadsInLastHour,
        canUpload,
        remainingUploads,
        limit: this.UPLOAD_LIMIT,
        timeWindowHours: this.TIME_WINDOW_HOURS,
        nextReset: nextAllowedTime?.toISOString() || null,
        resetIn,
        recentUploads: recentUploads || []
      };

      console.log('📊 Resultado del límite de 1 hora:', result);
      
      if (recentUploads?.length > 0) {
        console.log('📋 Uploads recientes encontrados:');
        recentUploads.forEach((upload, index) => {
          const uploadTime = new Date(upload.created_at);
          const timeSince = Math.floor((Date.now() - uploadTime.getTime()) / (1000 * 60));
          console.log(`   ${index + 1}. ${upload.namesticker} - hace ${timeSince} minutos`);
        });
      } else {
        console.log('✅ No hay uploads en la última hora - puede subir');
      }
      
      return result;

    } catch (error) {
      console.error('❌ Error en checkDailyLimit:', error);
      
      // En caso de error, no permitir upload por seguridad
      return {
        uploadsInPeriod: 999,
        canUpload: false,
        remainingUploads: 0,
        limit: this.UPLOAD_LIMIT,
        timeWindowHours: this.TIME_WINDOW_HOURS,
        nextReset: null,
        resetIn: 'Error - intenta más tarde',
        error: error.message
      };
    }
  }

  /**
   * Obtiene el tiempo restante hasta el próximo reset
   * @returns {Object} Información sobre el tiempo hasta el reset
   */
  getTimeUntilReset() {
    // Por simplicidad, asumimos que el reset es en la próxima hora
    const resetTime = new Date(Date.now() + (this.TIME_WINDOW_HOURS * 60 * 60 * 1000));
    const timeLeft = resetTime.getTime() - Date.now();
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      hours,
      minutes,
      resetTime: resetTime.toISOString(),
      timeLeft
    };
  }

  /**
   * Incrementa el contador de uploads (esto se maneja automáticamente con la DB)
   * @param {string} userId - ID del usuario
   */
  async incrementUploadCount(userId) {
    // En nuestro caso, esto se maneja automáticamente cuando se guarda el sticker
    // en la base de datos con la timestamp actual
    console.log('📈 Upload count será incrementado automáticamente al guardar en DB');
  }

  /**
   * Verifica si el usuario puede hacer upload de un sticker
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si puede hacer upload
   */
  async canUserUpload(userId) {
    const limitInfo = await this.checkDailyLimit(userId);
    return limitInfo.canUpload;
  }

  /**
   * Obtiene información completa sobre los límites del usuario
   * @param {string} userId - ID del usuario  
   * @returns {Promise<Object>} Información completa sobre límites
   */
  async getLimitInfo(userId) {
    return await this.checkDailyLimit(userId);
  }
}

// Exportar instancia única
const uploadLimitService = new UploadLimitService();
export default uploadLimitService;
