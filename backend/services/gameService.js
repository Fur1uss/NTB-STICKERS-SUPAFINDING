import supabase from '../config/supabaseClient.js';
import ScoreCalculator from './scoreCalculator.js';
import StickerService from './stickerService.js';

/**
 * Servicio principal para manejar la lógica del juego
 * Incluye inicio, finalización y gestión de partidas
 */
export class GameService {

  /**
   * Inicia una nueva partida para el usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} Datos de la partida iniciada
   */
  static async startNewGame(userId) {
    console.log('\n🎮 INICIANDO NUEVA PARTIDA');
    console.log('='.repeat(50));
    console.log('👤 Usuario ID:', userId);
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
      // 1. Sincronizar stickers antes de iniciar el juego
      console.log('\n🔄 PASO 1: Sincronizando stickers...');
      await StickerService.syncStickersFromBucket(userId);

      // 2. Crear registro de nueva partida en la base de datos
      console.log('\n💾 PASO 2: Creando registro de partida...');
      const gameData = {
        userid: userId,
        createdate: new Date().toISOString(),
        timeplayed: null, // Se actualizará al finalizar
        scoregame: null   // Se calculará al finalizar
      };

      const { data: newGame, error: gameError } = await supabase
        .from('game')
        .insert([gameData])
        .select()
        .single();

      if (gameError) {
        console.error('❌ Error al crear partida:', gameError);
        throw gameError;
      }

      console.log('✅ Partida creada exitosamente:');
      console.log('   🆔 Game ID:', newGame.id);
      console.log('   📅 Fecha creación:', newGame.createdate);

      // 3. Obtener todos los stickers para el juego PRIMERO
      console.log('\n📦 PASO 3: Obteniendo todos los stickers...');
      const allStickers = await StickerService.getAllStickers();

      // 4. Obtener sticker objetivo inicial DESDE LOS STICKERS DISPONIBLES
      console.log('\n🎯 PASO 4: Obteniendo primer sticker objetivo...');
      const targetSticker = await StickerService.getRandomTargetSticker(allStickers);

      const result = {
        success: true,
        gameId: newGame.id,
        startTime: newGame.createdate,
        targetSticker: targetSticker,
        totalStickers: allStickers.length,
        gameConfig: {
          baseTimeSeconds: 90, // 90 segundos de juego
          bonusTimePerSticker: 5,
          maxGameTime: 300 // 5 minutos máximo
        },
        stickers: allStickers
      };

      console.log('\n🎉 PARTIDA INICIADA EXITOSAMENTE');
      console.log('   🎯 Objetivo inicial:', targetSticker.namesticker);
      console.log('   📊 Total stickers disponibles:', allStickers.length);
      console.log('   ⏱️  Tiempo base:', result.gameConfig.baseTimeSeconds, 'segundos');
      console.log('='.repeat(50));

      return result;

    } catch (error) {
      console.error('\n❌ ERROR AL INICIAR PARTIDA:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);
      console.log('='.repeat(50));
      
      throw {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Registra un sticker encontrado durante la partida
   * @param {number} gameId - ID de la partida
   * @param {number} stickerId - ID del sticker encontrado
   * @returns {Object} Resultado del registro
   */
  static async addStickerToGame(gameId, stickerId) {
    console.log('\n🎯 REGISTRANDO STICKER ENCONTRADO');
    console.log('🎮 Game ID:', gameId);
    console.log('🎯 Sticker ID:', stickerId);

    try {
      // 1. Verificar que la partida existe y está activa
      console.log('\n🔍 PASO 1: Verificando partida...');
      const { data: game, error: gameError } = await supabase
        .from('game')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        console.error('❌ Partida no encontrada:', gameId);
        throw new Error('Partida no encontrada');
      }

      if (game.timeplayed !== null) {
        console.error('❌ La partida ya ha finalizado');
        throw new Error('La partida ya ha finalizado');
      }

      console.log('✅ Partida verificada - Usuario:', game.userid);

      // 2. Verificar que el sticker existe
      console.log('\n🎨 PASO 2: Verificando sticker...');
      const { data: sticker, error: stickerError } = await supabase
        .from('stickers')
        .select('*')
        .eq('id', stickerId)
        .single();

      if (stickerError || !sticker) {
        console.error('❌ Sticker no encontrado:', stickerId);
        throw new Error('Sticker no encontrado');
      }

      console.log('✅ Sticker verificado:', sticker.namesticker);

      // 3. Verificar que el sticker no ha sido encontrado antes en esta partida
      // MODIFICADO: Permitir que los stickers se repitan como objetivos
      console.log('\n🔄 PASO 3: Verificando duplicados...');
      const { data: existingRecord, error: checkError } = await supabase
        .from('stickersongame')
        .select('*')
        .eq('gameid', gameId)
        .eq('stickerid', stickerId);

      if (checkError) {
        console.error('❌ Error verificando duplicados:', checkError);
        throw checkError;
      }

      // MODIFICACIÓN: Ya no bloqueamos stickers repetidos, solo los registramos
      if (existingRecord && existingRecord.length > 0) {
        console.log('⚠️  Sticker ya encontrado anteriormente en esta partida, pero permitiendo repetición');
        // No retornamos error, continuamos con el proceso
      }

      // 4. Registrar el sticker en la partida
      console.log('\n💾 PASO 4: Registrando sticker en partida...');
      const stickerGameData = {
        gameid: gameId,
        stickerid: stickerId
      };

      const { data: newRecord, error: insertError } = await supabase
        .from('stickersongame')
        .insert([stickerGameData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error al registrar sticker:', insertError);
        throw insertError;
      }

      // 5. Obtener el siguiente sticker objetivo desde los stickers disponibles
      console.log('\n🎯 PASO 5: Obteniendo siguiente objetivo...');
      const allStickers = await StickerService.getAllStickers();
      const nextTarget = await StickerService.getRandomTargetSticker(allStickers);

      console.log('✅ STICKER REGISTRADO EXITOSAMENTE');
      console.log('   🆔 Registro ID:', newRecord.id);
      console.log('   🎯 Siguiente objetivo:', nextTarget.namesticker);

      return {
        success: true,
        recordId: newRecord.id,
        foundSticker: sticker,
        nextTarget: nextTarget,
        bonusTimeAdded: 5 // segundos
      };

    } catch (error) {
      console.error('\n❌ ERROR AL REGISTRAR STICKER:');
      console.error('   💥 Mensaje:', error.message);
      throw error;
    }
  }

  /**
   * Finaliza una partida y calcula la puntuación
   * @param {number} gameId - ID de la partida
   * @param {Object} gameStats - Estadísticas del juego
   * @returns {Object} Resultado final de la partida
   */
  static async endGame(gameId, gameStats) {
    console.log('\n🏁 FINALIZANDO PARTIDA');
    console.log('='.repeat(50));
    console.log('🎮 Game ID:', gameId);
    console.log('📊 Estadísticas recibidas:', gameStats);

    try {
      // 1. Verificar que la partida existe
      console.log('\n🔍 PASO 1: Verificando partida...');
      const { data: game, error: gameError } = await supabase
        .from('game')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        console.error('❌ Partida no encontrada:', gameId);
        throw new Error('Partida no encontrada');
      }

      if (game.timeplayed !== null) {
        console.error('❌ La partida ya ha sido finalizada');
        throw new Error('La partida ya ha sido finalizada');
      }

      console.log('✅ Partida encontrada - Usuario:', game.userid);

      // 2. Obtener stickers encontrados en la partida
      console.log('\n🎯 PASO 2: Contando stickers encontrados...');
      const { data: foundStickers, error: stickersError } = await supabase
        .from('stickersongame')
        .select('*, stickers(*)')
        .eq('gameid', gameId);

      if (stickersError) {
        console.error('❌ Error obteniendo stickers:', stickersError);
        throw stickersError;
      }

      const stickersFound = foundStickers.length;
      console.log('🎯 Stickers encontrados:', stickersFound);

      // 3. Calcular puntuación
      console.log('\n🧮 PASO 3: Calculando puntuación...');
      const scoreData = {
        stickersFound: stickersFound,
        timePlayed: gameStats.timePlayed,
        timeBonus: gameStats.timeBonus || 0,
        baseTime: 90 // 90 segundos de juego
      };

      const scoreResult = ScoreCalculator.calculateScore(scoreData);
      const gameStatsResult = ScoreCalculator.calculateGameStats(scoreData);

      // 4. Actualizar la partida con tiempo y puntuación
      console.log('\n💾 PASO 4: Actualizando registro de partida...');
      const updateData = {
        timeplayed: `${Math.floor(gameStats.timePlayed / 3600)}:${Math.floor((gameStats.timePlayed % 3600) / 60)}:${gameStats.timePlayed % 60}`,
        scoregame: scoreResult.finalScore
      };

      const { data: updatedGame, error: updateError } = await supabase
        .from('game')
        .update(updateData)
        .eq('id', gameId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error actualizando partida:', updateError);
        throw updateError;
      }

      console.log('✅ Partida actualizada con puntuación:', scoreResult.finalScore);

      // 5. Crear registro en scoreboard
      console.log('\n🏆 PASO 5: Registrando en scoreboard...');
      const scoreboardData = {
        userid: game.userid,
        gameid: gameId
      };

      const { data: scoreboardRecord, error: scoreboardError } = await supabase
        .from('scoreboardgame')
        .insert([scoreboardData])
        .select()
        .single();

      if (scoreboardError) {
        console.error('❌ Error creando registro scoreboard:', scoreboardError);
        console.error('⚠️ Continuando sin registro en scoreboard...');
        // No hacer throw para que el juego continúe funcionando
      } else {
        console.log('✅ Registro en scoreboard creado:', scoreboardRecord.id);
      }

      const finalResult = {
        success: true,
        gameId: gameId,
        finalScore: scoreResult.finalScore,
        stickersFound: stickersFound,
        timePlayed: gameStats.timePlayed,
        scoreBreakdown: scoreResult.breakdown,
        performance: scoreResult.performance,
        gameStats: gameStatsResult,
        foundStickersList: foundStickers.map(fs => ({
          id: fs.id,
          sticker: fs.stickers
        })),
        scoreboardId: scoreboardRecord.id
      };

      console.log('\n🎉 PARTIDA FINALIZADA EXITOSAMENTE');
      console.log('   🏆 Puntuación final:', scoreResult.finalScore);
      console.log('   🎯 Stickers encontrados:', stickersFound);
      console.log('   ⏱️  Tiempo jugado:', gameStats.timePlayed, 'segundos');
      console.log('   🏅 Performance:', scoreResult.performance);
      console.log('='.repeat(50));

      return finalResult;

    } catch (error) {
      console.error('\n❌ ERROR AL FINALIZAR PARTIDA:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);
      console.log('='.repeat(50));
      
      throw {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Obtiene los datos completos de una partida para el scoreboard
   * @param {number} gameId - ID de la partida
   * @returns {Object} Datos completos de la partida
   */
  static async getGameData(gameId) {
    console.log('\n📊 OBTENIENDO DATOS DE PARTIDA');
    console.log('🎮 Game ID:', gameId);

    try {
      // 1. Obtener datos básicos de la partida
      const { data: game, error: gameError } = await supabase
        .from('game')
        .select(`
          *,
          users (
            id,
            username,
            emailuser
          )
        `)
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        console.error('❌ Partida no encontrada:', gameId);
        throw new Error('Partida no encontrada');
      }

      // 2. Obtener stickers encontrados
      const { data: foundStickers, error: stickersError } = await supabase
        .from('stickersongame')
        .select(`
          *,
          stickers (
            id,
            namesticker,
            urlsticker,
            descriptionsticker
          )
        `)
        .eq('gameid', gameId)
        .order('id');

      if (stickersError) {
        console.error('❌ Error obteniendo stickers:', stickersError);
        throw stickersError;
      }

      // 3. Obtener datos del scoreboard
      const { data: scoreboardData, error: scoreboardError } = await supabase
        .from('scoreboardgame')
        .select('*')
        .eq('gameid', gameId)
        .single();

      if (scoreboardError) {
        console.error('❌ Error obteniendo scoreboard:', scoreboardError);
        // No es crítico, puede que no exista aún
      }

      const result = {
        game: game,
        foundStickers: foundStickers,
        scoreboard: scoreboardData,
        summary: {
          gameId: game.id,
          userId: game.userid,
          username: game.users?.username || 'Usuario',
          score: game.scoregame,
          timePlayed: game.timeplayed,
          stickersFound: foundStickers.length,
          createDate: game.createdate
        }
      };

      console.log('✅ Datos de partida obtenidos exitosamente');
      console.log('   👤 Usuario:', result.summary.username);
      console.log('   🏆 Puntuación:', result.summary.score);
      console.log('   🎯 Stickers:', result.summary.stickersFound);

      return result;

    } catch (error) {
      console.error('\n❌ ERROR OBTENIENDO DATOS DE PARTIDA:');
      console.error('   💥 Mensaje:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el ranking general del scoreboard
   * @param {number} limit - Límite de resultados
   * @returns {Array} Ranking de partidas
   */
  static async getScoreboardRanking(limit = 10) {
    console.log('\n🏆 OBTENIENDO RANKING SCOREBOARD');
    console.log('📊 Límite:', limit);

    try {
      console.log('🔍 PASO 1: Consultando base de datos...');
      const { data: ranking, error } = await supabase
        .from('game')
        .select(`
          *,
          users (
            id,
            username,
            emailuser
          ),
          scoreboardgame (
            id
          )
        `)
        .not('scoregame', 'is', null)
        .order('scoregame', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error obteniendo ranking:', error);
        throw error;
      }

      console.log('✅ Ranking obtenido desde DB:', ranking.length, 'partidas');
      
      // Log detallado de todos los elementos
      console.log('\n📋 ELEMENTOS DE LA TABLA SCOREBOARDGAME DETALLADOS:');
      if (ranking && ranking.length > 0) {
        ranking.forEach((game, index) => {
          console.log(`\n   🎮 PARTIDA ${index + 1}:`);
          console.log(`      🆔 Game ID: ${game.id}`);
          console.log(`      👤 User ID: ${game.userid}`);
          console.log(`      🏆 Score: ${game.scoregame}`);
          console.log(`      ⏱️ Tiempo: ${game.timeplayed}`);
          console.log(`      📅 Fecha: ${game.createdate}`);
          console.log(`      👤 Usuario info:`, game.users);
          console.log(`      🏆 Scoreboard record:`, game.scoreboardgame);
        });
      } else {
        console.log('❌ NO HAY PARTIDAS EN EL RANKING');
        
        // Verificar si hay partidas en la tabla game
        console.log('\n🔍 VERIFICANDO TABLA GAME...');
        const { data: allGames, error: allGamesError } = await supabase
          .from('game')
          .select('*')
          .limit(20);
          
        if (allGamesError) {
          console.error('❌ Error verificando tabla game:', allGamesError);
        } else {
          console.log(`📊 Total de partidas en tabla game: ${allGames.length}`);
          console.log('🎮 Partidas encontradas:');
          allGames.forEach((game, index) => {
            console.log(`   ${index + 1}. ID: ${game.id}, Score: ${game.scoregame}, Time: ${game.timeplayed}, User: ${game.userid}`);
          });
        }
        
        // Verificar si hay registros en scoreboardgame
        console.log('\n🔍 VERIFICANDO TABLA SCOREBOARDGAME...');
        const { data: allScoreboard, error: scoreboardError } = await supabase
          .from('scoreboardgame')
          .select('*')
          .limit(20);
          
        if (scoreboardError) {
          console.error('❌ Error verificando tabla scoreboardgame:', scoreboardError);
        } else {
          console.log(`📊 Total de registros en tabla scoreboardgame: ${allScoreboard.length}`);
          console.log('🏆 Registros encontrados:');
          allScoreboard.forEach((record, index) => {
            console.log(`   ${index + 1}. ID: ${record.id}, UserID: ${record.userid}, GameID: ${record.gameid}`);
          });
        }
      }
      
      return ranking;

    } catch (error) {
      console.error('❌ Error en getScoreboardRanking:', error);
      throw error;
    }
  }
}

export default GameService;
