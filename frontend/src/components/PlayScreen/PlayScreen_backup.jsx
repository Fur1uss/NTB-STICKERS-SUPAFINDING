import React, { useState, useEffect, useCallback, useMemo } from "react";
import supabase from "../../config/supabaseClient";
import { 
  syncStickersFromBucket, 
  getAllStickersFromDB, 
  getRandomTargetSticker 
} from "../../utils/gameUtils";
import "./playScreen.css";

const PlayScreen = ({ imageUrls = [], onGameReady }) => {
  const [stickerImages, setStickerImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados del juego
  const [gameStarted, setGameStarted] = useState(false);
  const [targetSticker, setTargetSticker] = useState(null);
  const [foundStickers, setFoundStickers] = useState([]);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [foundStickerName, setFoundStickerName] = useState('');

  // Memoizar el callback de click para evitar recreaciones
  const handleStickerClick = useCallback(async (stickerName, stickerId) => {
    console.log('Clicked sticker:', stickerName, 'ID:', stickerId);
    
    // Verificar si es el sticker objetivo
    if (targetSticker && stickerId === targetSticker.id) {
      console.log('¡Sticker correcto encontrado!');
      
      // Agregar al array de encontrados
      setFoundStickers(prev => {
        if (!prev.includes(stickerId)) {
          return [...prev, stickerId];
        }
        return prev;
      });
      
      // Mostrar feedback de éxito
      setFoundStickerName(targetSticker.displayName);
      setShowSuccess(true);
      
      // Ocultar el mensaje después de 2 segundos y buscar nuevo objetivo
      setTimeout(async () => {
        setShowSuccess(false);
        
        // Obtener nuevo sticker objetivo
        try {
          const newTarget = await getRandomTargetSticker();
          setTargetSticker(newTarget);
          console.log('🎯 Nuevo objetivo:', newTarget.displayName);
        } catch (error) {
          console.error('Error obteniendo nuevo objetivo:', error);
        }
      }, 2000);
      
    } else {
      console.log('Sticker incorrecto');
      
      // Mostrar feedback negativo temporal
      const clickedElement = event.target;
      clickedElement.style.filter = 'sepia(100%) saturate(200%) hue-rotate(0deg) brightness(0.8)';
      clickedElement.style.transform += ' scale(0.9)';
      
      setTimeout(() => {
        clickedElement.style.filter = '';
        clickedElement.style.transform = clickedElement.style.transform.replace(' scale(0.9)', '');
      }, 300);
    }
  }, [targetSticker]);

  // Función para inicializar el juego
  const initializeGame = useCallback(async () => {
    try {
      console.log('🎮 Iniciando inicialización del juego...');
      setLoading(true);
      
      // 1. Obtener usuario actual de la sesión (ya debe estar autenticado)
      console.log('📋 Verificando sesión de usuario...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Usuario no autenticado. Por favor inicia sesión.');
      }
      console.log('✅ Usuario autenticado:', session.user.email);
      
      // 2. Usar la misma función que MainScreen para obtener/crear usuario
      console.log('🔍 Obteniendo usuario de la base de datos...');
      const userData = await createOrGetUser();
      console.log('✅ Usuario obtenido:', userData.username);
      
      setCurrentUser(userData);
      
      // 3. Sincronizar stickers del bucket con la DB
      console.log('🎨 Sincronizando stickers...');
      await syncStickersFromBucket(userData.id);
      
      // 4. Obtener todos los stickers de la DB
      console.log('🗂️ Obteniendo stickers de la base de datos...');
      const dbStickers = await getAllStickersFromDB();
      console.log('🗂️ Stickers obtenidos:', dbStickers.length);
      
      // 5. Crear el mapa de stickers con sus IDs de la DB
      console.log('🗺️ Creando mapa de stickers...');
      const stickerMap = new Map();
      dbStickers.forEach(sticker => {
        stickerMap.set(sticker.namesticker, sticker);
      });
      console.log('🗺️ Mapa de stickers creado con', stickerMap.size, 'elementos');
      
      // 6. Obtener archivos del bucket para la visualización
      console.log('📦 Obteniendo archivos del bucket de storage...');
      const { data: files, error: listError } = await supabase.storage
        .from('stickers')
        .list('', {
          limit: 200,
          offset: 0
        });

      if (listError) {
        console.error('❌ Error al obtener archivos del bucket:', listError);
        throw listError;
      }
      console.log('📦 Archivos obtenidos del bucket:', files?.length || 0);

      // 7. Generar URLs y asociar con IDs de la DB
      console.log('🔗 Generando URLs y asociando con IDs de la DB...');
      const imageUrls = [];
      const placedStickers = [];
      
      files
        .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .forEach((file, index) => {
          const dbSticker = stickerMap.get(file.name);
          
          if (!dbSticker) {
            console.warn(`Sticker ${file.name} no encontrado en la DB`);
            return;
          }
          
          const { data } = supabase.storage
            .from('stickers')
            .getPublicUrl(file.name);
          
          // Sistema de tamaños aleatorios
          const sizeCategory = Math.random();
          let scale;
          
          if (sizeCategory < 0.3) {
            scale = 0.4 + Math.random() * 0.3;
          } else if (sizeCategory < 0.7) {
            scale = 0.7 + Math.random() * 0.4;
          } else {
            scale = 1.1 + Math.random() * 0.5;
          }
          
          // Función de detección de colisiones
          const checkCollision = (x1, y1, scale1, x2, y2, scale2) => {
            const baseSize = Math.min(window.innerWidth * 0.12, window.innerHeight * 0.12);
            const size1 = baseSize * scale1;
            const size2 = baseSize * scale2;
            const minDistance = (size1 + size2) / 2 + window.innerWidth * 0.03;
            
            const distance = Math.sqrt(
              Math.pow(Math.abs(x1 - x2) * window.innerWidth / 100, 2) +
              Math.pow(Math.abs(y1 - y2) * window.innerHeight / 100, 2)
            );
            
            return distance < minDistance;
          };
          
          // Encontrar posición sin colisiones
          let attempts = 0;
          let x, y, hasCollision;
          
          do {
            x = Math.random() * 80 + 5;
            y = Math.random() * 80 + 5;
            
            hasCollision = placedStickers.some(placed => 
              checkCollision(x, y, scale, placed.x, placed.y, placed.scale)
            );
            
            attempts++;
          } while (hasCollision && attempts < 50);
          
          const stickerData = {
            id: dbSticker.id, // ID de la base de datos
            name: file.name,
            url: data.publicUrl,
            x: x,
            y: y,
            rotation: Math.random() * 360,
            scale: scale,
            dbSticker: dbSticker // Información completa de la DB
          };
          
          imageUrls.push(stickerData);
          placedStickers.push({ x, y, scale });
        });

      console.log('🔗 URLs generadas y stickers procesados:', imageUrls.length);
      setStickerImages(imageUrls);
      
      // 8. Seleccionar sticker objetivo aleatorio
      console.log('🎯 Seleccionando sticker objetivo aleatorio...');
      const target = await getRandomTargetSticker();
      setTargetSticker(target);
      console.log('🎯 Sticker objetivo seleccionado:', target?.namesticker);
      
      // 9. Crear registro del juego en la DB
      console.log('🎮 Creando registro del juego en la DB...');
      const game = await createGame(userData.id);
      setCurrentGame(game);
      console.log('🎮 Juego creado con ID:', game?.id);
      
      setError(null);
      console.log('✅ Juego inicializado correctamente');
      
      // Notificar al wrapper que el juego está listo
      console.log('📢 Notificando que el juego está listo...');
      if (onGameReady) {
        onGameReady();
        console.log('📢 Callback onGameReady ejecutado');
      } else {
        console.warn('⚠️ No hay callback onGameReady disponible');
      }
      
    } catch (err) {
      console.error('❌ Error inicializando juego:', err);
      setError('Error al inicializar el juego: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [onGameReady]);

  // Función para iniciar el juego
  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameStartTime(new Date());
    console.log('🎮 Juego iniciado');
  }, []);

  // Función cuando se acaba el tiempo
  const handleTimeUp = useCallback(async () => {
    console.log('⏰ Tiempo agotado');
    
    if (currentGame && gameStartTime) {
      const endTime = new Date();
      const timePlayed = Math.floor((endTime - gameStartTime) / 1000); // en segundos
      const timeFormatted = `00:${Math.floor(timePlayed / 60).toString().padStart(2, '0')}:${(timePlayed % 60).toString().padStart(2, '0')}`;
      
      try {
        await finishGame(
          currentGame.id,
          timeFormatted,
          foundStickers,
          foundStickers.length * 100 // 100 puntos por sticker encontrado
        );
        
        console.log('✅ Juego finalizado y guardado');
        // Aquí podrías navegar a una pantalla de resultados
        
      } catch (error) {
        console.error('❌ Error guardando resultado del juego:', error);
      }
    }
    
    setGameStarted(false);
  }, [currentGame, gameStartTime, foundStickers]);

  // Memoizar las imágenes renderizadas
  const renderedStickers = useMemo(() => {
    return stickerImages.map((sticker, index) => (
      <img
        key={sticker.id || index}
        src={sticker.url}
        alt={sticker.name}
        className="random-sticker"
        style={{
          left: `${sticker.x}%`,
          top: `${sticker.y}%`,
          transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        }}
        onClick={(event) => handleStickerClick(sticker.name, sticker.id, event)}
        loading="lazy"
      />
    ));
  }, [stickerImages, handleStickerClick]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  if (loading) {
    return (
      <div className="play-screen">
        <div className="loading-container">
          <h2>Inicializando juego...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="play-screen">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={initializeGame} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-screen">
      
      {!gameStarted && (
        <div className="start-game-overlay">
          <div className="start-game-container">
            <h2>Let's Play!</h2>
            <p>You have 2 minutes to find the target sticker</p>
            <img src="playbutton.webp" alt="" onClick={startGame} />
          </div>
        </div>
      )}
      
      <div className="stickers-canvas">
        {renderedStickers}
      </div>
    </div>
  );
};

export default PlayScreen;
