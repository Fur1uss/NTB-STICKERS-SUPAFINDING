/**
 * Utilidades para validación de datos del juego
 */

export class GameValidation {
  
  /**
   * Valida los datos requeridos para iniciar un juego
   * @param {Object} data - Datos del juego
   * @returns {Object} Resultado de la validación
   */
  static validateStartGameData(data) {
    console.log('\n🔍 VALIDANDO DATOS PARA INICIAR JUEGO');
    console.log('📝 Datos recibidos:', data);

    const errors = [];
    const { userId } = data;

    // Validar userId
    if (!userId) {
      errors.push('userId es requerido');
    } else if (isNaN(parseInt(userId)) || parseInt(userId) <= 0) {
      errors.push('userId debe ser un número válido mayor a 0');
    }

    const isValid = errors.length === 0;
    const result = {
      isValid,
      errors,
      validatedData: isValid ? {
        userId: parseInt(userId)
      } : null
    };

    console.log('✅ Validación completada:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
    if (!isValid) {
      console.log('❌ Errores encontrados:', errors);
    }

    return result;
  }

  /**
   * Valida los datos para agregar un sticker al juego
   * @param {Object} data - Datos del sticker
   * @returns {Object} Resultado de la validación
   */
  static validateAddStickerData(data) {
    console.log('\n🔍 VALIDANDO DATOS PARA AGREGAR STICKER');
    console.log('📝 Datos recibidos:', data);

    const errors = [];
    const { gameId, stickerId } = data;

    // Validar gameId
    if (!gameId) {
      errors.push('gameId es requerido');
    } else if (isNaN(parseInt(gameId)) || parseInt(gameId) <= 0) {
      errors.push('gameId debe ser un número válido mayor a 0');
    }

    // Validar stickerId
    if (!stickerId) {
      errors.push('stickerId es requerido');
    } else if (isNaN(parseInt(stickerId)) || parseInt(stickerId) <= 0) {
      errors.push('stickerId debe ser un número válido mayor a 0');
    }

    const isValid = errors.length === 0;
    const result = {
      isValid,
      errors,
      validatedData: isValid ? {
        gameId: parseInt(gameId),
        stickerId: parseInt(stickerId)
      } : null
    };

    console.log('✅ Validación completada:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
    if (!isValid) {
      console.log('❌ Errores encontrados:', errors);
    }

    return result;
  }

  /**
   * Valida los datos para finalizar un juego
   * @param {Object} data - Datos del final del juego
   * @returns {Object} Resultado de la validación
   */
  static validateEndGameData(data) {
    console.log('\n🔍 VALIDANDO DATOS PARA FINALIZAR JUEGO');
    console.log('📝 Datos recibidos:', data);

    const errors = [];
    const { gameId, timePlayed, timeBonus } = data;

    // Validar gameId
    if (!gameId) {
      errors.push('gameId es requerido');
    } else if (isNaN(parseInt(gameId)) || parseInt(gameId) <= 0) {
      errors.push('gameId debe ser un número válido mayor a 0');
    }

    // Validar timePlayed
    if (timePlayed === undefined || timePlayed === null) {
      errors.push('timePlayed es requerido');
    } else if (isNaN(parseFloat(timePlayed)) || parseFloat(timePlayed) < 0) {
      errors.push('timePlayed debe ser un número válido mayor o igual a 0');
    } else if (parseFloat(timePlayed) > 600) { // 10 minutos máximo
      errors.push('timePlayed no puede ser mayor a 10 minutos (600 segundos)');
    }

    // Validar timeBonus (opcional)
    if (timeBonus !== undefined && timeBonus !== null) {
      if (isNaN(parseFloat(timeBonus)) || parseFloat(timeBonus) < 0) {
        errors.push('timeBonus debe ser un número válido mayor o igual a 0');
      } else if (parseFloat(timeBonus) > 300) { // 5 minutos máximo de bonus
        errors.push('timeBonus no puede ser mayor a 5 minutos (300 segundos)');
      }
    }

    const isValid = errors.length === 0;
    const result = {
      isValid,
      errors,
      validatedData: isValid ? {
        gameId: parseInt(gameId),
        timePlayed: parseFloat(timePlayed),
        timeBonus: timeBonus !== undefined ? parseFloat(timeBonus) : 0
      } : null
    };

    console.log('✅ Validación completada:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
    if (!isValid) {
      console.log('❌ Errores encontrados:', errors);
    }

    return result;
  }

  /**
   * Valida parámetros de consulta para el scoreboard
   * @param {Object} query - Query parameters
   * @returns {Object} Resultado de la validación
   */
  static validateScoreboardQuery(query) {
    console.log('\n🔍 VALIDANDO QUERY PARAMETERS SCOREBOARD');
    console.log('📝 Query recibido:', query);

    const errors = [];
    const { limit = 10, page = 1, userId } = query;

    // Validar limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 50) {
      errors.push('limit debe ser un número entre 1 y 50');
    }

    // Validar page
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum <= 0) {
      errors.push('page debe ser un número mayor a 0');
    }

    // Validar userId (opcional)
    if (userId !== undefined && userId !== null) {
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum) || userIdNum <= 0) {
        errors.push('userId debe ser un número válido mayor a 0');
      }
    }

    const isValid = errors.length === 0;
    const result = {
      isValid,
      errors,
      validatedData: isValid ? {
        limit: limitNum,
        page: pageNum,
        userId: userId ? parseInt(userId) : null
      } : null
    };

    console.log('✅ Validación completada:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
    if (!isValid) {
      console.log('❌ Errores encontrados:', errors);
    }

    return result;
  }

  /**
   * Valida que un tiempo sea válido en formato HH:MM:SS
   * @param {string} timeString - String de tiempo
   * @returns {boolean} True si es válido
   */
  static validateTimeFormat(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  /**
   * Convierte segundos a formato HH:MM:SS
   * @param {number} seconds - Segundos
   * @returns {string} Tiempo en formato HH:MM:SS
   */
  static secondsToTimeFormat(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Convierte formato HH:MM:SS a segundos
   * @param {string} timeString - Tiempo en formato HH:MM:SS
   * @returns {number} Segundos
   */
  static timeFormatToSeconds(timeString) {
    if (!this.validateTimeFormat(timeString)) {
      throw new Error('Formato de tiempo inválido');
    }

    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Valida que un ID de juego existe y pertenece al usuario
   * @param {number} gameId - ID del juego
   * @param {number} userId - ID del usuario
   * @returns {Object} Resultado de la validación
   */
  static validateGameOwnership(gameId, userId) {
    const errors = [];

    if (!gameId || isNaN(parseInt(gameId))) {
      errors.push('gameId inválido');
    }

    if (!userId || isNaN(parseInt(userId))) {
      errors.push('userId inválido');
    }

    return {
      isValid: errors.length === 0,
      errors,
      gameId: parseInt(gameId),
      userId: parseInt(userId)
    };
  }
}

export default GameValidation;
