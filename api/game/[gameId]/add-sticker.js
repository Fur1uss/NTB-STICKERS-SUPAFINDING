import GameService from '../../../lib/services/gameService.js';

/**
 * Registra un sticker encontrado en la partida
 * POST /api/game/:gameId/add-sticker
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // En Vercel, los parámetros dinámicos vienen en req.query
    const gameId = req.query.gameId || req.query['gameId'];
    const { stickerId } = req.body;

    if (!gameId || isNaN(parseInt(gameId))) {
      return res.status(400).json({
        success: false,
        error: 'GameID inválido',
        message: 'Debe proporcionar un gameId válido'
      });
    }

    if (!stickerId || isNaN(parseInt(stickerId))) {
      return res.status(400).json({
        success: false,
        error: 'StickerID inválido',
        message: 'Debe proporcionar un stickerId válido'
      });
    }

    const result = await GameService.addStickerToGame(parseInt(gameId), parseInt(stickerId));

    if (!result.success && result.duplicate) {
      return res.status(409).json({
        success: false,
        message: result.message,
        duplicate: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sticker registrado exitosamente',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'No se pudo registrar el sticker'
    });
  }
}
