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

    // Estado global de mute
    this.globalMuted = false;
    this.previousVolumes = {
      background: 0.3,
      menu: 0.2
    };

    // Inicializar listener para primera interacción
    this.initUserInteractionListener();
  }

  /**
   * Inicializa el listener para detectar la primera interacción del usuario
   * MEJORADO: Con limpieza de música anterior antes de iniciar
   */
  initUserInteractionListener() {
    const handleFirstInteraction = () => {
      console.log('🎵 Primera interacción del usuario detectada');
      this.userHasInteracted = true;
      
      // Si había música del menú pendiente, detener todo primero e iniciarla
      if (this.pendingMenuMusic) {
        console.log('🔄 Iniciando música del menú pendiente...');
        this.stopAllMusic(); // Limpiar todo primero
        setTimeout(() => {
          this.startMenuMusic();
        }, 100); // Pequeño delay para asegurar limpieza
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
   * Detiene TODA la música (tanto del menú como del juego)
   * MEJORADO: Con logging detallado y limpieza completa
   */
  stopAllMusic() {
    console.log('🔇 === DETENIENDO TODA LA MÚSICA ===');
    
    // Detener música del menú
    this.stopMenuMusic();
    
    // Detener música de fondo
    this.stopBackgroundMusic();
    
    // Limpiar estados pendientes
    this.pendingMenuMusic = false;
    
    console.log('✅ Toda la música detenida y estados limpiados');
  }

  /**
   * Inicia la música de fondo durante la partida
   * MEJORADO: Detiene automáticamente la música del menú
   * @param {string} musicFileName - Nombre del archivo de música (opcional)
   */
  startBackgroundMusic(musicFileName = 'backgroundMusic.mp3') {
    try {
      // SIEMPRE detener música anterior primero
      this.stopMenuMusic();
      this.stopBackgroundMusic();

      console.log(`🎵 Iniciando música de fondo: ${musicFileName}`);
      
      this.backgroundMusic = new Audio(`/sounds/music/${musicFileName}`);
      this.backgroundMusic.loop = true; // Reproducir en bucle
      this.applyMuteState(this.backgroundMusic, 'background'); // Aplicar estado de mute
      
      // Si no está silenciado, establecer volumen normal
      if (!this.globalMuted) {
        this.backgroundMusic.volume = 0.3; // Volumen normal (30%)
        this.previousVolumes.background = 0.3;
      }
      
      // Crear referencias a los handlers para poder removerlos después
      this.backgroundMusicEndedHandler = () => {
        console.log('🔄 Música de fondo terminada');
        this.isMusicPlaying = false;
      };
      
      this.backgroundMusicErrorHandler = (e) => {
        console.error('❌ Error cargando música de fondo:', e);
        this.isMusicPlaying = false;
      };
      
      // Agregar event listeners
      this.backgroundMusic.addEventListener('ended', this.backgroundMusicEndedHandler);
      this.backgroundMusic.addEventListener('error', this.backgroundMusicErrorHandler);
      
      this.backgroundMusic.play().catch(error => {
        console.error('❌ Error reproduciendo música de fondo:', error);
        this.isMusicPlaying = false;
      });
      
      this.isMusicPlaying = true;
      console.log('✅ Música de fondo iniciada correctamente');

    } catch (error) {
      console.error('❌ Error iniciando música de fondo:', error);
    }
  }

  /**
   * Detiene la música de fondo
   * MEJORADO: Limpieza más robusta y manejo de errores
   */
  stopBackgroundMusic() {
    try {
      console.log('🔇 Intentando detener música de fondo...');
      
      if (this.backgroundMusic) {
        // Pausar y resetear sin importar el estado
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        
        // Remover event listeners para evitar memory leaks
        this.backgroundMusic.removeEventListener('ended', this.backgroundMusicEndedHandler);
        this.backgroundMusic.removeEventListener('error', this.backgroundMusicErrorHandler);
        
        // Limpiar referencia
        this.backgroundMusic = null;
        console.log('✅ Música de fondo detenida y limpiada');
      }
      
      // Siempre resetear el estado
      this.isMusicPlaying = false;
      
    } catch (error) {
      console.error('❌ Error deteniendo música de fondo:', error);
      // Forzar reset del estado incluso si hay error
      this.isMusicPlaying = false;
      this.backgroundMusic = null;
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
   * MEJORADO: Detiene automáticamente toda la música anterior
   * @param {string} musicFileName - Nombre del archivo de música del menú
   */
  startMenuMusic(musicFileName = 'menuMusic.mp3') {
    try {
      // Si el usuario no ha interactuado, marcar como pendiente
      if (!this.userHasInteracted) {
        console.log('🎵 Música del menú marcada como pendiente (esperando interacción del usuario)');
        this.pendingMenuMusic = true;
        return;
      }

      // SIEMPRE detener música anterior primero
      this.stopBackgroundMusic();
      this.stopMenuMusic();

      console.log(`🎵 Iniciando música del menú: ${musicFileName}`);
      
      this.menuMusic = new Audio(`/sounds/music/${musicFileName}`);
      this.menuMusic.loop = true; // Reproducir en bucle
      this.applyMuteState(this.menuMusic, 'menu'); // Aplicar estado de mute
      
      // Si no está silenciado, establecer volumen normal
      if (!this.globalMuted) {
        this.menuMusic.volume = 0.2; // Volumen normal (20%)
        this.previousVolumes.menu = 0.2;
      }
      
      // Crear referencias a los handlers para poder removerlos después
      this.menuMusicEndedHandler = () => {
        console.log('🔄 Música del menú terminada');
        this.isMenuMusicPlaying = false;
      };
      
      this.menuMusicErrorHandler = (e) => {
        console.error('❌ Error cargando música del menú:', e);
        this.isMenuMusicPlaying = false;
      };
      
      // Agregar event listeners
      this.menuMusic.addEventListener('ended', this.menuMusicEndedHandler);
      this.menuMusic.addEventListener('error', this.menuMusicErrorHandler);
      
      this.menuMusic.play().catch(error => {
        console.error('❌ Error reproduciendo música del menú:', error);
        this.isMenuMusicPlaying = false;
      });
      
      this.isMenuMusicPlaying = true;
      console.log('✅ Música del menú iniciada correctamente');

    } catch (error) {
      console.error('❌ Error iniciando música del menú:', error);
    }
  }

  /**
   * Detiene la música del menú
   * MEJORADO: Limpieza más robusta y manejo de errores
   */
  stopMenuMusic() {
    try {
      console.log('🔇 Intentando detener música del menú...');
      
      if (this.menuMusic) {
        // Pausar y resetear sin importar el estado
        this.menuMusic.pause();
        this.menuMusic.currentTime = 0;
        
        // Remover event listeners para evitar memory leaks
        this.menuMusic.removeEventListener('ended', this.menuMusicEndedHandler);
        this.menuMusic.removeEventListener('error', this.menuMusicErrorHandler);
        
        // Limpiar referencia
        this.menuMusic = null;
        console.log('✅ Música del menú detenida y limpiada');
      }
      
      // Siempre resetear el estado
      this.isMenuMusicPlaying = false;
      this.pendingMenuMusic = false; // También limpiar música pendiente
      
    } catch (error) {
      console.error('❌ Error deteniendo música del menú:', error);
      // Forzar reset del estado incluso si hay error
      this.isMenuMusicPlaying = false;
      this.pendingMenuMusic = false;
      this.menuMusic = null;
    }
  }

  /**
   * Cambia de música del menú a música del juego
   * MEJORADO: Con logging para debug
   */
  switchToGameMusic() {
    console.log('🔄 Cambiando a música del juego');
    this.stopMenuMusic();
    this.startBackgroundMusic();
  }

  /**
   * Cambia de música del juego a música del menú
   * MEJORADO: Con logging para debug
   */
  switchToMenuMusic() {
    console.log('🔄 Cambiando a música del menú');
    this.stopBackgroundMusic();
    this.startMenuMusic();
  }

  /**
   * Verifica el estado actual de la música
   * NUEVO: Para debugging
   */
  getMusicStatus() {
    return {
      menuMusicPlaying: this.isMenuMusicPlaying,
      backgroundMusicPlaying: this.isMusicPlaying,
      userHasInteracted: this.userHasInteracted,
      pendingMenuMusic: this.pendingMenuMusic
    };
  }

  /**
   * Silencia toda la música del juego
   */
  mute() {
    console.log('🔇 Silenciando toda la música');
    this.globalMuted = true;
    
    // Guardar volúmenes actuales antes de silenciar
    if (this.backgroundMusic) {
      this.previousVolumes.background = this.backgroundMusic.volume;
      this.backgroundMusic.volume = 0;
    }
    
    if (this.menuMusic) {
      this.previousVolumes.menu = this.menuMusic.volume;
      this.menuMusic.volume = 0;
    }
  }

  /**
   * Reactiva toda la música del juego
   */
  unmute() {
    console.log('🔊 Reactivando música');
    this.globalMuted = false;
    
    // Restaurar volúmenes previos
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.previousVolumes.background;
    }
    
    if (this.menuMusic) {
      this.menuMusic.volume = this.previousVolumes.menu;
    }
  }

  /**
   * Verifica si la música está silenciada
   */
  isMuted() {
    return this.globalMuted;
  }

  /**
   * Aplica el estado de mute al crear nuevos elementos de audio
   */
  applyMuteState(audioElement, type = 'background') {
    if (this.globalMuted) {
      audioElement.volume = 0;
    } else {
      audioElement.volume = this.previousVolumes[type] || (type === 'background' ? 0.3 : 0.2);
    }
  }
}

// Exportar instancia única
const soundService = new SoundService();
export default soundService;
