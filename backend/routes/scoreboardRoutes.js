import express from 'express';
import { ScoreboardController } from '../controllers/scoreboardController.js';

const router = express.Router();

console.log('🏆 Configurando rutas del scoreboard...');

/**
 * Middleware de logging para todas las rutas del scoreboard
 */
router.use((req, res, next) => {
  console.log('\n🏆 SCOREBOARD ROUTE ACCESS');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔗 Method:', req.method);
  console.log('🔗 URL:', req.originalUrl);
  console.log('🔗 IP:', req.ip);
  console.log('🔗 User-Agent:', req.get('User-Agent'));
  next();
});

/**
 * GET /api/scoreboard/game/:gameId
 * Obtiene los datos completos de una partida para mostrar en scoreboard
 * Params: { gameId: number }
 */
router.get('/game/:gameId', ScoreboardController.getGameScoreboard);

/**
 * GET /api/scoreboard/ranking
 * Obtiene el ranking global del scoreboard
 * Query: { 
 *   limit?: number (1-50, default: 10),
 *   page?: number (default: 1),
 *   userId?: number (para mostrar posición específica)
 * }
 */
router.get('/ranking', ScoreboardController.getGlobalRanking);

/**
 * GET /api/scoreboard/stats
 * Obtiene estadísticas generales del scoreboard
 */
router.get('/stats', ScoreboardController.getScoreboardStats);

/**
 * Middleware de manejo de errores para rutas no encontradas
 */
router.use('*', ScoreboardController.handleNotFound);

console.log('✅ Rutas del scoreboard configuradas:');
console.log('   📝 GET /api/scoreboard/game/:gameId');
console.log('   📝 GET /api/scoreboard/ranking');
console.log('   📝 GET /api/scoreboard/stats');

export default router;
