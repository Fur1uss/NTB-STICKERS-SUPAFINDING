import GameService from '../services/gameService.js';

/**
 * Controlador para manejar las rutas del juego
 */
export class GameController {

  /**
   * Inicia una nueva partida
   * POST /api/game/start
   */
  static async startGame(req, res) {
    console.log('\n🎮 ENDPOINT: POST /api/game/start');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📥 Request Body:', req.body);
    console.log('🔑 Headers:', req.headers);

    try {
      // Extraer userId del body o de la autenticación
      const { userId } = req.body;

      if (!userId) {
        console.error('❌ UserID no proporcionado');
        return res.status(400).json({
          success: false,
          error: 'UserID es requerido',
          message: 'Debe proporcionar un userId válido para iniciar el juego'
        });
      }

      console.log('👤 Iniciando juego para usuario:', userId);

      // Llamar al servicio para iniciar el juego
      const result = await GameService.startNewGame(userId);

      console.log('✅ Juego iniciado exitosamente');
      console.log('📤 Respuesta enviada:', {
        gameId: result.gameId,
        totalStickers: result.totalStickers
      });

      res.status(201).json({
        success: true,
        message: 'Juego iniciado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT startGame:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo iniciar el juego'
      });
    }
  }

  /**
   * Registra un sticker encontrado en la partida
   * POST /api/game/:gameId/add-sticker
   */
  static async addSticker(req, res) {
    console.log('\n🎯 ENDPOINT: POST /api/game/:gameId/add-sticker');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔗 Params:', req.params);
    console.log('📥 Request Body:', req.body);

    try {
      const { gameId } = req.params;
      const { stickerId } = req.body;

      // Validaciones
      if (!gameId || isNaN(parseInt(gameId))) {
        console.error('❌ GameID inválido:', gameId);
        return res.status(400).json({
          success: false,
          error: 'GameID inválido',
          message: 'Debe proporcionar un gameId válido'
        });
      }

      if (!stickerId || isNaN(parseInt(stickerId))) {
        console.error('❌ StickerID inválido:', stickerId);
        return res.status(400).json({
          success: false,
          error: 'StickerID inválido',
          message: 'Debe proporcionar un stickerId válido'
        });
      }

      console.log('🎮 Agregando sticker al juego:', {
        gameId: parseInt(gameId),
        stickerId: parseInt(stickerId)
      });

      // Llamar al servicio para agregar el sticker
      const result = await GameService.addStickerToGame(
        parseInt(gameId),
        parseInt(stickerId)
      );

      // MODIFICADO: Ya no bloqueamos stickers repetidos
      if (!result.success) {
        console.log('⚠️  Error controlado en el sticker');
        return res.status(409).json({
          success: false,
          message: result.message,
          alreadyFound: result.alreadyFound || false
        });
      }

      console.log('✅ Sticker agregado exitosamente');
      console.log('📤 Respuesta enviada:', {
        recordId: result.recordId,
        nextTarget: result.nextTarget?.namesticker
      });

      res.status(200).json({
        success: true,
        message: 'Sticker registrado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT addSticker:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo registrar el sticker'
      });
    }
  }

  /**
   * Finaliza una partida y calcula puntuación
   * POST /api/game/:gameId/end
   */
  static async endGame(req, res) {
    console.log('\n🏁 ENDPOINT: POST /api/game/:gameId/end');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔗 Params:', req.params);
    console.log('📥 Request Body:', req.body);

    try {
      const { gameId } = req.params;
      const gameStats = req.body;

      // Validaciones
      if (!gameId || isNaN(parseInt(gameId))) {
        console.error('❌ GameID inválido:', gameId);
        return res.status(400).json({
          success: false,
          error: 'GameID inválido',
          message: 'Debe proporcionar un gameId válido'
        });
      }

      // Validar estadísticas del juego
      const requiredStats = ['timePlayed'];
      const missingStats = requiredStats.filter(stat => !gameStats.hasOwnProperty(stat));
      
      if (missingStats.length > 0) {
        console.error('❌ Estadísticas faltantes:', missingStats);
        return res.status(400).json({
          success: false,
          error: 'Estadísticas incompletas',
          message: `Faltan las siguientes estadísticas: ${missingStats.join(', ')}`,
          required: requiredStats
        });
      }

      console.log('🎮 Finalizando juego:', {
        gameId: parseInt(gameId),
        timePlayed: gameStats.timePlayed,
        timeBonus: gameStats.timeBonus || 0
      });

      // Llamar al servicio para finalizar el juego
      const result = await GameService.endGame(parseInt(gameId), gameStats);

      console.log('✅ Juego finalizado exitosamente');
      console.log('📤 Respuesta enviada:', {
        finalScore: result.finalScore,
        stickersFound: result.stickersFound,
        performance: result.performance
      });

      res.status(200).json({
        success: true,
        message: 'Juego finalizado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT endGame:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo finalizar el juego'
      });
    }
  }

  /**
   * Obtiene los datos de una partida específica
   * GET /api/game/:gameId
   */
  static async getGameData(req, res) {
    console.log('\n📊 ENDPOINT: GET /api/game/:gameId');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔗 Params:', req.params);

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

      console.log('🎮 Obteniendo datos del juego:', parseInt(gameId));

      // Llamar al servicio para obtener datos del juego
      const result = await GameService.getGameData(parseInt(gameId));

      console.log('✅ Datos obtenidos exitosamente');
      console.log('📤 Respuesta enviada para usuario:', result.summary.username);

      res.status(200).json({
        success: true,
        message: 'Datos del juego obtenidos exitosamente',
        data: result
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT getGameData:');
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
          message: error.message || 'No se pudieron obtener los datos del juego'
        });
      }
    }
  }

  /**
   * Obtiene el ranking del scoreboard
   * GET /api/game/scoreboard/ranking
   */
  static async getScoreboardRanking(req, res) {
    console.log('\n🏆 ENDPOINT: GET /api/game/scoreboard/ranking');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('🔗 Query params:', req.query);

    try {
      const { limit = 10 } = req.query;
      const limitNumber = parseInt(limit);

      if (isNaN(limitNumber) || limitNumber <= 0 || limitNumber > 100) {
        console.error('❌ Límite inválido:', limit);
        return res.status(400).json({
          success: false,
          error: 'Límite inválido',
          message: 'El límite debe ser un número entre 1 y 100'
        });
      }

      console.log('🏆 Obteniendo ranking con límite:', limitNumber);

      // Llamar al servicio para obtener el ranking
      const ranking = await GameService.getScoreboardRanking(limitNumber);

      console.log('✅ Ranking obtenido exitosamente');
      console.log('📤 Respuesta enviada con', ranking.length, 'entradas');

      res.status(200).json({
        success: true,
        message: 'Ranking obtenido exitosamente',
        data: {
          ranking: ranking,
          totalEntries: ranking.length,
          limit: limitNumber
        }
      });

    } catch (error) {
      console.error('\n❌ ERROR EN ENDPOINT getScoreboardRanking:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);

      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message || 'No se pudo obtener el ranking'
      });
    }
  }

  /**
   * Manejo de errores 404 para rutas del juego
   */
  static handleNotFound(req, res) {
    console.log('\n❌ RUTA NO ENCONTRADA:');
    console.log('   🔗 URL:', req.originalUrl);
    console.log('   📝 Método:', req.method);

    res.status(404).json({
      success: false,
      error: 'Ruta no encontrada',
      message: `La ruta ${req.method} ${req.originalUrl} no existe`,
      availableRoutes: [
        'POST /api/game/start',
        'POST /api/game/:gameId/add-sticker',
        'POST /api/game/:gameId/end',
        'GET /api/game/:gameId',
        'GET /api/game/scoreboard/ranking'
      ]
    });
  }
}

export default GameController;
