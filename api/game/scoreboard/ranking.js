import GameService from '../../../lib/services/gameService.js';

/**
 * Obtiene el ranking del scoreboard
 * GET /api/game/scoreboard/ranking
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);


    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 50) {
      return res.status(400).json({
        success: false,
        error: 'Límite inválido',
        message: 'El límite debe ser un número entre 1 y 50'
      });
    }

    const ranking = await GameService.getScoreboardRanking(limitNum);

    res.status(200).json({
      success: true,
      message: 'Ranking obtenido exitosamente',
      data: ranking
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'No se pudo obtener el ranking'
    });
  }
}
