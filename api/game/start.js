import GameService from '../../lib/services/gameService.js';

/**
 * Inicia una nueva partida
 * POST /api/game/start
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'UserID es requerido',
        message: 'Debe proporcionar un userId válido para iniciar el juego'
      });
    }

    // Llamar al servicio para iniciar el juego
    const result = await GameService.startNewGame(userId);

    res.status(201).json({
      success: true,
      message: 'Juego iniciado exitosamente',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'No se pudo iniciar el juego'
    });
  }
}
