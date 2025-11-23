import GameService from '../../../lib/services/gameService.js';

/**
 * Obtiene los datos completos de una partida para mostrar en scoreboard
 * GET /api/scoreboard/game/:gameId
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // En Vercel, los parámetros dinámicos vienen en req.query
    const gameId = req.query.gameId || req.query['gameId'];


    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({
        success: false,
        error: 'GameID inválido',
        message: 'Debe proporcionar un gameId válido'
      });
    }

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

    res.status(200).json({
      success: true,
      message: 'Datos de scoreboard obtenidos exitosamente',
      data: scoreboardData
    });

  } catch (error) {
    if (error.message.includes('no encontrada')) {
      return res.status(404).json({
        success: false,
        error: 'Partida no encontrada',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'No se pudieron obtener los datos del scoreboard'
    });
  }
}
