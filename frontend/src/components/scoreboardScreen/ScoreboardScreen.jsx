import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import GameAPIService from '../../services/gameService';
import UploadStickerSimple from '../UploadSticker/UploadStickerSimple';
import UnfoldingBoard from '../UnfoldingBoard/UnfoldingBoard';
import "./scoreboardScreen.css";

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
    loadScoreboardData();
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
    
    // Esperar a que termine la animación antes de desmontar completamente
    setTimeout(() => {
      setShowUnfolding(false);
    }, 800); // Mismo tiempo que la animación del UnfoldingBoard
  };

  /**
   * Manejar subida exitosa de sticker
   */
  const handleUploadSuccess = (result) => {
    console.log('✅ Sticker subido exitosamente:', result);
    
    // Cerrar con animación
    setUnfoldingOpen(false);
    setTimeout(() => {
      setShowUnfolding(false);
    }, 800);
    
    // Aquí podrías mostrar una notificación de éxito
    alert('¡Sticker subido exitosamente!');
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="scoreboard-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Cargando resultados...</h2>
          <p>Obteniendo datos de tu partida</p>
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
            <button onClick={handleGoHome} className="home-button">
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
        <div className="titleContainer">
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
              <p>Tu posición global: #{userPosition}</p>
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
              <span className="stat-label">Tu Puntuación</span>
              <span className="stat-value">{gameData?.game?.score || 0} pts</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Tiempo de Juego</span>
              <span className="stat-value">{formatGameTime(gameData?.game?.timePlayed)}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Stickers Encontrados</span>
              <span className="stat-value">{gameData?.statistics?.stickersFound || 0}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Jugador</span>
              <span className="stat-value">{gameData?.game?.user?.username}</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="buttonsContainer">
          <button onClick={handleHomeMenuu} className="action-button play-again">
            <img src="/tryAgainButton.webp" alt="Jugar de Nuevo" />
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
          <UploadStickerSimple
            userId={JSON.parse(localStorage.getItem('backendUser') || '{}').id}
            onUploadSuccess={handleUploadSuccess}
            onClose={handleUnfoldingClose}
          />
        </UnfoldingBoard>
      )}
    </div>
  );
};

export default ScoreboardScreen;
