import supabase from '../config/supabaseClient.js';

/**
 * Servicio para manejar la lógica de stickers
 * Incluye sincronización del bucket con la base de datos
 */
export class StickerService {

  /**
   * Sincroniza stickers del bucket de Supabase con la tabla stickers
   * @param {number} userId - ID del usuario en sesión
   * @returns {Object} Resultado de la sincronización
   */
  static async syncStickersFromBucket(userId) {
    console.log('\n🔄 INICIANDO SINCRONIZACIÓN DE STICKERS');
    console.log('='.repeat(60));
    console.log('👤 Usuario ID:', userId);
    console.log('📦 Bucket: stickers');

    try {
      // 1. Obtener todos los archivos del bucket
      console.log('\n📂 PASO 1: Obteniendo archivos del bucket...');
      const { data: files, error: listError } = await supabase.storage
        .from('stickers')
        .list('', {
          limit: 1000,
          offset: 0
        });

      if (listError) {
        console.error('❌ Error al listar archivos del bucket:', listError);
        throw listError;
      }

      console.log('✅ Archivos encontrados en bucket:', files.length);

      // 2. Filtrar solo archivos de imagen
      console.log('\n🖼️  PASO 2: Filtrando archivos de imagen...');
      const imageFiles = files.filter(file => 
        file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      );

      console.log('🎯 Archivos de imagen válidos:', imageFiles.length);
      imageFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'N/A'} bytes)`);
      });

      // 3. Verificar stickers existentes en la base de datos
      console.log('\n🔍 PASO 3: Verificando stickers existentes en DB...');
      const { data: existingStickers, error: fetchError } = await supabase
        .from('stickers')
        .select('namesticker, urlsticker');

      if (fetchError) {
        console.error('❌ Error al obtener stickers existentes:', fetchError);
        throw fetchError;
      }

      console.log('📊 Stickers ya existentes en DB:', existingStickers.length);

      // Crear Set de URLs existentes para comparación rápida
      const existingUrls = new Set(existingStickers.map(s => s.urlsticker));

      // 4. Identificar stickers nuevos
      console.log('\n🆕 PASO 4: Identificando stickers nuevos...');
      const newStickers = [];

      for (const file of imageFiles) {
        // Generar URL pública
        const { data: urlData } = supabase.storage
          .from('stickers')
          .getPublicUrl(file.name);

        const publicUrl = urlData.publicUrl;

        // Verificar si ya existe en la DB
        if (!existingUrls.has(publicUrl)) {
          // Generar información del sticker
          const displayName = this.generateDisplayName(file.name);
          const description = `Encuentra el sticker de ${displayName.toLowerCase()}`;

          const stickerData = {
            iduser: userId,
            namesticker: file.name,
            urlsticker: publicUrl,
            descriptionsticker: description
          };

          newStickers.push(stickerData);
          console.log(`   🆕 Nuevo: ${file.name} → ${displayName}`);
        } else {
          console.log(`   ✅ Existe: ${file.name}`);
        }
      }

      console.log('\n📈 RESUMEN DE SINCRONIZACIÓN:');
      console.log('   📦 Total archivos en bucket:', files.length);
      console.log('   🖼️  Archivos de imagen:', imageFiles.length);
      console.log('   📊 Ya existentes en DB:', existingStickers.length);
      console.log('   🆕 Nuevos a insertar:', newStickers.length);

      // 5. Insertar nuevos stickers en la base de datos
      let insertedStickers = [];
      if (newStickers.length > 0) {
        console.log('\n💾 PASO 5: Insertando nuevos stickers en DB...');
        
        const { data: inserted, error: insertError } = await supabase
          .from('stickers')
          .insert(newStickers)
          .select();

        if (insertError) {
          console.error('❌ Error al insertar stickers:', insertError);
          throw insertError;
        }

        insertedStickers = inserted;
        console.log('✅ Stickers insertados exitosamente:', insertedStickers.length);
        
        insertedStickers.forEach((sticker, index) => {
          console.log(`   ${index + 1}. ID: ${sticker.id} - ${sticker.namesticker}`);
        });
      } else {
        console.log('\n✅ PASO 5: No hay stickers nuevos para insertar');
      }

      const result = {
        success: true,
        totalFilesInBucket: files.length,
        imageFiles: imageFiles.length,
        existingInDb: existingStickers.length,
        newStickersAdded: newStickers.length,
        insertedStickers: insertedStickers
      };

      console.log('\n🎉 SINCRONIZACIÓN COMPLETADA EXITOSAMENTE');
      console.log('='.repeat(60));
      
      return result;

    } catch (error) {
      console.error('\n❌ ERROR EN SINCRONIZACIÓN DE STICKERS:');
      console.error('   💥 Mensaje:', error.message);
      console.error('   🔍 Stack:', error.stack);
      console.log('='.repeat(60));
      
      throw {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Obtiene todos los stickers de la base de datos
   * @returns {Array} Lista de stickers
   */
  static async getAllStickers() {
    console.log('\n📋 OBTENIENDO TODOS LOS STICKERS DE LA DB');
    
    try {
      const { data: stickers, error } = await supabase
        .from('stickers')
        .select('*')
        .order('id');

      if (error) {
        console.error('❌ Error al obtener stickers:', error);
        throw error;
      }

      console.log('✅ Stickers obtenidos:', stickers.length);
      return stickers;

    } catch (error) {
      console.error('❌ Error en getAllStickers:', error);
      throw error;
    }
  }

  /**
   * Obtiene un sticker aleatorio para el juego
   * @param {Array} availableStickers - Lista de stickers disponibles (opcional)
   * @returns {Object} Sticker objetivo
   */
  static async getRandomTargetSticker(availableStickers = null) {
    console.log('\n🎯 OBTENIENDO STICKER OBJETIVO ALEATORIO');
    
    try {
      // Usar stickers proporcionados o obtener todos
      const stickers = availableStickers || await this.getAllStickers();
      
      if (stickers.length === 0) {
        throw new Error('No hay stickers disponibles');
      }

      // Crear mapa para evitar duplicados por nombre
      const uniqueStickers = new Map();
      stickers.forEach(sticker => {
        if (!uniqueStickers.has(sticker.namesticker)) {
          uniqueStickers.set(sticker.namesticker, sticker);
        }
      });

      const uniqueStickerArray = Array.from(uniqueStickers.values());
      const randomIndex = Math.floor(Math.random() * uniqueStickerArray.length);
      const targetSticker = uniqueStickerArray[randomIndex];

      console.log('🎲 Sticker seleccionado:');
      console.log('   🆔 ID:', targetSticker.id);
      console.log('   📛 Nombre:', targetSticker.namesticker);
      console.log('   📝 Descripción:', targetSticker.descriptionsticker);
      console.log('   📊 Total únicos disponibles:', uniqueStickerArray.length);

      return targetSticker;

    } catch (error) {
      console.error('❌ Error al obtener sticker aleatorio:', error);
      throw error;
    }
  }

  /**
   * Verifica si un sticker existe en la base de datos por su URL
   * @param {string} stickerUrl - URL del sticker
   * @returns {Object|null} Sticker encontrado o null
   */
  static async getStickerByUrl(stickerUrl) {
    console.log('\n🔍 VERIFICANDO STICKER POR URL');
    console.log('🔗 URL:', stickerUrl);

    try {
      const { data: sticker, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('urlsticker', stickerUrl)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error al buscar sticker:', error);
        throw error;
      }

      if (sticker) {
        console.log('✅ Sticker encontrado:', sticker.namesticker);
        return sticker;
      } else {
        console.log('❌ Sticker no encontrado en DB');
        return null;
      }

    } catch (error) {
      console.error('❌ Error en getStickerByUrl:', error);
      throw error;
    }
  }

  /**
   * Genera un nombre display amigable desde el nombre del archivo
   * @param {string} fileName - Nombre del archivo
   * @returns {string} Nombre display
   */
  static generateDisplayName(fileName) {
    return fileName
      .replace(/\.[^/.]+$/, '') // Remover extensión
      .replace(/[-_]/g, ' ') // Reemplazar guiones y underscores
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalizar palabras
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Valida que un sticker tenga los datos requeridos
   * @param {Object} stickerData - Datos del sticker
   * @returns {boolean} True si es válido
   */
  static validateStickerData(stickerData) {
    const required = ['iduser', 'namesticker', 'urlsticker'];
    const isValid = required.every(field => stickerData[field] != null);
    
    if (!isValid) {
      console.log('❌ Datos de sticker inválidos:', stickerData);
    }
    
    return isValid;
  }
}

export default StickerService;
