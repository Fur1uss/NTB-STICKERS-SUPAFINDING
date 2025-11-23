import { useState, useEffect, useCallback, useRef } from 'react';
import GameServiceDirect from '../services/gameServiceDirect.js';
import { getAllStickersFromDB } from '../utils/gameUtils.js';
import supabase from '../config/supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import soundService from '../services/soundService.js';

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
  
  // 🔒 Protección contra clics múltiples
  const [isProcessingClick, setIsProcessingClick] = useState(false);

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
      return;
    }

    initializingRef.current = true;
    setLoading(true);
    setError(null);
    setGameState('loading');

    try {
      // 1. Iniciar nueva partida directamente con Supabase
      const gameData = await GameServiceDirect.startNewGame(userId);
      
      setGameId(gameData.gameId);
      setCurrentGameData(gameData);
      setTargetSticker(gameData.targetSticker);
      setAllStickers(gameData.stickers);

      // 3. Configurar stickers visuales
      await setupVisualStickers(gameData.stickers);

      setGameState('ready');

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
    try {
      // Crear mapa de stickers por URL del archivo para encontrar archivos visuales
      const stickersByUrl = new Map();
      stickers.forEach(sticker => {
        // Extraer el nombre del archivo de la URL para hacer el match
        if (sticker.urlsticker) {
          const fileName = sticker.urlsticker.split('/').pop();
          // Si hay múltiples stickers con el mismo archivo, solo usar uno
          if (!stickersByUrl.has(fileName)) {
            stickersByUrl.set(fileName, sticker);
          }
        }
      });

      // Obtener archivos del bucket para visualización (límite optimizado)
      const { data: files, error: listError } = await supabase.storage
        .from('stickers')
        .list('', { limit: 150, offset: 0 });

      if (listError) throw listError;

      // Generar posiciones aleatorias para stickers
      const visualStickers = [];
      const placedStickers = [];

      // Filtrar archivos y usar solo los que tienen match en la DB por nombre de archivo
      files
        .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .filter(file => stickersByUrl.has(file.name))
        .forEach((file) => {
          // Obtener el sticker DB correspondiente (único por archivo)
          const dbSticker = stickersByUrl.get(file.name);

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

    } catch (error) {
      console.error('❌ Error configurando stickers visuales:', error);
      throw error;
    }
  }, []);

  /**
   * Finalizar el juego
   */
  const endGame = useCallback(async () => {
    // Prevenir ejecuciones múltiples
    if (endingGameRef.current) {
      return;
    }
    
    endingGameRef.current = true;
    
    setGameState('finished');

    // 🔇 Detener música de fondo
    soundService.stopBackgroundMusic();

    // Limpiar timers
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }

    // Calcular tiempo total jugado
    const endTime = Date.now();
    let timePlayed = 0;
    
    if (gameStartTime && gameStartTime > 0) {
      timePlayed = Math.floor((endTime - gameStartTime) / 1000);
    } else {
      timePlayed = Math.max(0, 90 - timeRemaining);
    }
    
    // Validar que el tiempo jugado esté en un rango razonable
    if (timePlayed < 0) {
      timePlayed = 0;
    } else if (timePlayed > 200) {
      timePlayed = 200;
    }
    
    setTotalTimePlayed(timePlayed);

    try {
      // Validar tiempo jugado antes de enviar
      if (timePlayed < 0 || timePlayed > 200) {
        timePlayed = 90;
      }
      
      // Finalizar juego en el backend (enviar stickers encontrados también)
      const gameStats = {
        timePlayed,
        timeBonus
      };

      const finalResult = await GameServiceDirect.endGame(gameId, gameStats, foundStickers);

      // Guardar datos para el scoreboard
      const gameResult = {
        gameId,
        ...finalResult
      };
      
      localStorage.setItem('lastGameResult', JSON.stringify(gameResult));

      // Redirigir inmediatamente al scoreboard
      navigate(`/scoreboard?gameId=${gameId}`);

    } catch (error) {
      console.error('❌ Error finalizando juego:', error);
      setError(`Error finalizando juego: ${error.message}`);
    } finally {
      // Resetear el flag para permitir futuras ejecuciones
      endingGameRef.current = false;
    }
  }, [gameState, gameStartTime, timeBonus, gameId, navigate, timeRemaining, foundStickers]);

  // Mantener referencia actualizada de endGame
  endGameRef.current = endGame;

  /**
   * Iniciar el juego
   */
  const startGame = useCallback(() => {
    if (gameState !== 'ready') {
      return;
    }

    const startTime = Date.now();
    
    setGameState('playing');
    setGameStartTime(startTime);
    setTimeRemaining(90); // 90 segundos de juego
    setTimeBonus(0);
    setFoundStickers([]);
    
    // 🎵 Cambiar de música del menú a música del juego
    soundService.switchToGameMusic();
    
    // Iniciar timer del juego
    gameTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Limpiar el timer antes de terminar el juego
          if (gameTimerRef.current) {
            clearInterval(gameTimerRef.current);
            gameTimerRef.current = null;
          }
          
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

  }, [gameState]);

  /**
   * Mezclar/reordenar stickers aleatoriamente
   * MODIFICADO: Incluye todos los stickers, incluso los encontrados
   */
  const shuffleStickers = useCallback(() => {
    if (gameState !== 'playing') return;
    
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

      return shuffledStickers;
    });
  }, [gameState, foundStickers.length]);

  /**
   * Manejar click en sticker
   * MODIFICADO: Los stickers no se deshabilitan al ser encontrados
   * NUEVO: Protección contra clics múltiples rápidos
   */
  const handleStickerClick = useCallback(async (sticker, event) => {
    if (gameState !== 'playing' || !targetSticker) return;

    // 🔒 PROTECCIÓN CONTRA CLICS MÚLTIPLES RÁPIDOS
    if (isProcessingClick || event.target.dataset.processing === 'true') {
      return;
    }

    // Marcar como en procesamiento
    setIsProcessingClick(true);
    event.target.dataset.processing = 'true';

    // Verificar si es el sticker objetivo
    if (sticker.id === targetSticker.id) {

      try {
        // Validar sticker (sin guardar en DB todavía)
        const result = await GameServiceDirect.validateSticker(gameId, sticker.id);
        
        if (result.success !== false) {
          // Agregar al array local (se guardará en DB al finalizar)
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

          // 🔊 Reproducir sonido aleatorio al encontrar sticker
          soundService.playRandomStickerSound();

          // Establecer nuevo objetivo (puede ser el mismo sticker)
          if (result.nextTarget) {
            setTargetSticker(result.nextTarget);
          }

          // 🔄 MEZCLAR STICKERS INMEDIATAMENTE DESPUÉS DE ENCONTRAR UNO
          shuffleStickers();

          // Limpiar mensaje de éxito después de 2 segundos
          if (successTimeoutRef.current) {
            clearTimeout(successTimeoutRef.current);
          }
          successTimeoutRef.current = setTimeout(() => {
            setShowSuccess(false);
          }, 2000);

        } else if (result.alreadyFound) {
          if (!result.duplicate) {
            // Mostrar feedback visual
            showIncorrectFeedback(event.target);
          }
        }

      } catch (error) {
        console.error('❌ Error registrando sticker:', error);
        showIncorrectFeedback(event.target);
      }

    } else {
      showIncorrectFeedback(event.target);
    }

    // 🔓 LIBERAR BLOQUEO DESPUÉS DE UN PEQUEÑO DELAY
    setTimeout(() => {
      setIsProcessingClick(false);
      if (event.target) {
        event.target.dataset.processing = 'false';
      }
    }, 500); // 500ms de protección

  }, [gameState, targetSticker, gameId, shuffleStickers, isProcessingClick]);

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
