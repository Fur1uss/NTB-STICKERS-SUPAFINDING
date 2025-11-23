import supabase from '../config/supabaseClient';

// Usar rutas relativas para Vercel (todo en el mismo dominio)
// En desarrollo local, forzar rutas relativas (ignorar VITE_API_URL si apunta a Railway)
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = (isLocalDev ? '' : (import.meta.env.VITE_API_URL || ''));

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
      // En desarrollo local sin API_BASE_URL, lanzar error inmediatamente
      if (isLocalDev && !API_BASE_URL) {
        throw new Error('Backend no disponible en desarrollo local. Las funciones serverless solo funcionan con "vercel dev" o en producción. Usa "npm run dev:full" para probar localmente.');
      }
      
      // Obtener el token de acceso
      const accessToken = await this.getAccessToken();
      
      // Hacer la petición al backend con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/auth/create-or-get-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          signal: controller.signal
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // Si es un error de aborto o red, verificar si estamos en desarrollo local
        if (fetchError.name === 'AbortError' || fetchError.message.includes('Failed to fetch')) {
          if (isLocalDev) {
            throw new Error('Backend no disponible en desarrollo local. Las funciones serverless solo funcionan con "vercel dev" o en producción. Usa "npm run dev:full" para probar localmente.');
          }
        }
        throw fetchError;
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Verificar que la respuesta sea JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        } else {
          // Si no es JSON, probablemente es HTML (404 de Vite en desarrollo local)
          if (isLocalDev && !API_BASE_URL) {
            throw new Error('Backend no disponible en desarrollo local. Las funciones serverless solo funcionan con "vercel dev" o en producción. Usa "npm run dev:full" para probar localmente.');
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Si recibimos HTML en desarrollo local, las funciones serverless no están disponibles
        if (isLocalDev && !API_BASE_URL) {
          throw new Error('Backend no disponible en desarrollo local. Las funciones serverless solo funcionan con "vercel dev" o en producción. Usa "npm run dev:full" para probar localmente.');
        }
        throw new Error('Respuesta no es JSON - backend no disponible');
      }

      const data = await response.json();
      return data;

    } catch (error) {
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
      throw error;
    }
  }

  /**
   * Verifica si el backend está disponible
   * En desarrollo local, retorna éxito sin verificar (las funciones serverless solo funcionan en Vercel)
   */
  async checkBackendHealth() {
    try {
      // En desarrollo local, no verificar (las funciones serverless no están disponibles)
      const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocalDev && !API_BASE_URL) {
        return { status: 'OK', message: 'Modo desarrollo local - backend disponible en producción' };
      }

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Backend no disponible: ${response.status}`);
      }

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // En desarrollo local, si recibimos HTML, asumir que no hay backend disponible
        if (isLocalDev) {
          return { status: 'OK', message: 'Modo desarrollo local - backend disponible en producción' };
        }
        throw new Error('Respuesta no es JSON');
      }

      const data = await response.json();
      return data;

    } catch (error) {
      // En desarrollo local, no fallar si no hay backend
      const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocalDev && !API_BASE_URL) {
        return { status: 'OK', message: 'Modo desarrollo local - backend disponible en producción' };
      }
      throw error;
    }
  }
}

// Exportar una instancia singleton
const authService = new AuthService();
export default authService;
