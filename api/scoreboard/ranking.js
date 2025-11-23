import GameService from '../../lib/services/gameService.js';

/**
 * Obtiene el ranking global del scoreboard
 * GET /api/scoreboard/ranking
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 10, page = 1, userId } = req.query;

    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page);

    // Validaciones
    if (isNaN(limitNumber) || limitNumber <= 0 || limitNumber > 50) {
      return res.status(400).json({
        success: false,
        error: 'Límite inválido',
        message: 'El límite debe ser un número entre 1 y 50'
      });
    }

    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Página inválida',
        message: 'La página debe ser un número mayor a 0'
      });
    }

    // Obtener ranking global
    const totalLimit = limitNumber * pageNumber;
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

    res.status(200).json({
      success: true,
      message: 'Ranking global obtenido exitosamente',
      data: responseData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'No se pudo obtener el ranking global'
    });
  }
}
