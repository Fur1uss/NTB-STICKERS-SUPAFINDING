import supabase from '../config/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Servicio para manejar la autenticación de usuarios
 */
class AuthService {
  
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
   * Crea o obtiene un usuario en el backend
   */
  async createOrGetUser() {
    try {
      console.log('🔐 Enviando solicitud para crear/obtener usuario...');
      
      // Obtener el token de acceso
      const accessToken = await this.getAccessToken();
      
      // Hacer la petición al backend
      const response = await fetch(`${API_BASE_URL}/api/auth/create-or-get-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta del backend:', data);
      
      return data;

    } catch (error) {
      console.error('❌ Error en createOrGetUser:', error);
      throw error;
    }
  }

  /**
   * Obtiene la información del usuario desde el backend
   */
  async getUserInfo() {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Error obteniendo información del usuario:', error);
      throw error;
    }
  }

  /**
   * Verifica si el backend está disponible
   */
  async checkBackendHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Backend no disponible: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backend health check:', data);
      return data;

    } catch (error) {
      console.error('❌ Backend no disponible:', error);
      throw error;
    }
  }
}

// Exportar una instancia singleton
const authService = new AuthService();
export default authService;
