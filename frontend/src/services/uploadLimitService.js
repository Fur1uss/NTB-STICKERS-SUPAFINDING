import supabase from '../config/supabaseClient';

/**
 * Servicio para manejar límites de uploads de stickers
 * Límite: 3 stickers cada 12 horas por usuario
 */
class UploadLimitService {
  constructor() {
    this.UPLOAD_LIMIT = 3;
    this.TIME_WINDOW_HOURS = 12;
  }

  /**
   * Verifica cuántos stickers ha subido el usuario en las últimas 12 horas
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información sobre el límite de uploads
   */
  async checkDailyLimit(userId) {
    try {
      console.log('🔍 Verificando límite de uploads para usuario:', userId);
      
      // Calcular timestamp de hace 12 horas
      const twelveHoursAgo = new Date(Date.now() - (this.TIME_WINDOW_HOURS * 60 * 60 * 1000));
      
      console.log('⏰ Verificando uploads desde:', twelveHoursAgo.toISOString());

      // Consultar Supabase para contar uploads del usuario en las últimas 12 horas
      const { count, error } = await supabase
        .from('stickers')
        .select('*', { count: 'exact', head: true })
        .eq('iduser', userId)
        .gte('created_at', twelveHoursAgo.toISOString());

      if (error) {
        console.error('❌ Error verificando límite de uploads:', error);
        throw new Error('Error checking upload limit');
      }

      const uploadsInPeriod = count || 0;
      const canUpload = uploadsInPeriod < this.UPLOAD_LIMIT;
      const remainingUploads = Math.max(0, this.UPLOAD_LIMIT - uploadsInPeriod);

      // Calcular próximo reset (12 horas desde ahora)
      const nextReset = new Date(Date.now() + (this.TIME_WINDOW_HOURS * 60 * 60 * 1000));

      const result = {
        uploadsInPeriod,
        canUpload,
        remainingUploads,
        limit: this.UPLOAD_LIMIT,
        timeWindowHours: this.TIME_WINDOW_HOURS,
        nextReset: nextReset.toISOString(),
        resetIn: this.getTimeUntilReset()
      };

      console.log('📊 Resultado del límite:', result);
      return result;

    } catch (error) {
      console.error('❌ Error en checkDailyLimit:', error);
      
      // En caso de error, asumir que puede subir (fail gracefully)
      return {
        uploadsInPeriod: 0,
        canUpload: true,
        remainingUploads: this.UPLOAD_LIMIT,
        limit: this.UPLOAD_LIMIT,
        timeWindowHours: this.TIME_WINDOW_HOURS,
        nextReset: new Date(Date.now() + (this.TIME_WINDOW_HOURS * 60 * 60 * 1000)).toISOString(),
        resetIn: this.getTimeUntilReset(),
        error: error.message
      };
    }
  }

  /**
   * Obtiene el tiempo hasta el próximo reset en formato legible
   * @returns {string} Tiempo formateado (ej: "5h 23m")
   */
  getTimeUntilReset() {
    // Para simplicidad, calculamos desde "ahora"
    // En una implementación más sofisticada, podríamos usar el upload más antiguo
    const resetTime = new Date(Date.now() + (this.TIME_WINDOW_HOURS * 60 * 60 * 1000));
    const now = new Date();
    const diffMs = resetTime - now;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Incrementa el contador de uploads (se llama después de un upload exitoso)
   * Nota: No necesitamos hacer nada aquí ya que el insert en 'stickers' 
   * automáticamente actualiza el conteo
   * @param {string} userId - ID del usuario
   */
  async incrementUploadCount(userId) {
    console.log('✅ Upload registrado para usuario:', userId);
    // El conteo se actualiza automáticamente con el nuevo registro en 'stickers'
    return true;
  }

  /**
   * Verifica si un usuario puede hacer un upload antes de proceder
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} True si puede subir, false si no
   */
  async canUserUpload(userId) {
    const limitData = await this.checkDailyLimit(userId);
    return limitData.canUpload;
  }

  /**
   * Obtiene información detallada del límite para mostrar en UI
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Información completa del límite
   */
  async getLimitInfo(userId) {
    return await this.checkDailyLimit(userId);
  }
}

// Exportar instancia única
const uploadLimitService = new UploadLimitService();
export default uploadLimitService;
