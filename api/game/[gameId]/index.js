import GameService from '../../../lib/services/gameService.js';

/**
 * Obtiene los datos de una partida específica
 * GET /api/game/:gameId
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

    res.status(200).json({
      success: true,
      message: 'Datos de partida obtenidos exitosamente',
      data: gameData
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
      message: error.message || 'No se pudieron obtener los datos de la partida'
    });
  }
}
