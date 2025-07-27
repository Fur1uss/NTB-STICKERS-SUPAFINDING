import React from 'react';
import './GameTimer.css';

const GameTimer = ({ timeRemaining, timeBonus, showTimer = true }) => {
  
  /**
   * Formatea el tiempo en MM:SS
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Determina la clase CSS basada en el tiempo restante
   */
  const getTimerClass = () => {
    if (timeRemaining <= 10) return 'timer-critical';
    if (timeRemaining <= 30) return 'timer-warning';
    return 'timer-normal';
  };

  if (!showTimer) return null;

  return (
    <div className={`game-timer ${getTimerClass()}`}>
      <div className="timer-display">
        <div className="timer-icon">⏱️</div>
        <div className="timer-text">
          <span className="timer-time">{formatTime(timeRemaining)}</span>
          {timeBonus > 0 && (
            <span className="timer-bonus">+{timeBonus}s</span>
          )}
        </div>
      </div>
      
      {/* Barra de progreso del tiempo */}
      <div className="timer-progress-bar">
        <div 
          className="timer-progress-fill"
          style={{ 
            width: `${(timeRemaining / (90 + timeBonus)) * 100}%`
          }}
        />
      </div>
    </div>
  );
};

export default GameTimer;
