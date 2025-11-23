import supabase from '../config/supabaseClient.js';

// Usar rutas relativas para Vercel (todo en el mismo dominio)
// En desarrollo local, forzar rutas relativas (ignorar VITE_API_URL si apunta a Railway)
const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = (isLocalDev ? '' : (import.meta.env.VITE_API_URL || ''));

/**
 * Servicio para manejar la subida de stickers
 */
class UploadService {
  
  /**
   * Obtiene el token de acceso actual del usuario
   */
  async getAccessToken() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error obteniendo session:', error);
      throw new Error('No se pudo obtener el token de acceso');
    }
    
    if (!session?.access_token) {
      throw new Error('No hay sesión activa');
    }
    
    return session.access_token;
  }

  /**
   * Sube un sticker al servidor
   * @param {File} file - Archivo de imagen (.png)
   * @param {string} name - Nombre del sticker
   * @param {string} description - Descripción del sticker
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la subida
   */
  async uploadSticker(file, name, description, userId) {
    try {
      console.log('📤 Iniciando subida de sticker...');
      console.log('📁 Archivo:', file.name);
      console.log('📝 Nombre:', name);
      console.log('📄 Descripción:', description);
      console.log('👤 Usuario ID:', userId);

      // Validar que el archivo sea PNG
      if (!file.name.toLowerCase().endsWith('.png')) {
        throw new Error('Solo se permiten archivos PNG');
      }

      // Validar tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 5MB');
      }

      // Obtener token de acceso
      const accessToken = await this.getAccessToken();

      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('description', description);
      formData.append('userId', userId.toString());

      // Hacer la petición al backend
      const response = await fetch(`${API_BASE_URL}/api/upload/sticker`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Sticker subido exitosamente:', data);
      return data;

    } catch (error) {
      console.error('❌ Error subiendo sticker:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de stickers del usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Lista de stickers
   */
  async getUserStickers(userId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${API_BASE_URL}/api/upload/user-stickers/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      return data.data;

    } catch (error) {
      console.error('❌ Error obteniendo stickers del usuario:', error);
      throw error;
    }
  }
}

// Exportar una instancia singleton
const uploadService = new UploadService();
export default uploadService; 