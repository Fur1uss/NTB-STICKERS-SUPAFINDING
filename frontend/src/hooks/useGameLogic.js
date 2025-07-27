import { useState, useEffect, useCallback, useRef } from 'react';
import GameAPIService from '../services/gameService.js';
import { getAllStickersFromDB } from '../utils/gameUtils.js';
import supabase from '../config/supabaseClient.js';
import { useNavigate } from 'react-router-dom';

/**
 * Hook personalizado para manejar toda la lógica del juego
 */
export const useGameLogic = (userId) => {
  const navigate = useNavigate();
  
  // Estados del juego
  const [gameState, setGameState] = useState('idle'); // 'idle', 'loading', 'ready', 'playing', 'finished'
  const [gameId, setGameId] = useState(null);
  const [currentGameData, setCurrentGameData] = useState(null);
  
  // Estados de tiempo
  const [timeRemaining, setTimeRemaining] = useState(90); // 90 segundos de juego
  const [timeBonus, setTimeBonus] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalTimePlayed, setTotalTimePlayed] = useState(0);
  
  // Estados de stickers
  const [allStickers, setAllStickers] = useState([]);
  const [stickerImages, setStickerImages] = useState([]);
  const [targetSticker, setTargetSticker] = useState(null);
  const [foundStickers, setFoundStickers] = useState([]);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [foundStickerName, setFoundStickerName] = useState('');
  
  // Referencias para timers
  const gameTimerRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const initializingRef = useRef(false); // Prevenir inicializaciones duplicadas
  const endingGameRef = useRef(false); // Prevenir finalizaciones duplicadas
  const endGameRef = useRef(null); // Referencia para la función endGame

  /**
   * Inicializar el juego
   */
  const initializeGame = useCallback(async () => {
    if (!userId) {
      setError('Usuario no autenticado');
      return;
    }

    // Prevenir inicializaciones duplicadas
    if (initializingRef.current) {
      console.log('🔄 Inicialización ya en progreso, saltando...');
      return;
    }

    console.log('\n🎮 INICIALIZANDO JUEGO');
    initializingRef.current = true;
    setLoading(true);
    setError(null);
    setGameState('loading');

    try {
      // 1. Verificar conectividad con la API
      const apiHealthy = await GameAPIService.checkApiHealth();
      if (!apiHealthy) {
        throw new Error('El servidor del juego no está disponible');
      }

      // 2. Iniciar nueva partida en el backend
      console.log('🚀 Iniciando nueva partida...');
      const gameData = await GameAPIService.startGame(userId);
      
      setGameId(gameData.gameId);
      setCurrentGameData(gameData);
      setTargetSticker(gameData.targetSticker);
      setAllStickers(gameData.stickers);

      // 3. Configurar stickers visuales
      await setupVisualStickers(gameData.stickers);

      setGameState('ready');
      console.log('✅ Juego inicializado correctamente');

    } catch (error) {
      console.error('❌ Error inicializando juego:', error);
      setError(`Error al inicializar el juego: ${error.message}`);
      setGameState('idle');
    } finally {
      setLoading(false);
      initializingRef.current = false; // Resetear flag
    }
  }, [userId]);

  /**
   * Configurar stickers visuales para el juego
   */
  const setupVisualStickers = useCallback(async (stickers) => {
    console.log('🎨 Configurando stickers visuales...');
    console.log('📦 Stickers disponibles del backend:', stickers.length);

    try {
      // Crear mapa de stickers por NOMBRE para encontrar archivos visuales
      const stickersByName = new Map();
      stickers.forEach(sticker => {
        // Si hay múltiples stickers con el mismo nombre, solo usar uno
        if (!stickersByName.has(sticker.namesticker)) {
          stickersByName.set(sticker.namesticker, sticker);
        }
      });

      console.log('🎯 Stickers únicos por nombre:', stickersByName.size);

      // Obtener archivos del bucket para visualización (límite optimizado)
      const { data: files, error: listError } = await supabase.storage
        .from('stickers')
        .list('', { limit: 150, offset: 0 });

      if (listError) throw listError;

      // Generar posiciones aleatorias para stickers
      const visualStickers = [];
      const placedStickers = [];

      // Filtrar archivos y usar solo los que tienen match en la DB
      files
        .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .filter(file => stickersByName.has(file.name))
        .forEach((file) => {
          // Obtener el sticker DB correspondiente (único por nombre)
          const dbSticker = stickersByName.get(file.name);
          
          console.log(`🎯 Mapeando archivo: ${file.name} -> DB ID: ${dbSticker.id}`);

          const { data } = supabase.storage
            .from('stickers')
            .getPublicUrl(file.name);

          // Tamaño aleatorio
          const sizeCategory = Math.random();
          let scale;
          if (sizeCategory < 0.3) {
            scale = 0.4 + Math.random() * 0.3; // Pequeño
          } else if (sizeCategory < 0.7) {
            scale = 0.7 + Math.random() * 0.4; // Mediano
          } else {
            scale = 1.1 + Math.random() * 0.5; // Grande
          }

          // Encontrar posición sin colisiones
          let attempts = 0;
          let x, y, hasCollision;
          
          do {
            x = Math.random() * 80 + 5;
            y = Math.random() * 80 + 5;
            
            hasCollision = placedStickers.some(placed => {
              const baseSize = Math.min(window.innerWidth * 0.12, window.innerHeight * 0.12);
              const size1 = baseSize * scale;
              const size2 = baseSize * placed.scale;
              const minDistance = (size1 + size2) / 2 + window.innerWidth * 0.03;
              
              const distance = Math.sqrt(
                Math.pow(Math.abs(x - placed.x) * window.innerWidth / 100, 2) +
                Math.pow(Math.abs(y - placed.y) * window.innerHeight / 100, 2)
              );
              
              return distance < minDistance;
            });
            
            attempts++;
          } while (hasCollision && attempts < 50);

          const stickerData = {
            id: dbSticker.id,
            name: file.name,
            url: data.publicUrl,
            x, y,
            rotation: Math.random() * 360,
            scale,
            dbSticker
          };

          visualStickers.push(stickerData);
          placedStickers.push({ x, y, scale });
        });

      // Mezcla adicional en el frontend para máxima aleatoriedad
      const finalShuffledStickers = visualStickers.sort(() => Math.random() - 0.5);
      
      setStickerImages(finalShuffledStickers);
      console.log(`✅ ${finalShuffledStickers.length} stickers configurados y mezclados`);
      console.log('🔀 Variedad de stickers:', finalShuffledStickers.slice(0, 3).map(s => s.name));

    } catch (error) {
      console.error('❌ Error configurando stickers visuales:', error);
      throw error;
    }
  }, []);

  /**
   * Finalizar el juego
   */
  const endGame = useCallback(async () => {
    console.log('\n🏁 === FUNCIÓN ENDGAME LLAMADA ===');
    console.log('📊 Estado actual del juego:', gameState);
    
    // Prevenir ejecuciones múltiples
    if (endingGameRef.current) {
      console.log('⚠️ endGame ya está en progreso, ignorando llamada duplicada');
      return;
    }
    
    endingGameRef.current = true;
    
    // Permitir finalizar el juego incluso si no está en estado 'playing'
    if (gameState !== 'playing' && gameState !== 'ready') {
      console.log('⚠️ ADVERTENCIA: endGame() llamada con estado:', gameState);
      // No retornar aquí, continuar con el proceso
    }

    console.log('🏁 FINALIZANDO JUEGO - Proceso iniciado');
    console.log('🔄 Cambiando estado a "finished"...');
    setGameState('finished');

    console.log('🧹 Limpiando timers...');
    // Limpiar timers
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
      console.log('✅ gameTimerRef limpiado');
    } else {
      console.log('ℹ️ gameTimerRef ya estaba null');
    }
    
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
      console.log('✅ successTimeoutRef limpiado');
    } else {
      console.log('ℹ️ successTimeoutRef ya estaba null');
    }

    console.log('📊 Calculando estadísticas finales...');
    // Calcular tiempo total jugado
    const endTime = Date.now();
    let timePlayed = 0;
    
    console.log('🔍 Debug de tiempos:');
    console.log('   - gameStartTime:', gameStartTime);
    console.log('   - endTime:', endTime);
    console.log('   - timeRemaining:', timeRemaining);
    
    if (gameStartTime && gameStartTime > 0) {
      timePlayed = Math.floor((endTime - gameStartTime) / 1000);
      console.log('✅ Usando cálculo basado en timestamps');
    } else {
      console.log('⚠️ gameStartTime es null o inválido, usando 90 - timeRemaining');
      timePlayed = Math.max(0, 90 - timeRemaining);
    }
    
    // Validar que el tiempo jugado esté en un rango razonable
    if (timePlayed < 0) {
      console.log('⚠️ Tiempo jugado negativo, corrigiendo a 0');
      timePlayed = 0;
    } else if (timePlayed > 200) {
      console.log('⚠️ Tiempo jugado excesivo, limitando a 200 segundos');
      timePlayed = 200;
    }
    
    setTotalTimePlayed(timePlayed);
    
    console.log('📈 Estadísticas del juego:');
    console.log('   - gameStartTime:', gameStartTime);
    console.log('   - endTime:', endTime);
    console.log('   - Tiempo jugado:', timePlayed, 'segundos');
    console.log('   - Tiempo bonus:', timeBonus, 'segundos');
    console.log('   - Stickers encontrados:', foundStickers.length);

    try {
      console.log('🌐 Enviando datos finales al backend...');
      
      // Validar tiempo jugado antes de enviar
      if (timePlayed < 0 || timePlayed > 200) {
        console.log('⚠️ Tiempo jugado inválido, corrigiendo a 90 segundos');
        timePlayed = 90;
      }
      
      // Finalizar juego en el backend
      const gameStats = {
        timePlayed,
        timeBonus
      };

      console.log('📤 Enviando al backend:', gameStats);
      const finalResult = await GameAPIService.endGame(gameId, gameStats);
      console.log('🏆 Resultado final del backend:', finalResult);

      // Guardar datos para el scoreboard
      const gameResult = {
        gameId,
        ...finalResult
      };
      
      localStorage.setItem('lastGameResult', JSON.stringify(gameResult));
      console.log('💾 Datos guardados en localStorage:', gameResult);

      console.log('� Redirigiendo inmediatamente al scoreboard...');
      // Redirigir inmediatamente al scoreboard
      navigate(`/scoreboard?gameId=${gameId}`);

    } catch (error) {
      console.error('❌ Error finalizando juego:', error);
      setError(`Error finalizando juego: ${error.message}`);
    } finally {
      // Resetear el flag para permitir futuras ejecuciones
      endingGameRef.current = false;
      console.log('🔄 Flag de endGame reseteado');
    }
  }, [gameState, gameStartTime, timeBonus, gameId, navigate, timeRemaining, foundStickers]);

  // Mantener referencia actualizada de endGame
  endGameRef.current = endGame;

  /**
   * Iniciar el juego
   */
  const startGame = useCallback(() => {
    if (gameState !== 'ready') {
      console.log('⚠️ No se puede iniciar juego, estado actual:', gameState);
      return;
    }

    console.log('🎮 INICIANDO JUEGO');
    const startTime = Date.now();
    
    setGameState('playing');
    setGameStartTime(startTime);
    setTimeRemaining(90); // 90 segundos de juego
    setTimeBonus(0);
    setFoundStickers([]);
    
    console.log('📅 Tiempo de inicio establecido:', new Date(startTime).toISOString());
    
    // Iniciar timer del juego
    console.log('⏰ Iniciando temporizador del juego...');
    gameTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        console.log(`⏱️ Tiempo restante: ${prev}s`);
        
        // Log cada 10 segundos para verificar que el timer funciona
        if (prev % 10 === 0) {
          console.log(`📊 Timer funcionando - Tiempo: ${prev}s | Timer ID:`, gameTimerRef.current);
        }
        
        if (prev <= 1) {
          console.log('🚨 TIEMPO AGOTADO! Iniciando proceso de finalización...');
          console.log('🔄 Limpiando timer...');
          
          // Limpiar el timer antes de terminar el juego
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
            console.log('✅ Timer limpiado correctamente');
          }
          
          console.log('🏁 Llamando a endGame()...');
          // Usar setTimeout para asegurar que endGame se ejecute fuera del callback del timer
          setTimeout(() => {
            if (endGameRef.current) {
              endGameRef.current();
            }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    console.log('✅ Timer iniciado con ID:', gameTimerRef.current);

  }, [gameState]);

  /**
   * Mezclar/reordenar stickers aleatoriamente
   * MODIFICADO: Incluye todos los stickers, incluso los encontrados
   */
  const shuffleStickers = useCallback(() => {
    if (gameState !== 'playing') return;

    console.log('🔀 MEZCLANDO STICKERS');
    console.log('📊 Stickers encontrados:', foundStickers.length);
    console.log('🎯 Incluyendo stickers encontrados en la mezcla');
    
    setStickerImages(prevStickers => {
      const shuffledStickers = [...prevStickers];
      const placedStickers = [];

      // Reasignar posiciones aleatorias a cada sticker (incluyendo encontrados)
      shuffledStickers.forEach(sticker => {
        let attempts = 0;
        let x, y, hasCollision;
        
        do {
          x = Math.random() * 80 + 5;
          y = Math.random() * 80 + 5;
          
          hasCollision = placedStickers.some(placed => {
            const baseSize = Math.min(window.innerWidth * 0.12, window.innerHeight * 0.12);
            const size1 = baseSize * sticker.scale;
            const size2 = baseSize * placed.scale;
            const minDistance = (size1 + size2) / 2 + window.innerWidth * 0.03;
            
            const distance = Math.sqrt(
              Math.pow(Math.abs(x - placed.x) * window.innerWidth / 100, 2) +
              Math.pow(Math.abs(y - placed.y) * window.innerHeight / 100, 2)
            );
            
            return distance < minDistance;
          });
          
          attempts++;
        } while (hasCollision && attempts < 50);

        // Actualizar posición y rotación
        sticker.x = x;
        sticker.y = y;
        sticker.rotation = Math.random() * 360;
        
        placedStickers.push({ x, y, scale: sticker.scale });
      });

      console.log('✅ Stickers mezclados exitosamente');
      return shuffledStickers;
    });
  }, [gameState, foundStickers.length]);

  /**
   * Manejar click en sticker
   * MODIFICADO: Los stickers no se deshabilitan al ser encontrados
   */
  const handleStickerClick = useCallback(async (sticker, event) => {
    if (gameState !== 'playing' || !targetSticker) return;

    console.log('\n🎯 === CLICK EN STICKER ===');
    console.log('📝 Sticker clickeado:', {
      id: sticker.id,
      name: sticker.name,
      dbSticker: sticker.dbSticker
    });
    console.log('📝 Sticker objetivo actual:', {
      id: targetSticker.id,
      name: targetSticker.namesticker,
      description: targetSticker.descriptionsticker
    });
    console.log('🔍 Comparando IDs:', sticker.id, '===', targetSticker.id);

    // Verificar si es el sticker objetivo
    if (sticker.id === targetSticker.id) {
      console.log('✅ ¡MATCH! Este es el sticker correcto');
      console.log('🎉 Procediendo a registrar el sticker encontrado...');

      try {
        // Registrar sticker en el backend
        const result = await GameAPIService.addStickerToGame(gameId, sticker.id);
        
        if (result.success !== false) {
          // Agregar al array local para conteo (pero no deshabilitar visualmente)
          setFoundStickers(prev => {
            if (!prev.includes(sticker.id)) {
              return [...prev, sticker.id];
            }
            return prev;
          });

          // Agregar tiempo bonus (5 segundos)
          setTimeBonus(prev => prev + 5);
          setTimeRemaining(prev => prev + 5);

          // Mostrar feedback de éxito
          setFoundStickerName(targetSticker.descriptionsticker || targetSticker.namesticker);
          setShowSuccess(true);

          // Establecer nuevo objetivo (puede ser el mismo sticker)
          if (result.nextTarget) {
            setTargetSticker(result.nextTarget);
          }

          // 🔄 MEZCLAR STICKERS INMEDIATAMENTE DESPUÉS DE ENCONTRAR UNO
          console.log('🔄 Llamando a shuffleStickers() después de encontrar sticker...');
          shuffleStickers();

          // Limpiar mensaje de éxito después de 2 segundos
          if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
          }
          successTimeoutRef.current = setTimeout(() => {
            setShowSuccess(false);
          }, 2000);

        } else if (result.alreadyFound) {
          console.log('⚠️ Sticker ya encontrado anteriormente');
          // Mostrar feedback visual
          showIncorrectFeedback(event.target);
        }

      } catch (error) {
        console.error('❌ Error registrando sticker:', error);
        showIncorrectFeedback(event.target);
      }

    } else {
      console.log('❌ STICKER INCORRECTO');
      console.log('🔍 Detalles de la comparación:');
      console.log('   - ID del sticker clickeado:', sticker.id, '(type:', typeof sticker.id, ')');
      console.log('   - ID del sticker objetivo:', targetSticker.id, '(type:', typeof targetSticker.id, ')');
      console.log('   - Nombres: clickeado =', sticker.name, '| objetivo =', targetSticker.namesticker);
      showIncorrectFeedback(event.target);
    }
  }, [gameState, targetSticker, gameId, shuffleStickers]);

  /**
   * Mostrar feedback visual para sticker incorrecto
   */
  const showIncorrectFeedback = useCallback((element) => {
    if (!element) return;
    
    element.style.filter = 'sepia(100%) saturate(200%) hue-rotate(0deg) brightness(0.8)';
    element.style.transform += ' scale(0.9)';
    
    setTimeout(() => {
      element.style.filter = '';
      element.style.transform = element.style.transform.replace(' scale(0.9)', '');
    }, 300);
  }, []);

  /**
   * Reiniciar juego
   */
  const resetGame = useCallback(() => {
    console.log('🔄 REINICIANDO JUEGO');
    
    // Limpiar timers
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }

    // Resetear flags
    initializingRef.current = false;
    endingGameRef.current = false;

    // Resetear estados
    setGameState('idle');
    setGameId(null);
    setCurrentGameData(null);
    setTimeRemaining(5);
    setTimeBonus(0);
    setGameStartTime(null);
    setTotalTimePlayed(0);
    setAllStickers([]);
    setStickerImages([]);
    setTargetSticker(null);
    setFoundStickers([]);
    setShowSuccess(false);
    setFoundStickerName('');
    setError(null);

    // Reinicializar
    initializeGame();
  }, [initializeGame]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Inicializar automáticamente cuando hay userId
  useEffect(() => {
    if (userId && gameState === 'idle') {
      initializeGame();
    }
  }, [userId, gameState, initializeGame]);

  return {
    // Estados del juego
    gameState,
    gameId,
    currentGameData,
    
    // Estados de tiempo
    timeRemaining,
    timeBonus,
    totalTimePlayed,
    
    // Estados de stickers
    stickerImages,
    targetSticker,
    foundStickers,
    
    // Estados de UI
    loading,
    error,
    showSuccess,
    foundStickerName,
    
    // Funciones
    initializeGame,
    startGame,
    handleStickerClick,
    endGame,
    resetGame,
    shuffleStickers
  };
};

export default useGameLogic;
