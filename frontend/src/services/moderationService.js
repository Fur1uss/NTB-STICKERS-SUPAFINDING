import * as nsfwjs from 'nsfwjs';

/**
 * Servicio de moderación automática de imágenes usando NSFWJS
 * Detecta contenido inapropiado antes de subir las imágenes
 */
class ModerationService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.isLoading = false;
  }

  /**
   * Carga el modelo de NSFWJS con múltiples fallbacks
   * @returns {Promise<void>}
   */
  async loadModel() {
    if (this.isModelLoaded || this.isLoading) {
      return;
    }

    console.log('🔄 Cargando modelo de moderación NSFWJS...');
    this.isLoading = true;

    // Lista de URLs de CDN para intentar
    const cdnUrls = [
      'https://unpkg.com/nsfwjs@4.2.1/dist/model.json',
      'https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/model.json',
      'https://d1zv2aa70wpiur.cloudfront.net/tfjs_models/nsfwjs/1.3.0/model.json'
    ];

    let lastError = null;

    // Intentar cargar desde cada CDN
    for (const url of cdnUrls) {
      try {
        console.log(`🔄 Intentando cargar modelo desde: ${url}`);
        this.model = await nsfwjs.load(url, { type: 'graph' });
        
        this.isModelLoaded = true;
        this.isLoading = false;
        console.log('✅ Modelo de moderación cargado exitosamente');
        return;
      } catch (error) {
        console.warn(`⚠️ Error cargando desde ${url}:`, error.message);
        lastError = error;
        continue;
      }
    }

    // Si todos los CDN fallan, intentar cargar localmente
    try {
      console.log('🔄 Intentando cargar modelo localmente...');
      this.model = await nsfwjs.load();
      
      this.isModelLoaded = true;
      this.isLoading = false;
      console.log('✅ Modelo de moderación cargado localmente');
      return;
    } catch (localError) {
      console.error('❌ Error cargando modelo localmente:', localError);
      lastError = localError;
    }

    // Si todo falla
    this.isLoading = false;
    console.error('❌ Error cargando modelo de moderación desde todas las fuentes:', lastError);
    throw new Error('No se pudo cargar el modelo de moderación desde ninguna fuente disponible');
  }

  /**
   * Analiza una imagen para detectar contenido inapropiado
   * @param {File|HTMLImageElement} image - Imagen a analizar
   * @returns {Promise<Object>} Resultado del análisis
   */
  async analyzeImage(image) {
    try {
      // Asegurar que el modelo esté cargado
      if (!this.isModelLoaded) {
        await this.loadModel();
      }

      console.log('🔍 Analizando imagen para moderación...');

      // Convertir la imagen a un elemento HTML si es un File
      let imgElement;
      if (image instanceof File) {
        imgElement = await this.fileToImageElement(image);
      } else if (image instanceof HTMLImageElement) {
        imgElement = image;
      } else {
        throw new Error('Tipo de imagen no soportado');
      }

      // Realizar predicción
      const predictions = await this.model.classify(imgElement);
      
      console.log('📊 Resultados de moderación:', predictions);

      // Analizar resultados
      const result = this.analyzePredictions(predictions);
      
      return result;

    } catch (error) {
      console.error('❌ Error analizando imagen:', error);
      throw new Error('Error al analizar la imagen para moderación');
    }
  }

  /**
   * Convierte un archivo File a un elemento HTMLImageElement
   * @param {File} file - Archivo de imagen
   * @returns {Promise<HTMLImageElement>}
   */
  fileToImageElement(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Analiza las predicciones del modelo y determina si la imagen es apropiada
   * @param {Array} predictions - Predicciones del modelo NSFWJS
   * @returns {Object} Resultado del análisis
   */
  analyzePredictions(predictions) {
    // Categorías que consideramos inapropiadas
    const inappropriateCategories = ['Porn', 'Sexy', 'Hentai'];
    
    // Umbral de confianza para considerar contenido inapropiado (70%)
    const threshold = 0.7;
    
    // Encontrar la categoría con mayor confianza
    const maxPrediction = predictions.reduce((max, pred) => 
      pred.probability > max.probability ? pred : max
    );

    console.log('🎯 Categoría dominante:', maxPrediction.className, 'Confianza:', (maxPrediction.probability * 100).toFixed(2) + '%');

    // Verificar si es contenido inapropiado
    const isInappropriate = inappropriateCategories.includes(maxPrediction.className) && 
                           maxPrediction.probability > threshold;

    // Calcular porcentajes para cada categoría
    const percentages = {};
    predictions.forEach(pred => {
      percentages[pred.className] = (pred.probability * 100).toFixed(2);
    });

    return {
      isAppropriate: !isInappropriate,
      isInappropriate,
      dominantCategory: maxPrediction.className,
      confidence: (maxPrediction.probability * 100).toFixed(2),
      percentages,
      details: predictions,
      threshold: threshold * 100
    };
  }

  /**
   * Verifica si el servicio está listo para usar
   * @returns {boolean}
   */
  isReady() {
    return this.isModelLoaded && !this.isLoading;
  }

  /**
   * Obtiene el estado de carga del modelo
   * @returns {Object}
   */
  getLoadingState() {
    return {
      isLoaded: this.isModelLoaded,
      isLoading: this.isLoading
    };
  }
}

// Exportar una instancia singleton
const moderationService = new ModerationService();
export default moderationService; 