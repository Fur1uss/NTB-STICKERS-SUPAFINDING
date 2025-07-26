import React, { useMemo } from "react";
import { useGameLogic } from "../../hooks/useGameLogic";
import GameTimer from "../GameTimer/GameTimer";
import TargetDisplay from "../TargetDisplay/TargetDisplay";
import SuccessFeedback from "../SuccessFeedback/SuccessFeedback";
import "./playScreen.css";

const PlayScreen = ({ onGameReady }) => {
  // Obtener userId desde localStorage (establecido en HomeScreen)
  const backendUser = JSON.parse(localStorage.getItem('backendUser') || '{}');
  const userId = backendUser.id;

  // Usar el hook personalizado para manejar toda la lógica del juego
  const {
    gameState,
    gameId,
    timeRemaining,
    timeBonus,
    stickerImages,
    targetSticker,
    foundStickers,
    loading,
    error,
    showSuccess,
    foundStickerName,
    startGame,
    handleStickerClick,
    resetGame
  } = useGameLogic(userId);

  // Notificar cuando el juego esté listo
  React.useEffect(() => {
    if (gameState === 'ready' && onGameReady) {
      onGameReady();
    }
  }, [gameState, onGameReady]);

  // Memoizar las imágenes renderizadas para optimizar performance
  const renderedStickers = useMemo(() => {
    return stickerImages.map((sticker, index) => (
      <img
        key={sticker.id || index}
        src={sticker.url}
        alt={sticker.name}
        className={`random-sticker ${foundStickers.includes(sticker.id) ? 'found-sticker' : ''}`}
        style={{
          left: `${sticker.x}%`,
          top: `${sticker.y}%`,
          transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        }}
        onClick={(event) => handleStickerClick(sticker, event)}
        loading="lazy"
      />
    ));
  }, [stickerImages, foundStickers, handleStickerClick]);

  // Estados de carga
  if (loading) {
    return (
      <div className="play-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Inicializando juego...</h2>
          <p>Sincronizando stickers y preparando partida...</p>
        </div>
      </div>
    );
  }

  // Estados de error
  if (error) {
    return (
      <div className="play-screen">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={resetGame} className="retry-button">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de inicio del juego
  if (gameState === 'ready') {
    return (
      <div className="play-screen">
        <div className="start-game-overlay">
          <div className="start-game-container">
            <div className="start-game-icon">🎮</div>
            <h2>¡Listo para jugar!</h2>
            <p>Tienes 90 segundos + tiempo bonus para encontrar los stickers</p>
            <p className="game-rules">
              • Encuentra el sticker objetivo<br/>
              • Cada acierto suma +5 segundos<br/>
              • ¡Intenta encontrar todos los que puedas!
            </p>
            <button onClick={startGame} className="start-button">
              <img src="/playbutton.webp" alt="Iniciar juego" />
              <span>Iniciar Juego</span>
            </button>
          </div>
        </div>
        
        {/* Mostrar preview del objetivo */}
        {targetSticker && (
          <div className="preview-target">
            <h3>Tu primer objetivo:</h3>
            <img src={targetSticker.urlsticker} alt={targetSticker.namesticker} />
          </div>
        )}
        
        <div className="stickers-canvas preview-mode">
          {renderedStickers}
        </div>
      </div>
    );
  }

  // Pantalla de juego finalizado
  if (gameState === 'finished') {
    return (
      <div className="play-screen">
        <div className="game-finished-overlay">
          <div className="game-finished-container">
            <div className="finished-icon">🏁</div>
            <h2>¡Juego Terminado!</h2>
            <p>Calculando puntuación...</p>
            <div className="final-stats">
              <div className="stat">
                <span className="stat-label">Stickers encontrados:</span>
                <span className="stat-value">{foundStickers.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Tiempo bonus ganado:</span>
                <span className="stat-value">{timeBonus}s</span>
              </div>
            </div>
            <p className="redirecting-text">Redirigiendo al scoreboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla principal del juego (jugando)
  return (
    <div className="play-screen">
      {/* Componentes de UI del juego */}
      <GameTimer 
        timeRemaining={timeRemaining}
        timeBonus={timeBonus}
        showTimer={gameState === 'playing'}
      />
      
      <TargetDisplay 
        targetSticker={targetSticker}
        foundStickers={foundStickers}
        showTarget={gameState === 'playing'}
      />
      
      <SuccessFeedback 
        show={showSuccess}
        stickerName={foundStickerName}
      />
      
      {/* Canvas principal con stickers */}
      <div className="stickers-canvas">
        {renderedStickers}
      </div>
      
      {/* Indicador de progreso */}
      {gameState === 'playing' && (
        <div className="game-progress">
          <div className="progress-info">
            <span>Partida ID: {gameId}</span>
            <span>Encontrados: {foundStickers.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayScreen;
