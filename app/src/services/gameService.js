import supabase from '../config/supabaseClient.js';

/**
 * Servicio para manejar las API calls relacionadas con el juego
 */

// Usar rutas relativas para Vercel (todo en el mismo dominio)
// En desarrollo local, forzar rutas relativas (ignorar VITE_API_URL si apunta a Railway)
const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = (isLocalDev ? '' : (import.meta.env.VITE_API_URL || ''));

/**
 * Clase para manejar todas las operaciones del juego con el backend
 */
export class GameAPIService {

  /**
   * Obtiene el token de acceso del usuario autenticado
   */
  static async getAccessToken() {
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
   * Inicia una nueva partida
   * @param {number} userId - ID del usuario
   * @returns {Object} Datos de la partida iniciada
   */
  static async startGame(userId) {
    console.log('\n🎮 INICIANDO NUEVA PARTIDA API CALL');
    console.log('👤 Usuario ID:', userId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Partida iniciada exitosamente:', data.data.gameId);
      return data.data;

    } catch (error) {
      console.error('❌ Error iniciando partida:', error);
      throw error;
    }
  }

  /**
   * Registra un sticker encontrado en la partida
   * @param {number} gameId - ID de la partida
   * @param {number} stickerId - ID del sticker encontrado
   * @returns {Object} Resultado del registro
   */
  static async addStickerToGame(gameId, stickerId) {
    console.log('\n🎯 REGISTRANDO STICKER ENCONTRADO API CALL');
    console.log('🎮 Game ID:', gameId);
    console.log('🎯 Sticker ID:', stickerId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/game/${gameId}/add-sticker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stickerId })
      });

      const data = await response.json();

      if (!response.ok) {
        // Si es un sticker ya encontrado, no es un error crítico
        if (response.status === 409) {
          console.log('⚠️ Sticker ya encontrado anteriormente');
          return { success: false, alreadyFound: true, message: data.message };
        }
        
        // Si es un duplicado reciente, no es un error crítico
        if (response.status === 429) {
          console.log('🚫 Sticker registrado recientemente (duplicado)');
          return { success: false, alreadyFound: true, duplicate: true, message: data.message };
        }
        
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Sticker registrado exitosamente');
      return data.data;

    } catch (error) {
      console.error('❌ Error registrando sticker:', error);
      throw error;
    }
  }

  /**
   * Finaliza una partida y calcula la puntuación
   * @param {number} gameId - ID de la partida
   * @param {Object} gameStats - Estadísticas del juego
   * @returns {Object} Resultado final de la partida
   */
  static async endGame(gameId, gameStats) {
    console.log('\n🏁 FINALIZANDO PARTIDA API CALL');
    console.log('🎮 Game ID:', gameId);
    console.log('📊 Estadísticas:', gameStats);

    try {
      const response = await fetch(`${API_BASE_URL}/api/game/${gameId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameStats)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Partida finalizada exitosamente');
      console.log('🏆 Puntuación final:', data.data.finalScore);
      return data.data;

    } catch (error) {
      console.error('❌ Error finalizando partida:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos de una partida específica
   * @param {number} gameId - ID de la partida
   * @returns {Object} Datos de la partida
   */
  static async getGameData(gameId) {
    console.log('\n📊 OBTENIENDO DATOS DE PARTIDA API CALL');
    console.log('🎮 Game ID:', gameId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/game/${gameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Datos de partida obtenidos exitosamente');
      return data.data;

    } catch (error) {
      console.error('❌ Error obteniendo datos de partida:', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos del scoreboard para una partida
   * @param {number} gameId - ID de la partida
   * @returns {Object} Datos del scoreboard
   */
  static async getScoreboardData(gameId) {
    console.log('\n🏆 OBTENIENDO DATOS DE SCOREBOARD API CALL');
    console.log('🎮 Game ID:', gameId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/scoreboard/game/${gameId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Datos de scoreboard obtenidos exitosamente');
      return data.data;

    } catch (error) {
      console.error('❌ Error obteniendo datos de scoreboard:', error);
      throw error;
    }
  }

  /**
   * Obtiene el ranking global
   * @param {Object} options - Opciones de consulta
   * @returns {Object} Ranking global
   */
  static async getGlobalRanking(options = {}) {
    console.log('\n🌟 OBTENIENDO RANKING GLOBAL API CALL');
    console.log('📋 Opciones:', options);

    const { limit = 10, page = 1, userId } = options;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString()
    });

    if (userId) {
      queryParams.append('userId', userId.toString());
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scoreboard/ranking?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Ranking global obtenido exitosamente');
      return data.data;

    } catch (error) {
      console.error('❌ Error obteniendo ranking global:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas generales del scoreboard
   * @returns {Object} Estadísticas generales
   */
  static async getScoreboardStats() {
    console.log('\n📈 OBTENIENDO ESTADÍSTICAS GENERALES API CALL');

    try {
      const response = await fetch(`${API_BASE_URL}/api/scoreboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Estadísticas obtenidas exitosamente');
      return data.data;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      throw error;
    }
  }

  /**
   * Verifica la salud del servidor de la API
   * @returns {boolean} True si el servidor está funcionando
   */
  static async checkApiHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Respuesta no es JSON - API no disponible');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API no disponible: ${response.status}`);
      }

      return true;

    } catch (error) {
      console.error('❌ Error verificando API:', error);
      return false;
    }
  }
}

export default GameAPIService;
