import express from 'express';
import GameController from '../controllers/gameController.js';

const router = express.Router();

console.log('🛣️  Configurando rutas del juego...');

/**
 * Middleware de logging para todas las rutas del juego
 */
router.use((req, res, next) => {
  console.log('\n🎮 GAME ROUTE ACCESS');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('🔗 Method:', req.method);
  console.log('🔗 URL:', req.originalUrl);
  console.log('🔗 IP:', req.ip);
  console.log('🔗 User-Agent:', req.get('User-Agent'));
  next();
});

/**
 * POST /api/game/start
 * Inicia una nueva partida
 * Body: { userId: number }
 */
router.post('/start', GameController.startGame);

/**
 * POST /api/game/:gameId/add-sticker
 * Registra un sticker encontrado en la partida
 * Params: { gameId: number }
 * Body: { stickerId: number }
 */
router.post('/:gameId/add-sticker', GameController.addSticker);

/**
 * POST /api/game/:gameId/end
 * Finaliza una partida y calcula puntuación
 * Params: { gameId: number }
 * Body: { timePlayed: number, timeBonus?: number }
 */
router.post('/:gameId/end', GameController.endGame);

/**
 * GET /api/game/scoreboard/ranking
 * Obtiene el ranking del scoreboard
 * Query: { limit?: number }
 * NOTA: Esta ruta debe ir ANTES de /:gameId para evitar conflictos
 */
router.get('/scoreboard/ranking', GameController.getScoreboardRanking);

/**
 * GET /api/game/:gameId
 * Obtiene los datos de una partida específica
 * Params: { gameId: number }
 */
router.get('/:gameId', GameController.getGameData);

/**
 * Middleware de manejo de errores para rutas no encontradas
 */
router.use('*', GameController.handleNotFound);

console.log('✅ Rutas del juego configuradas:');
console.log('   📝 POST /api/game/start');
console.log('   📝 POST /api/game/:gameId/add-sticker');
console.log('   📝 POST /api/game/:gameId/end');
console.log('   📝 GET /api/game/:gameId');
console.log('   📝 GET /api/game/scoreboard/ranking');

export default router;
