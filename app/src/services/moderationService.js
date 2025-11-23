/**
 * Servicio de moderación automática de imágenes usando NSFWJS
 * VERSIÓN CLIENT-SIDE ONLY - Compatible con Vercel
 */
class ModerationService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.isLoading = false;
    this.nsfwjs = null;
  }

  /**
   * Verifica si estamos en un entorno de navegador
   */
  isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  /**
   * Carga NSFWJS dinámicamente solo en el navegador
   */
  async loadNSFWJS() {
    if (!this.isBrowser()) {
      throw new Error('NSFWJS solo funciona en el navegador');
    }

    if (!this.nsfwjs) {
      this.nsfwjs = await import('nsfwjs');
    }
    return this.nsfwjs;
  }

  /**
   * Carga el modelo de moderación
   */
  async loadModel() {
    if (!this.isBrowser()) {
      console.warn('🚫 Moderación no disponible en servidor');
      return;
    }

    if (this.isModelLoaded || this.isLoading) {
      return;
    }

    // console.log('🔄 Cargando modelo de moderación...');
    this.isLoading = true;

    try {
      const nsfwjs = await this.loadNSFWJS();
      this.model = await nsfwjs.load();
      
      this.isModelLoaded = true;
      this.isLoading = false;
      // console.log('✅ Modelo cargado exitosamente');
    } catch (error) {
      this.isLoading = false;
      console.error('❌ Error cargando modelo:', error);
      throw error;
    }
  }

  /**
   * Analiza una imagen
   */
  async analyzeImage(file) {
    // Fallback para servidor: asumir contenido apropiado
    if (!this.isBrowser()) {
      return {
        isAppropriate: true,
        isInappropriate: false,
        dominantCategory: 'Neutral',
        confidence: 0,
        serverSide: true
      };
    }

    try {
      await this.loadModel();
      
      const img = await this.fileToImage(file);
      const predictions = await this.model.classify(img);
      
      return this.analyzePredictions(predictions);
    } catch (error) {
      console.error('❌ Error en moderación:', error);
      // En caso de error, permitir contenido (fail-safe)
      return {
        isAppropriate: true,
        isInappropriate: false,
        dominantCategory: 'Error',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Convierte File a Image
   */
  fileToImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Analiza predicciones
   */
  analyzePredictions(predictions) {
    const inappropriate = ['Porn', 'Sexy', 'Hentai'];
    const threshold = 0.5;
    
    const max = predictions.reduce((a, b) => 
      a.probability > b.probability ? a : b
    );

    const isInappropriate = inappropriate.includes(max.className) && 
                           max.probability > threshold;

    return {
      isAppropriate: !isInappropriate,
      isInappropriate,
      dominantCategory: max.className,
      confidence: (max.probability * 100).toFixed(2),
      details: predictions
    };
  }

  /**
   * Estado del servicio
   */
  isReady() {
    return this.isBrowser() && this.isModelLoaded;
  }
}

export default ModerationService;