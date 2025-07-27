import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import GameAPIService from '../../services/gameService';
import soundService from '../../services/soundService';
import uploadService from '../../services/uploadService';
import UploadStickerSimple from '../UploadSticker/UploadStickerSimple';
import ModerationCheck from '../ModerationCheck/ModerationCheck';
import UnfoldingBoard from '../UnfoldingBoard/UnfoldingBoard';
import "./ScoreboardScreen.css";

const ScoreboardScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Estados para los datos del scoreboard
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalRanking, setGlobalRanking] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [showUnfolding, setShowUnfolding] = useState(false);
  const [unfoldingOpen, setUnfoldingOpen] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [uploadData, setUploadData] = useState(null);
  const [showInappropriateMessage, setShowInappropriateMessage] = useState(false);

  // Obtener gameId de la URL o localStorage
  const gameId = searchParams.get('gameId') || 
    JSON.parse(localStorage.getItem('lastGameResult') || '{}').gameId;

  /**
   * Cargar datos del scoreboard
   */
  const loadScoreboardData = async () => {
    if (!gameId) {
      setError('No se encontró ID de partida');
      setLoading(false);
      return;
    }

    console.log('\n🏆 CARGANDO DATOS DEL SCOREBOARD');
    console.log('🎮 Game ID:', gameId);

    try {
      setLoading(true);
      setError(null);

      // Cargar datos de la partida específica
      const scoreboardData = await GameAPIService.getScoreboardData(gameId);
      setGameData(scoreboardData);

      // Cargar ranking global
      const backendUser = JSON.parse(localStorage.getItem('backendUser') || '{}');
      const ranking = await GameAPIService.getGlobalRanking({
        limit: 10,
        page: 1,
        userId: backendUser.id
      });
      
      setGlobalRanking(ranking.ranking);
      setUserPosition(ranking.userStats?.globalPosition);

      console.log('✅ Datos del scoreboard cargados exitosamente');

    } catch (error) {
      console.error('❌ Error cargando scoreboard:', error);
      
      // Si la partida no se encuentra, usar datos de localStorage como fallback
      if (error.message.includes('Partida no encontrada')) {
        console.log('🔄 Partida no encontrada, usando datos de localStorage...');
        const lastGameData = localStorage.getItem('lastGameResult');
        
        if (lastGameData) {
          try {
            const gameData = JSON.parse(lastGameData);
            setGameData({
              game: {
                id: gameData.gameId,
                score: gameData.finalScore || 0,
                timePlayed: '00:01:30', // Tiempo por defecto
                user: {
                  username: 'Jugador',
                  id: 1
                }
              },
              statistics: {
                stickersFound: gameData.stickersFound || 0,
                stickersDetails: []
              }
            });
            
            console.log('✅ Datos cargados desde localStorage');
            return;
          } catch (parseError) {
            console.error('❌ Error parseando datos de localStorage:', parseError);
          }
        }
      }
      
      setError(`Error cargando datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🏆 ScoreboardScreen montado - Configurando audio y cargando datos');
    
    // Detener cualquier música que esté reproduciéndose
    soundService.stopAllMusic();
    
    // Pequeño delay antes de iniciar música del menú para asegurar limpieza
    const musicTimeout = setTimeout(() => {
      console.log('🎵 Iniciando música del menú en ScoreboardScreen');
      soundService.startMenuMusic();
    }, 200);
    
    loadScoreboardData();
    
    // Cleanup: Detener música al desmontar
    return () => {
      console.log('🏆 ScoreboardScreen desmontado - Deteniendo música');
      clearTimeout(musicTimeout);
      soundService.stopAllMusic();
    };
  }, [gameId]);

  /**
   * Formatear tiempo de juego
   */
  const formatGameTime = (timeString) => {
    if (!timeString) return '00:00:00';
    return timeString;
  };

  /**
   * Navegar a nueva partida
   */
  const handleHomeMenuu = () => {
    console.log('🏠 Navegando al home desde scoreboard');
    // No necesitamos iniciar música aquí porque HomeScreen lo hará automáticamente
    // al montarse y detener cualquier música anterior
    navigate('/');
  };

  /**
   * Manejar click en botón de upload
   */
  const handleUploadClick = () => {
    setShowUnfolding(true);
    setUnfoldingOpen(true);
  };

  /**
   * Manejar cierre del UnfoldingBoard
   */
  const handleUnfoldingClose = () => {
    // Cerrar la animación pero mantener el componente montado temporalmente
    setUnfoldingOpen(false);
    
    // Resetear estados de moderación
    setShowModeration(false);
    setUploadData(null);
    setShowInappropriateMessage(false);
    
    // Esperar a que termine la animación antes de desmontar completamente
    setTimeout(() => {
      setShowUnfolding(false);
    }, 800); // Mismo tiempo que la animación del UnfoldingBoard
  };

  /**
   * Manejar inicio de upload con moderación
   */
  const handleUploadStart = (uploadData) => {
    console.log('🔄 Iniciando upload con moderación:', uploadData);
    setUploadData(uploadData);
    setShowModeration(true);
  };

  /**
   * Manejar resultado de moderación
   */
  const handleModerationComplete = async (result) => {
    console.log('📞 Resultado de moderación:', result);
    
    if (result.error) {
      // Error en moderación, continuar sin verificación
      console.warn('⚠️ Error en moderación, continuando sin verificación:', result.error);
      await proceedWithUpload();
      return;
    }

    if (result.isAppropriate) {
      // Imagen apropiada, proceder con el upload
      console.log('✅ Imagen apropiada, procediendo con upload');
      await proceedWithUpload();
    } else {
      // Imagen inapropiada, mostrar mensaje no invasivo
      console.log('🚫 Imagen inapropiada detectada:', result.dominantCategory);
      setShowInappropriateMessage(true);
      setShowModeration(false);
      
      // Ocultar mensaje después de 5 segundos
      setTimeout(() => {
        setShowInappropriateMessage(false);
      }, 5000);
    }
  };

  /**
   * Manejar éxito del upload
   */
  const handleUploadSuccess = () => {
    console.log('✅ Upload exitoso, redirigiendo al home');
    navigate('/');
  };

  /**
   * Proceder con el upload después de moderación
   */
  const proceedWithUpload = async () => {
    if (!uploadData) {
      console.error('❌ No hay datos de upload disponibles');
      return;
    }

    try {
      const { file, name, description, userId } = uploadData;
      const result = await uploadService.uploadSticker(file, name, description, userId);
      console.log('✅ Upload exitoso:', result);
      
      // Cerrar moderación y mostrar éxito
      setShowModeration(false);
      setUploadData(null);
      
             // Cerrar con animación
       setUnfoldingOpen(false);
       setTimeout(() => {
         setShowUnfolding(false);
       }, 800);
    } catch (error) {
      console.error('❌ Error en upload:', error);
      setShowModeration(false);
      setUploadData(null);
      alert('Error subiendo sticker: ' + error.message);
    }
  };



  // Estados de carga
  if (loading) {
    return (
      <div className="scoreboard-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading results...</h2>
          <p>Fetching your game data...</p>
        </div>
      </div>
    );
  }

  // Estados de error
  if (error) {
    return (
      <div className="scoreboard-screen">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Error</h2>
          <p>{error}</p>
          <div className="error-buttons">
            <button onClick={loadScoreboardData} className="retry-button">
              Reintentar
            </button>
            <button onClick={handleHomeMenuu} className="home-button">
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scoreboard-screen">
      {/* Título del Scoreboard */}
      <div className="scoreboardContainer">
        <div className="scoreTitleContainer">
          <img src="/scoreboardImage.webp" alt="Scoreboard" />
        </div>
        
        {/* Ranking Global */}
        <div className="scoreboardElementContainer">
          <h3 className="ranking-title">🏆 Top 10 Global</h3>
          <div className="ranking-list">
            {globalRanking.map((entry, index) => (
              <div 
                key={entry.game.id} 
                className={`ranking-item ${entry.isCurrentUser ? 'current-user' : ''}`}
              >
                <span className="position">#{entry.position}</span>
                <span className="username">{entry.user.username}</span>
                <span className="score">{entry.game.score} pts</span>
              </div>
            ))}
          </div>
          
          {userPosition && userPosition > 10 && (
            <div className="user-position-info">
              <p>Your global position: #{userPosition}</p>
            </div>
          )}
        </div>
      </div>

      {/* Información del Usuario */}
      <div className="informationContainer">
        {/* Información del Juego */}
        <div className="infoUserGameContainer">
          <div className="game-stats">
            <div className="stat-item highlight">
              <span className="stat-label">Your Score</span>
              <span className="stat-value">{gameData?.game?.score || 0} pts</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Game Time</span>
              <span className="stat-value">{formatGameTime(gameData?.game?.timePlayed)}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Collected Stickers</span>
              <span className="stat-value">{gameData?.statistics?.stickersFound || 0}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Player</span>
              <span className="stat-value">{gameData?.game?.user?.username}</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="buttonsContainer">
          <button onClick={handleHomeMenuu} className="action-button play-again">
            <img src="/menuButton.webp" alt="Jugar de Nuevo" />
          </button>
            
          <button onClick={handleUploadClick} className="action-button go-home">
            <img src="/uploadButton.webp" alt="Subir Sticker" />
          </button>
        </div>
      </div>

      {/* Animación de despliegue para upload */}
      {showUnfolding && (
        <UnfoldingBoard 
          open={unfoldingOpen}
          onClose={handleUnfoldingClose}
          showCloseButton={false}
        >
                     {showModeration ? (
             <ModerationCheck
               file={uploadData?.file}
               onModerationComplete={handleModerationComplete}
               onUploadSuccess={handleUploadSuccess}
               onClose={() => {
                 setShowModeration(false);
                 setUploadData(null);
               }}
             />
           ) : (
            <UploadStickerSimple
              userId={JSON.parse(localStorage.getItem('backendUser') || '{}').id}
              onUploadStart={handleUploadStart}
              onClose={handleUnfoldingClose}
            />
          )}
                 </UnfoldingBoard>
       )}

       {/* Mensaje no invasivo para contenido inapropiado */}
       {showInappropriateMessage && (
         <div className="inappropriate-message">
           <div className="inappropriate-message-content">
             <div className="inappropriate-icon">⚠️</div>
             <h3>Inappropriate Content</h3>
             <p>
               Your image contains inappropriate content.
             </p>
             <p className="inappropriate-suggestion">
               Please try with a different image.
             </p>
           </div>
         </div>
       )}


     </div>
   );
 };

export default ScoreboardScreen;
