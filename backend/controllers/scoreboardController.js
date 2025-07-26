import GameService from '../services/gameService.js';

/**
 * Controlador para manejar las rutas del scoreboard
 */
export class ScoreboardController {

  /**
   * Obtiene los datos completos de una partida para mostrar en scoreboard
   * GET /api/scoreboard/game/:gameId
   */
  static async getGameScoreboard(req, res) {
    console.log('\n🏆 ENDPOINT: GET /api/scoreboard/game/:gameId');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔗 Params:', req.params);
    console.log('🔗 Query params:', req.query);

    try {
      const { gameId } = req.params;

      if (!gameId || isNaN(parseInt(gameId))) {
        console.error('❌ GameID inválido:', gameId);
        return res.status(400).json({
          success: false,
          error: 'GameID inválido',
          message: 'Debe proporcionar un gameId válido'
        });
      }

      console.log('📊 Obteniendo scoreboard para juego:', parseInt(gameId));

      // Obtener datos completos del juego
      const gameData = await GameService.getGameData(parseInt(gameId));

      // Formatear datos específicamente para el scoreboard
      const scoreboardData = {
        game: {
          id: gameData.game.id,
          score: gameData.game.scoregame,
          timePlayed: gameData.game.timeplayed,
          createDate: gameData.game.createdate,
          user: {
            id: gameData.game.users?.id,
            username: gameData.game.users?.username || 'Usuario Anónimo',
            emailuser: gameData.game.users?.emailuser
          }
        },
        statistics: {
          stickersFound: gameData.foundStickers.length,
          stickersDetails: gameData.foundStickers.map(fs => ({
            id: fs.id,
            sticker: {
              id: fs.stickers.id,
              name: fs.stickers.namesticker,
              url: fs.stickers.urlsticker,
              description: fs.stickers.descriptionsticker
            }
          }))
        },
        scoreboard: gameData.scoreboard,
        metadata: {
          retrievedAt: new Date().toISOString(),
          dataComplete: true
        }
      };

      console.log('✅ Datos de scoreboard obtenidos exitosamente');
      console.log('📤 Respuesta para:', scoreboardData.game.user.username);
      console.log('   🏆 Puntuación:', scoreboardData.game.score);
      console.log('   🎯 Stickers encontrados:', scoreboardData.statistics.stickersFound);
      console.log('   ⏱️  Tiempo jugado:', scoreboardData.game.timePlayed);

      res.status(200).json({
        success: true,
        message: 'Datos de scoreboard obtenidos exitosamente',
        data: scoreboardData
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT getGameScoreboard:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);

      if (error.message.includes('no encontrada')) {
        res.status(404).json({
          success: false,
          error: 'Partida no encontrada',
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
          message: error.message || 'No se pudieron obtener los datos del scoreboard'
        });
      }
    }
  }

  /**
   * Obtiene el ranking global del scoreboard
   * GET /api/scoreboard/ranking
   */
  static async getGlobalRanking(req, res) {
    console.log('\n🌟 ENDPOINT: GET /api/scoreboard/ranking');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔗 Query params:', req.query);

    try {
      const { 
        limit = 10, 
        page = 1,
        userId 
      } = req.query;

      const limitNumber = parseInt(limit);
      const pageNumber = parseInt(page);

      // Validaciones
      if (isNaN(limitNumber) || limitNumber <= 0 || limitNumber > 50) {
        console.error('❌ Límite inválido:', limit);
        return res.status(400).json({
          success: false,
          error: 'Límite inválido',
          message: 'El límite debe ser un número entre 1 y 50'
        });
      }

      if (isNaN(pageNumber) || pageNumber <= 0) {
        console.error('❌ Página inválida:', page);
        return res.status(400).json({
          success: false,
          error: 'Página inválida',
          message: 'La página debe ser un número mayor a 0'
        });
      }

      console.log('🏆 Obteniendo ranking global:');
      console.log('   📄 Página:', pageNumber);
      console.log('   📊 Límite:', limitNumber);
      console.log('   👤 Usuario específico:', userId || 'Todos');

      // Obtener ranking global
      const totalLimit = limitNumber * pageNumber; // Para simular paginación
      const ranking = await GameService.getScoreboardRanking(totalLimit);

      // Aplicar paginación manual
      const startIndex = (pageNumber - 1) * limitNumber;
      const endIndex = startIndex + limitNumber;
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
      let userPosition = null;
      if (userId) {
        const userRank = ranking.findIndex(game => 
          game.users?.id === parseInt(userId)
        );
        userPosition = userRank !== -1 ? userRank + 1 : null;
      }

      const responseData = {
        ranking: formattedRanking,
        pagination: {
          currentPage: pageNumber,
          itemsPerPage: limitNumber,
          totalItems: ranking.length,
          totalPages: Math.ceil(ranking.length / limitNumber),
          hasNext: endIndex < ranking.length,
          hasPrevious: pageNumber > 1
        },
        userStats: userId ? {
          userId: parseInt(userId),
          globalPosition: userPosition,
          inCurrentPage: formattedRanking.some(item => item.isCurrentUser)
        } : null,
        metadata: {
          generatedAt: new Date().toISOString(),
          rankingType: 'global'
        }
      };

      console.log('✅ Ranking global obtenido exitosamente');
      console.log('📤 Respuesta con', formattedRanking.length, 'entradas');
      console.log('   📄 Página actual:', pageNumber);
      console.log('   📊 Total disponible:', ranking.length);
      if (userPosition) {
        console.log('   👤 Posición del usuario:', userPosition);
      }

      res.status(200).json({
        success: true,
        message: 'Ranking global obtenido exitosamente',
        data: responseData
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT getGlobalRanking:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo obtener el ranking global'
      });
    }
  }

  /**
   * Obtiene estadísticas generales del scoreboard
   * GET /api/scoreboard/stats
   */
  static async getScoreboardStats(req, res) {
    console.log('\n📈 ENDPOINT: GET /api/scoreboard/stats');
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
      console.log('📊 Calculando estadísticas generales del scoreboard...');

      // Obtener todas las partidas para calcular estadísticas
      const allGames = await GameService.getScoreboardRanking(1000); // Límite alto para obtener todas

      if (allGames.length === 0) {
        console.log('⚠️  No hay partidas registradas');
        return res.status(200).json({
          success: true,
          message: 'No hay partidas registradas aún',
          data: {
            totalGames: 0,
            totalPlayers: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            averageGameTime: '00:00:00',
            topPerformers: []
          }
        });
      }

      // Calcular estadísticas
      const scores = allGames.map(game => game.scoregame);
      const uniquePlayers = new Set(allGames.map(game => game.users?.id)).size;
      
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const averageScore = Math.round(totalScore / scores.length);
      const highestScore = Math.max(...scores);
      const lowestScore = Math.min(...scores);

      // Calcular tiempo promedio (esto es más complejo con el formato TIME)
      // Por simplicidad, tomamos solo el primer tiempo como referencia
      const averageGameTime = allGames[0]?.timeplayed || '00:00:00';

      // Top 3 performers
      const topPerformers = allGames.slice(0, 3).map((game, index) => ({
        position: index + 1,
        user: {
          id: game.users?.id,
          username: game.users?.username || 'Usuario Anónimo'
        },
        score: game.scoregame,
        gameId: game.id
      }));

      const stats = {
        totalGames: allGames.length,
        totalPlayers: uniquePlayers,
        scoreStats: {
          average: averageScore,
          highest: highestScore,
          lowest: lowestScore,
          total: totalScore
        },
        averageGameTime: averageGameTime,
        topPerformers: topPerformers,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Estadísticas calculadas exitosamente');
      console.log('📊 Total partidas:', stats.totalGames);
      console.log('👥 Total jugadores:', stats.totalPlayers);
      console.log('🏆 Puntuación promedio:', stats.scoreStats.average);
      console.log('🥇 Puntuación más alta:', stats.scoreStats.highest);

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT getScoreboardStats:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message || 'No se pudieron obtener las estadísticas'
      });
    }
  }

  /**
   * Manejo de errores 404 para rutas del scoreboard
   */
  static handleNotFound(req, res) {
    console.log('\n❌ RUTA DE SCOREBOARD NO ENCONTRADA:');
    console.log('   🔗 URL:', req.originalUrl);
    console.log('   📝 Método:', req.method);

    res.status(404).json({
      success: false,
      error: 'Ruta no encontrada',
      message: `La ruta ${req.method} ${req.originalUrl} no existe`,
      availableRoutes: [
        'GET /api/scoreboard/game/:gameId',
        'GET /api/scoreboard/ranking',
        'GET /api/scoreboard/stats'
      ]
    });
  }
}

export default ScoreboardController;
