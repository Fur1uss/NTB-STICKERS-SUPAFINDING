import React, { useState, useEffect } from 'react';
import soundService from '../../services/soundService';
import './SoundControl.css';

const SoundControl = () => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Verificar el estado inicial del audio
    setIsMuted(soundService.isMuted());
  }, []);

  const toggleMute = () => {
    if (isMuted) {
      soundService.unmute();
      setIsMuted(false);
      console.log('🔊 Audio activado');
    } else {
      soundService.mute();
      setIsMuted(true);
      console.log('🔇 Audio silenciado');
    }
  };

  return (
    <button 
      className={`sound-control-button ${isMuted ? 'muted' : 'unmuted'}`}
      onClick={toggleMute}
      title={isMuted ? 'Activate sound' : 'Mute sound'}
      aria-label={isMuted ? 'Activate sound' : 'Mute sound'}
    >
      <div className="sound-icon">
        {isMuted ? (
          // Icono de sonido mutado
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.5 12C16.5 10.23 15.5 8.71 14 7.97V9.18L16.45 11.63C16.48 11.86 16.5 12.12 16.5 12Z" fill="currentColor"/>
            <path d="M19 12C19 12.94 18.8 13.82 18.46 14.64L19.97 16.15C20.63 14.91 21 13.5 21 12C21 7.72 18 4.14 14 3.23V5.29C16.89 6.15 19 8.83 19 12Z" fill="currentColor"/>
            <path d="M4.27 3L3 4.27L7.73 9H3V15H7L12 20V13.27L16.25 17.52C15.58 18.04 14.83 18.46 14 18.7V20.77C15.38 20.45 16.63 19.82 17.68 18.96L19.73 21L21 19.73L12 10.73L4.27 3ZM12 4L9.91 6.09L12 8.18V4Z" fill="currentColor"/>
          </svg>
        ) : (
          // Icono de sonido activo
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9V15H7L12 20V4L7 9H3Z" fill="currentColor"/>
            <path d="M16.5 12C16.5 10.23 15.5 8.71 14 7.97V16.02C15.5 15.29 16.5 13.77 16.5 12Z" fill="currentColor"/>
            <path d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18 19.86 21 16.28 21 12C21 7.72 18 4.14 14 3.23Z" fill="currentColor"/>
          </svg>
        )}
      </div>
      <span className="sound-text">
        {isMuted ? 'Sound Off' : 'Sound On'}
      </span>
    </button>
  );
};

export default SoundControl;
