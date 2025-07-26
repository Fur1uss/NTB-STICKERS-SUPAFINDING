/**
 * Servicio para calcular puntuaciones del juego
 * Algoritmo de puntuación:
 * - Base: 100 puntos por sticker encontrado
 * - Bonus por tiempo extra ganado: 10 puntos por segundo extra
 * - Bonus por eficiencia: más puntos si encuentra stickers rápidamente
 * - Penalty por uso excesivo de tiempo: reducción si usa mucho tiempo
 */

export class ScoreCalculator {
  
  /**
   * Calcula la puntuación final del juego
   * @param {Object} gameData - Datos del juego
   * @param {number} gameData.stickersFound - Cantidad de stickers encontrados
   * @param {number} gameData.timePlayed - Tiempo total jugado en segundos
   * @param {number} gameData.timeBonus - Tiempo bonus ganado en segundos
   * @param {number} gameData.baseTime - Tiempo base del juego (90 segundos)
   * @returns {Object} Resultado del cálculo con puntuación y detalles
   */
  static calculateScore(gameData) {
    console.log('\n🧮 INICIANDO CÁLCULO DE PUNTUACIÓN');
    console.log('='.repeat(50));
    console.log('📊 Datos del juego recibidos:');
    console.log('   🎯 Stickers encontrados:', gameData.stickersFound);
    console.log('   ⏱️  Tiempo jugado:', gameData.timePlayed, 'segundos');
    console.log('   ⏰ Tiempo bonus:', gameData.timeBonus, 'segundos');
    console.log('   📏 Tiempo base:', gameData.baseTime, 'segundos');

    const { stickersFound, timePlayed, timeBonus, baseTime = 90 } = gameData;

    // 1. Puntuación base por stickers encontrados
    const baseStickerPoints = stickersFound * 100;
    console.log('\n💎 PUNTUACIÓN BASE:');
    console.log('   🎯 Stickers × 100 =', baseStickerPoints, 'puntos');

    // 2. Bonus por tiempo extra ganado
    const timeBonusPoints = timeBonus * 10;
    console.log('\n⏰ BONUS POR TIEMPO EXTRA:');
    console.log('   ⏱️  Tiempo bonus × 10 =', timeBonusPoints, 'puntos');

    // 3. Bonus por eficiencia (stickers por minuto)
    const efficiencyRate = stickersFound / (timePlayed / 60);
    let efficiencyBonus = 0;
    
    if (efficiencyRate >= 2) {
      efficiencyBonus = 200; // Muy eficiente
    } else if (efficiencyRate >= 1.5) {
      efficiencyBonus = 150; // Eficiente
    } else if (efficiencyRate >= 1) {
      efficiencyBonus = 100; // Normal
    } else if (efficiencyRate >= 0.5) {
      efficiencyBonus = 50; // Lento
    }
    
    console.log('\n⚡ BONUS POR EFICIENCIA:');
    console.log('   📈 Ratio:', efficiencyRate.toFixed(2), 'stickers/min');
    console.log('   🏆 Bonus eficiencia:', efficiencyBonus, 'puntos');

    // 4. Penalty por tiempo excesivo (si juega más del tiempo base + bonus)
    const maxAllowedTime = baseTime + timeBonus;
    let timePenalty = 0;
    
    if (timePlayed > maxAllowedTime) {
      const extraTime = timePlayed - maxAllowedTime;
      timePenalty = extraTime * 5; // 5 puntos de penalización por segundo extra
    }
    
    console.log('\n⚠️  PENALTY POR TIEMPO EXCESIVO:');
    console.log('   ⏳ Tiempo máximo permitido:', maxAllowedTime, 'segundos');
    console.log('   🚫 Penalty aplicada:', timePenalty, 'puntos');

    // 5. Cálculo final
    const finalScore = Math.max(0, baseStickerPoints + timeBonusPoints + efficiencyBonus - timePenalty);
    
    console.log('\n🏆 PUNTUACIÓN FINAL:');
    console.log('   📊 Base:', baseStickerPoints);
    console.log('   ⏰ + Tiempo bonus:', timeBonusPoints);
    console.log('   ⚡ + Eficiencia:', efficiencyBonus);
    console.log('   🚫 - Penalty:', timePenalty);
    console.log('   🎯 TOTAL:', finalScore, 'PUNTOS');
    console.log('='.repeat(50));

    const result = {
      finalScore,
      breakdown: {
        baseStickerPoints,
        timeBonusPoints,
        efficiencyBonus,
        timePenalty,
        efficiencyRate: parseFloat(efficiencyRate.toFixed(2))
      },
      performance: this.getPerformanceRating(efficiencyRate, finalScore)
    };

    console.log('✅ Cálculo de puntuación completado exitosamente');
    return result;
  }

  /**
   * Determina el rating de performance basado en eficiencia y puntuación
   * @param {number} efficiencyRate - Ratio de eficiencia
   * @param {number} finalScore - Puntuación final
   * @returns {string} Rating de performance
   */
  static getPerformanceRating(efficiencyRate, finalScore) {
    console.log('\n🏅 EVALUANDO PERFORMANCE:');
    
    let rating = 'NOVATO';
    
    if (finalScore >= 1000 && efficiencyRate >= 2) {
      rating = 'MAESTRO';
    } else if (finalScore >= 700 && efficiencyRate >= 1.5) {
      rating = 'EXPERTO';
    } else if (finalScore >= 400 && efficiencyRate >= 1) {
      rating = 'AVANZADO';
    } else if (finalScore >= 200) {
      rating = 'INTERMEDIO';
    }
    
    console.log('   🏆 Rating asignado:', rating);
    return rating;
  }

  /**
   * Calcula estadísticas adicionales del juego
   * @param {Object} gameData - Datos del juego
   * @returns {Object} Estadísticas adicionales
   */
  static calculateGameStats(gameData) {
    console.log('\n📈 CALCULANDO ESTADÍSTICAS ADICIONALES');
    
    const { stickersFound, timePlayed, timeBonus } = gameData;
    
    const averageTimePerSticker = stickersFound > 0 ? timePlayed / stickersFound : 0;
    const bonusTimePercentage = ((timeBonus / timePlayed) * 100).toFixed(1);
    
    const stats = {
      averageTimePerSticker: parseFloat(averageTimePerSticker.toFixed(2)),
      bonusTimePercentage: parseFloat(bonusTimePercentage),
      totalInteractions: stickersFound,
      gameEfficiency: stickersFound > 0 ? 'PRODUCTIVO' : 'SIN_PROGRESO'
    };
    
    console.log('   ⏱️  Tiempo promedio por sticker:', stats.averageTimePerSticker, 'segundos');
    console.log('   📊 Porcentaje de tiempo bonus:', stats.bonusTimePercentage, '%');
    console.log('   🎯 Total interacciones:', stats.totalInteractions);
    console.log('   📈 Eficiencia del juego:', stats.gameEfficiency);
    
    return stats;
  }
}

export default ScoreCalculator;
