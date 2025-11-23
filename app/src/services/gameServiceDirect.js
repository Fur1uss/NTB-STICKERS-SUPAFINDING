import supabase from '../config/supabaseClient.js';

/**
 * Servicio completo de juego usando Supabase directamente
 * Reemplaza toda la funcionalidad de api/game y lib/services/gameService
 */

// Servicio de cálculo de scores (movido desde lib/services/scoreCalculator.js)
class ScoreCalculator {
  static calculateScore(gameData) {
    const { stickersFound, timePlayed, timeBonus, baseTime = 90 } = gameData;

    // 1. Puntuación base por stickers encontrados
    const baseStickerPoints = stickersFound * 100;

    // 2. Bonus por tiempo extra ganado
    const timeBonusPoints = timeBonus * 10;

    // 3. Bonus por eficiencia (stickers por minuto)
    const efficiencyRate = stickersFound / (timePlayed / 60);
    let efficiencyBonus = 0;
    
    if (efficiencyRate >= 2) {
      efficiencyBonus = 200;
    } else if (efficiencyRate >= 1.5) {
      efficiencyBonus = 150;
    } else if (efficiencyRate >= 1) {
      efficiencyBonus = 100;
    } else if (efficiencyRate >= 0.5) {
      efficiencyBonus = 50;
    }

    // 4. Penalty por tiempo excesivo
    const maxAllowedTime = baseTime + timeBonus;
    let timePenalty = 0;
    
    if (timePlayed > maxAllowedTime) {
      const extraTime = timePlayed - maxAllowedTime;
      timePenalty = extraTime * 5;
    }

    // 5. Cálculo final
    const finalScore = Math.max(0, baseStickerPoints + timeBonusPoints + efficiencyBonus - timePenalty);

    return {
      finalScore,
      breakdown: {
        baseStickerPoints,
        timeBonusPoints,
        efficiencyBonus,
        timePenalty,
        efficiencyRate: parseFloat(efficiencyRate.toFixed(2))
      },
      performance: this.getPerformanceRating(efficiencyRate, finalScore)
    };
  }

  static getPerformanceRating(efficiencyRate, finalScore) {
    if (finalScore >= 1000 && efficiencyRate >= 2) {
      return 'MAESTRO';
    } else if (finalScore >= 700 && efficiencyRate >= 1.5) {
      return 'EXPERTO';
    } else if (finalScore >= 400 && efficiencyRate >= 1) {
      return 'AVANZADO';
    } else if (finalScore >= 200) {
      return 'INTERMEDIO';
    }
    return 'NOVATO';
  }

  static calculateGameStats(gameData) {
    const { stickersFound, timePlayed, timeBonus } = gameData;
    
    const averageTimePerSticker = stickersFound > 0 ? timePlayed / stickersFound : 0;
    const bonusTimePercentage = ((timeBonus / timePlayed) * 100).toFixed(1);
    
    return {
      averageTimePerSticker: parseFloat(averageTimePerSticker.toFixed(2)),
      bonusTimePercentage: parseFloat(bonusTimePercentage),
      totalInteractions: stickersFound,
      gameEfficiency: stickersFound > 0 ? 'PRODUCTIVO' : 'SIN_PROGRESO'
    };
  }
}

// Servicio de stickers (movido desde lib/services/stickerService.js)
class StickerService {
  static async syncStickersFromBucket(userId) {
    try {
      // 1. Obtener todos los archivos del bucket
      const { data: files, error: listError } = await supabase.storage
        .from('stickers')
        .list('', {
          limit: 1000,
          offset: 0
        });

      if (listError) throw listError;

      // 2. Filtrar solo archivos de imagen
      const imageFiles = files.filter(file => 
        file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      );

      // 3. Verificar stickers existentes en la base de datos
      const { data: existingStickers, error: fetchError } = await supabase
        .from('stickers')
        .select('namesticker, urlsticker');

      if (fetchError) throw fetchError;

      // Crear Set de URLs existentes para comparación rápida
      const existingUrls = new Set(existingStickers.map(s => s.urlsticker));

      // 4. Identificar stickers nuevos
      const newStickers = [];

      for (const file of imageFiles) {
        const { data: urlData } = supabase.storage
          .from('stickers')
          .getPublicUrl(file.name);

        const publicUrl = urlData.publicUrl;

        if (!existingUrls.has(publicUrl)) {
          const displayName = this.generateDisplayName(file.name);
          const description = `Encuentra el sticker de ${displayName.toLowerCase()}`;

          const stickerData = {
            iduser: userId,
            namesticker: file.name,
            urlsticker: publicUrl,
            descriptionsticker: description
          };

          newStickers.push(stickerData);
        }
      }

      // 5. Insertar nuevos stickers en la base de datos
      let insertedStickers = [];
      if (newStickers.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('stickers')
          .insert(newStickers)
          .select();

        if (insertError) throw insertError;
        insertedStickers = inserted;
      }

      return {
        success: true,
        totalFilesInBucket: files.length,
        imageFiles: imageFiles.length,
        existingInDb: existingStickers.length,
        newStickersAdded: newStickers.length,
        insertedStickers: insertedStickers
      };
    } catch (error) {
      throw {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  static async getAllStickers() {
    try {
      const { data: stickers, error } = await supabase
        .from('stickers')
        .select('*')
        .order('id', { ascending: false })
        .limit(150);

      if (error) throw error;

      // Mezclar aleatoriamente
      const shuffledStickers = stickers.sort(() => Math.random() - 0.5);
      return shuffledStickers;
    } catch (error) {
      throw error;
    }
  }

  static async getRandomTargetSticker(availableStickers = null) {
    try {
      const stickers = availableStickers || await this.getAllStickers();
      
      if (stickers.length === 0) {
        throw new Error('No hay stickers disponibles');
      }

      const randomIndex = Math.floor(Math.random() * stickers.length);
      return stickers[randomIndex];
    } catch (error) {
      throw error;
    }
  }

  static generateDisplayName(fileName) {
    return fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Servicio principal de juego
export class GameServiceDirect {
  /**
   * Inicia una nueva partida para el usuario
   */
  static async startNewGame(userId) {
    try {
      // 1. Sincronizar stickers antes de iniciar el juego
      await StickerService.syncStickersFromBucket(userId);

      // 2. Crear registro de nueva partida en la base de datos
      const gameData = {
        userid: userId,
        createdate: new Date().toISOString(),
        timeplayed: null,
        scoregame: null
      };

      const { data: newGame, error: gameError } = await supabase
        .from('game')
        .insert([gameData])
        .select()
        .single();

      if (gameError) throw gameError;

      // 3. Obtener todos los stickers para el juego
      const allStickers = await StickerService.getAllStickers();

      // 4. Obtener sticker objetivo inicial
      const targetSticker = await StickerService.getRandomTargetSticker(allStickers);

      return {
        success: true,
        gameId: newGame.id,
        startTime: newGame.createdate,
        targetSticker: targetSticker,
        totalStickers: allStickers.length,
        gameConfig: {
          baseTimeSeconds: 90,
          bonusTimePerSticker: 5,
          maxGameTime: 300
        },
        stickers: allStickers
      };
    } catch (error) {
      throw {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Valida un sticker encontrado (sin guardar en DB todavía)
   * Los stickers se guardarán todos al finalizar la partida
   */
  static async validateSticker(gameId, stickerId) {
    try {
      // 1. Verificar que la partida existe y está activa
      const { data: game, error: gameError } = await supabase
        .from('game')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        throw new Error('Partida no encontrada');
      }

      if (game.timeplayed !== null) {
        throw new Error('La partida ya ha finalizado');
      }

      // 2. Verificar que el sticker existe
      const { data: sticker, error: stickerError } = await supabase
        .from('stickers')
        .select('*')
        .eq('id', stickerId)
        .single();

      if (stickerError || !sticker) {
        throw new Error('Sticker no encontrado');
      }

      // 3. Obtener el siguiente sticker objetivo
      const allStickers = await StickerService.getAllStickers();
      const nextTarget = await StickerService.getRandomTargetSticker(allStickers);

      return {
        success: true,
        foundSticker: sticker,
        nextTarget: nextTarget,
        bonusTimeAdded: 5
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Guarda todos los stickers encontrados en la partida (llamado al finalizar)
   */
  static async saveFoundStickers(gameId, stickerIds) {
    try {
      if (!stickerIds || stickerIds.length === 0) {
        return { success: true, saved: 0 };
      }

      // Crear registros para todos los stickers encontrados
      const stickerGameData = stickerIds.map(stickerId => ({
        gameid: gameId,
        stickerid: stickerId
      }));

      const { data: savedRecords, error: insertError } = await supabase
        .from('stickersongame')
        .insert(stickerGameData)
        .select();

      if (insertError) {
        // No fallar completamente, algunos pueden ser duplicados
      }

      return {
        success: true,
        saved: savedRecords?.length || 0,
        total: stickerIds.length
      };
    } catch (error) {
      console.error('❌ Error guardando stickers:', error);
      // No fallar completamente, retornar éxito parcial
      return {
        success: true,
        saved: 0,
        total: stickerIds.length,
        error: error.message
      };
    }
  }

  /**
   * Finaliza una partida y calcula la puntuación
   * @param {number} gameId - ID de la partida
   * @param {Object} gameStats - Estadísticas del juego
   * @param {Array} foundStickerIds - IDs de los stickers encontrados (guardados localmente)
   */
  static async endGame(gameId, gameStats, foundStickerIds = []) {
    try {
      // 1. Verificar que la partida existe
      const { data: game, error: gameError } = await supabase
        .from('game')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        throw new Error('Partida no encontrada');
      }

      if (game.timeplayed !== null) {
        throw new Error('La partida ya ha sido finalizada');
      }

      // 2. Guardar todos los stickers encontrados en la DB
      const saveResult = await this.saveFoundStickers(gameId, foundStickerIds);
      const stickersFound = foundStickerIds.length;

      // 3. Obtener los stickers guardados con sus detalles para el scoreboard
      const { data: foundStickers, error: stickersError } = await supabase
        .from('stickersongame')
        .select('*, stickers(*)')
        .eq('gameid', gameId);

      if (stickersError) {
      }

      // 4. Calcular puntuación
      const scoreData = {
        stickersFound: stickersFound,
        timePlayed: gameStats.timePlayed,
        timeBonus: gameStats.timeBonus || 0,
        baseTime: 90
      };

      const scoreResult = ScoreCalculator.calculateScore(scoreData);
      const gameStatsResult = ScoreCalculator.calculateGameStats(scoreData);

      // 5. Actualizar la partida con tiempo y puntuación
      const updateData = {
        timeplayed: `${Math.floor(gameStats.timePlayed / 3600)}:${Math.floor((gameStats.timePlayed % 3600) / 60)}:${gameStats.timePlayed % 60}`,
        scoregame: scoreResult.finalScore
      };

      const { data: updatedGame, error: updateError } = await supabase
        .from('game')
        .update(updateData)
        .eq('id', gameId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 6. Crear registro en scoreboard (opcional, no crítico)
      let scoreboardRecord = null;
      try {
        const scoreboardData = {
          userid: game.userid,
          gameid: gameId
        };

        const { data: scoreboard, error: scoreboardError } = await supabase
          .from('scoreboardgame')
          .insert([scoreboardData])
          .select()
          .single();

        if (!scoreboardError) {
          scoreboardRecord = scoreboard;
        }
      } catch (e) {
        // No crítico, continuar
      }

      return {
        success: true,
        gameId: gameId,
        finalScore: scoreResult.finalScore,
        stickersFound: stickersFound,
        timePlayed: gameStats.timePlayed,
        scoreBreakdown: scoreResult.breakdown,
        performance: scoreResult.performance,
        gameStats: gameStatsResult,
        foundStickersList: (foundStickers || []).map(fs => ({
          id: fs.id,
          sticker: fs.stickers
        })),
        scoreboardId: scoreboardRecord?.id
      };
    } catch (error) {
      throw {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Obtiene los datos completos de una partida
   */
  static async getGameData(gameId) {
    try {
      const { data: game, error: gameError } = await supabase
        .from('game')
        .select(`
          *,
          users (
            id,
            username,
            emailuser
          )
        `)
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        throw new Error('Partida no encontrada');
      }

      const { data: foundStickers, error: stickersError } = await supabase
        .from('stickersongame')
        .select(`
          *,
          stickers (
            id,
            namesticker,
            urlsticker,
            descriptionsticker
          )
        `)
        .eq('gameid', gameId)
        .order('id');

      if (stickersError) throw stickersError;

      const { data: scoreboardData } = await supabase
        .from('scoreboardgame')
        .select('*')
        .eq('gameid', gameId)
        .single();

      return {
        game: game,
        foundStickers: foundStickers,
        scoreboard: scoreboardData,
        summary: {
          gameId: game.id,
          userId: game.userid,
          username: game.users?.username || 'Usuario',
          score: game.scoregame,
          timePlayed: game.timeplayed,
          stickersFound: foundStickers.length,
          createDate: game.createdate
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el ranking general del scoreboard
   */
  static async getScoreboardRanking(limit = 10) {
    try {
      const { data: ranking, error } = await supabase
        .from('game')
        .select(`
          *,
          users (
            id,
            username,
            emailuser
          ),
          scoreboardgame (
            id
          )
        `)
        .not('scoregame', 'is', null)
        .order('scoregame', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return ranking;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene los datos del scoreboard para una partida
   * Reemplaza getScoreboardData del servicio anterior
   */
  static async getScoreboardData(gameId) {
    try {
      const gameData = await this.getGameData(gameId);
      
      // Formatear datos para el scoreboard
      return {
        game: {
          id: gameData.game.id,
          score: gameData.game.scoregame,
          timePlayed: gameData.game.timeplayed,
          user: {
            id: gameData.game.users?.id,
            username: gameData.game.users?.username || 'Usuario'
          }
        },
        statistics: {
          stickersFound: gameData.foundStickers.length,
          stickersDetails: gameData.foundStickers.map(fs => ({
            id: fs.stickers?.id,
            name: fs.stickers?.namesticker,
            url: fs.stickers?.urlsticker,
            description: fs.stickers?.descriptionsticker
          }))
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene el ranking global con formato para el frontend
   * Reemplaza getGlobalRanking del servicio anterior
   */
  static async getGlobalRanking(options = {}) {
    try {
      const { limit = 10, page = 1, userId } = options;
      
      // Obtener ranking
      const totalLimit = limit * page;
      const ranking = await this.getScoreboardRanking(totalLimit);

      // Aplicar paginación manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRanking = ranking.slice(startIndex, endIndex);

      // Formatear datos para el ranking
      const formattedRanking = paginatedRanking.map((game, index) => ({
        position: startIndex + index + 1,
        user: {
          id: game.users?.id,
          username: game.users?.username || 'Usuario Anónimo',
          emailuser: game.users?.emailuser
        },
        game: {
          id: game.id,
          score: game.scoregame,
          timePlayed: game.timeplayed,
          createDate: game.createdate
        },
        isCurrentUser: userId ? parseInt(userId) === game.users?.id : false
      }));

      // Buscar posición del usuario específico si se proporciona
      let userStats = null;
      if (userId) {
        const userRank = ranking.findIndex(g => g.users?.id === parseInt(userId));
        if (userRank !== -1) {
          userStats = {
            globalPosition: userRank + 1,
            score: ranking[userRank].scoregame,
            timePlayed: ranking[userRank].timeplayed
          };
        }
      }

      return {
        ranking: formattedRanking,
        pagination: {
          page,
          limit,
          total: ranking.length,
          hasMore: endIndex < ranking.length
        },
        userStats
      };
    } catch (error) {
      throw error;
    }
  }
}

export default GameServiceDirect;

