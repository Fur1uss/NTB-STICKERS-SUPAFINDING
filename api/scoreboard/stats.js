import GameService from '../../lib/services/gameService.js';

/**
 * Obtiene estadísticas generales del scoreboard
 * GET /api/scoreboard/stats
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    // Obtener todas las partidas para calcular estadísticas
    const allGames = await GameService.getScoreboardRanking(1000);

    if (allGames.length === 0) {
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

    // Calcular tiempo promedio
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

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'No se pudieron obtener las estadísticas'
    });
  }
}
