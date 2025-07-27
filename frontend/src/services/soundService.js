/**
 * Servicio para reproducir sonidos aleatorios cuando se encuentra un sticker
 * y música de fondo durante la partida
 */
class SoundService {
  constructor() {
    // Lista de sonidos disponibles en /public/sounds/sound_effects/
    this.sounds = [
      'discordSound.mp3',
      'glassSound.mp3',
      'pizzaSound.mp3',
      'pokemonSound.mp3',
      'ringSound.mp3',
      'robloxSound.mp3',
      'uhhSound.mp3',
      'yodaSound.mp3',
      'yoshiSound.mp3'
    ];

    // Elemento de audio para música de fondo
    this.backgroundMusic = null;
    this.isMusicPlaying = false;

    // Elemento de audio para música del menú
    this.menuMusic = null;
    this.isMenuMusicPlaying = false;

    // Estado de interacción del usuario
    this.userHasInteracted = false;
    this.pendingMenuMusic = false;

    // Inicializar listener para primera interacción
    this.initUserInteractionListener();
  }

  /**
   * Inicializa el listener para detectar la primera interacción del usuario
   */
  initUserInteractionListener() {
    const handleFirstInteraction = () => {
      console.log('🎵 Primera interacción del usuario detectada');
      this.userHasInteracted = true;
      
      // Si había música del menú pendiente, iniciarla ahora
      if (this.pendingMenuMusic) {
        this.startMenuMusic();
        this.pendingMenuMusic = false;
      }
      
      // Remover listeners después de la primera interacción
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    // Agregar listeners para detectar primera interacción
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
  }

  /**
   * Reproduce un sonido aleatorio de la lista
   * @returns {Promise<string>} Nombre del sonido reproducido
   */
  async playRandomStickerSound() {
    try {
      // Seleccionar sonido aleatorio
      const randomIndex = Math.floor(Math.random() * this.sounds.length);
      const selectedSound = this.sounds[randomIndex];
      
      console.log(`🔊 Reproduciendo sonido: ${selectedSound}`);
      
      // Crear elemento de audio y reproducir
      const audio = new Audio(`/sounds/sound_effects/${selectedSound}`);
      audio.volume = 0.7; // Volumen al 70%
      
      await audio.play().catch(error => {
        console.warn('⚠️ No se pudo reproducir el sonido (puede requerir interacción del usuario):', error);
      });
      
      return selectedSound;
    } catch (error) {
      console.error('❌ Error reproduciendo sonido:', error);
      // No lanzar error para no interrumpir el flujo del juego
    }
  }

  /**
   * Inicia la música de fondo durante la partida
   * @param {string} musicFileName - Nombre del archivo de música (opcional)
   */
  startBackgroundMusic(musicFileName = 'backgroundMusic.mp3') {
    try {
      if (this.isMusicPlaying) {
        console.log('🎵 La música de fondo ya está reproduciéndose');
        return;
      }

      console.log(`🎵 Iniciando música de fondo: ${musicFileName}`);
      
      this.backgroundMusic = new Audio(`/sounds/music/${musicFileName}`);
      this.backgroundMusic.loop = true; // Reproducir en bucle
      this.backgroundMusic.volume = 0.1; // Volumen bajo (30%)
      
      this.backgroundMusic.play().catch(error => {
        console.error('❌ Error reproduciendo música de fondo:', error);
        this.isMusicPlaying = false;
      });
      
      this.isMusicPlaying = true;

      // Manejar eventos
      this.backgroundMusic.addEventListener('ended', () => {
        this.isMusicPlaying = false;
      });

      this.backgroundMusic.addEventListener('error', (e) => {
        console.error('❌ Error cargando música de fondo:', e);
        this.isMusicPlaying = false;
      });

    } catch (error) {
      console.error('❌ Error iniciando música de fondo:', error);
    }
  }

  /**
   * Detiene la música de fondo
   */
  stopBackgroundMusic() {
    try {
      if (this.backgroundMusic && this.isMusicPlaying) {
        console.log('🔇 Deteniendo música de fondo');
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.isMusicPlaying = false;
      }
    } catch (error) {
      console.error('❌ Error deteniendo música de fondo:', error);
    }
  }

  /**
   * Pausa/reanuda la música de fondo
   */
  toggleBackgroundMusic() {
    try {
      if (this.backgroundMusic) {
        if (this.isMusicPlaying) {
          this.backgroundMusic.pause();
          this.isMusicPlaying = false;
          console.log('⏸️ Música de fondo pausada');
        } else {
          this.backgroundMusic.play();
          this.isMusicPlaying = true;
          console.log('▶️ Música de fondo reanudada');
        }
      }
    } catch (error) {
      console.error('❌ Error alternando música de fondo:', error);
    }
  }

  /**
   * Ajusta el volumen de la música de fondo
   * @param {number} volume - Volumen entre 0 y 1
   */
  setBackgroundMusicVolume(volume) {
    try {
      if (this.backgroundMusic) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.backgroundMusic.volume = clampedVolume;
        console.log(`🎵 Volumen de música ajustado a: ${Math.round(clampedVolume * 100)}%`);
      }
    } catch (error) {
      console.error('❌ Error ajustando volumen de música:', error);
    }
  }

  /**
   * Inicia la música del menú principal
   * @param {string} musicFileName - Nombre del archivo de música del menú
   */
  startMenuMusic(musicFileName = 'menuMusic.mp3') {
    try {
      if (this.isMenuMusicPlaying) {
        console.log('🎵 La música del menú ya está reproduciéndose');
        return;
      }

      // Si el usuario no ha interactuado, marcar como pendiente
      if (!this.userHasInteracted) {
        console.log('🎵 Música del menú marcada como pendiente (esperando interacción del usuario)');
        this.pendingMenuMusic = true;
        return;
      }

      console.log(`🎵 Iniciando música del menú: ${musicFileName}`);
      
      this.menuMusic = new Audio(`/sounds/music/${musicFileName}`);
      this.menuMusic.loop = true; // Reproducir en bucle
      this.menuMusic.volume = 0.4; // Volumen moderado (40%)
      
      this.menuMusic.play().catch(error => {
        console.error('❌ Error reproduciendo música del menú:', error);
        this.isMenuMusicPlaying = false;
      });
      
      this.isMenuMusicPlaying = true;

      // Manejar eventos
      this.menuMusic.addEventListener('ended', () => {
        this.isMenuMusicPlaying = false;
      });

      this.menuMusic.addEventListener('error', (e) => {
        console.error('❌ Error cargando música del menú:', e);
        this.isMenuMusicPlaying = false;
      });

    } catch (error) {
      console.error('❌ Error iniciando música del menú:', error);
    }
  }

  /**
   * Detiene la música del menú
   */
  stopMenuMusic() {
    try {
      if (this.menuMusic && this.isMenuMusicPlaying) {
        console.log('🔇 Deteniendo música del menú');
        this.menuMusic.pause();
        this.menuMusic.currentTime = 0;
        this.isMenuMusicPlaying = false;
      }
    } catch (error) {
      console.error('❌ Error deteniendo música del menú:', error);
    }
  }

  /**
   * Cambia de música del menú a música del juego
   */
  switchToGameMusic() {
    this.stopMenuMusic();
    this.startBackgroundMusic();
  }

  /**
   * Cambia de música del juego a música del menú
   */
  switchToMenuMusic() {
    this.stopBackgroundMusic();
    this.startMenuMusic();
  }
}

// Exportar instancia única
const soundService = new SoundService();
export default soundService;
