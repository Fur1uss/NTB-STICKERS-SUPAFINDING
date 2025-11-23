import supabase from '../config/supabaseClient.js';

/**
 * Servicio de upload usando Supabase directamente
 * Reemplaza la funcionalidad de api/upload
 */
class UploadServiceDirect {
  
  /**
   * Sube un sticker al bucket y guarda la metadata en la base de datos
   * Reemplaza POST /api/upload/sticker
   */
  async uploadSticker(file, userId, name, description, fileName) {
    try {
      // Validar parámetros requeridos
      if (!file || !userId || !name || !description || !fileName) {
        throw new Error('Faltan parámetros requeridos');
      }

      // Convertir file a ArrayBuffer si es necesario
      let fileBuffer;
      if (file instanceof File || file instanceof Blob) {
        fileBuffer = await file.arrayBuffer();
      } else if (typeof file === 'string') {
        // Asumir que viene como base64
        fileBuffer = Buffer.from(file.split(',')[1] || file, 'base64');
      } else if (Buffer.isBuffer(file)) {
        fileBuffer = file;
      } else {
        throw new Error('Formato de archivo no soportado');
      }

      // Generar una ruta única para el archivo
      const filePath = `${fileName}`;

      // Determinar el tipo de contenido basado en la extensión
      let contentType = 'image/png';
      if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (fileName.toLowerCase().endsWith('.webp')) {
        contentType = 'image/webp';
      } else if (fileName.toLowerCase().endsWith('.gif')) {
        contentType = 'image/gif';
      }

      // Subir el archivo al bucket 'stickers' de Supabase
      const { error: uploadError } = await supabase.storage
        .from('stickers')
        .upload(filePath, fileBuffer, {
          contentType: contentType,
          upsert: true // Permitir sobrescribir si existe
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Obtener la URL pública del archivo subido
      const { data: urlData } = supabase.storage.from('stickers').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('No se pudo obtener la URL pública del archivo');
      }

      // Insertar la metadata en la tabla 'stickers' de Supabase
      const { data: insertData, error: insertError } = await supabase
        .from('stickers')
        .insert([
          {
            iduser: userId,
            namesticker: name,
            urlsticker: publicUrl,
            descriptionsticker: description
          }
        ])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      return {
        success: true,
        data: {
          id: insertData.id,
          iduser: insertData.iduser,
          namesticker: insertData.namesticker,
          urlsticker: insertData.urlsticker,
          descriptionsticker: insertData.descriptionsticker
        }
      };

    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al subir el sticker'
      };
    }
  }

  /**
   * Obtiene los stickers de un usuario
   * Reemplaza GET /api/upload/user-stickers/:userId
   */
  async getUserStickers(userId) {
    try {
      const { data: stickers, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('iduser', userId)
        .order('id', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: stickers || []
      };

    } catch (error) {
      throw {
        success: false,
        message: error.message || 'Error al obtener los stickers del usuario'
      };
    }
  }
}

// Exportar una instancia singleton
const uploadServiceDirect = new UploadServiceDirect();
export default uploadServiceDirect;

