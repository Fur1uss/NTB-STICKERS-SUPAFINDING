import GameService from '../../../lib/services/gameService.js';

/**
 * Finaliza una partida y calcula puntuación
 * POST /api/game/:gameId/end
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // En Vercel, los parámetros dinámicos vienen en req.query
    const gameId = req.query.gameId || req.query['gameId'];
    const { timePlayed, timeBonus } = req.body;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({
        success: false,
        error: 'GameID inválido',
        message: 'Debe proporcionar un gameId válido'
      });
    }

    if (timePlayed === undefined || timePlayed === null) {
      return res.status(400).json({
        success: false,
        error: 'timePlayed es requerido',
        message: 'Debe proporcionar el tiempo jugado'
      });
    }

    const gameStats = {
      timePlayed: parseFloat(timePlayed),
      timeBonus: timeBonus ? parseFloat(timeBonus) : 0
    };

    const result = await GameService.endGame(parseInt(gameId), gameStats);

    res.status(200).json({
      success: true,
      message: 'Partida finalizada exitosamente',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'No se pudo finalizar la partida'
    });
  }
}
