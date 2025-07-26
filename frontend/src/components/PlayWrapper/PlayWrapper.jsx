import React, { useState, useEffect } from 'react';
import UnfoldingBoard from '../UnfoldingBoard/UnfoldingBoard';
import BoardComponent from '../BoardComponent/BoardComponent';
import PlayScreen from '../PlayScreen/PlayScreen';
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';
import ShuffleButton from '../ShuffleButton/ShuffleButton';
const PlayWrapper = () => {
  const [showBoard, setShowBoard] = useState(false);

  useEffect(() => {
    // Activar el UnfoldingBoard después de un pequeño delay para ver la animación
    const timer = setTimeout(() => {
      setShowBoard(true);
    }, 0); // 0ms de delay

    return () => clearTimeout(timer);
  }, []);

  // Función para cerrar el UnfoldingBoard cuando el juego esté listo
  const handleGameReady = () => {
    // Agregar un pequeño delay para que se aprecie la animación mínimo 3 segundos
    setTimeout(() => {
      setShowBoard(false);
    }, 0);
  };

  return (
    <>
      <UnfoldingBoard open={showBoard}>
        <LoadingAnimation />
      </UnfoldingBoard>
        <ShuffleButton />
      <BoardComponent>
        <PlayScreen onGameReady={handleGameReady} />
      </BoardComponent>
    </>
  );
};

export default PlayWrapper;
