import supabase from "../config/supabaseClient.js";

/**
 * Sube un sticker al bucket de Supabase y guarda la metadata en la tabla 'stickers'.
 * @param {Buffer} fileBuffer - Buffer del archivo del sticker a subir
 * @param {number} userId - ID del usuario que sube el sticker
 * @param {string} name - Nombre del sticker
 * @param {string} description - Descripción del sticker
 * @param {string} fileName - Nombre original del archivo
 * @returns {Promise<Object>} Información del sticker creado o error
 */
export async function uploadSticker(fileBuffer, userId, name, description, fileName) {
  // Validar parámetros requeridos
  if (!fileBuffer || !userId || !name || !description || !fileName) {
    return { error: 'Faltan parámetros requeridos' };
  }

  // Generar una ruta única para el archivo usando el userId y timestamp
  const filePath = `${fileName}`;

  // Determinar el tipo de contenido basado en la extensión del archivo
  let contentType = 'image/png'; // valor por defecto
  if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
    contentType = 'image/jpeg';
  } else if (fileName.toLowerCase().endsWith('.webp')) {
    contentType = 'image/webp';
  } else if (fileName.toLowerCase().endsWith('.gif')) {
    contentType = 'image/gif';
  }

  // Subir el archivo al bucket 'stickers' de Supabase con el content-type correcto
  const { error: uploadError } = await supabase.storage
    .from('stickers')
    .upload(filePath, fileBuffer, {
      contentType: contentType
    });


  // Si ocurre un error al subir, devolver el error
  if (uploadError) {
    return { error: uploadError.message };
  }

  // Obtener la URL pública del archivo subido
  const { data: urlData } = supabase.storage.from('stickers').getPublicUrl(filePath);
  const publicUrl = urlData?.publicUrl;

  if (!publicUrl) {
    return { error: 'No se pudo obtener la URL pública del archivo' };
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

  // Si ocurre un error al insertar en la base de datos, devolver el error
  if (insertError) {
    return { error: insertError.message };
  }

  // Devolver la información del sticker creado
  return {
    id: insertData.id,
    iduser: insertData.iduser,
    namesticker: insertData.namesticker,
    urlsticker: insertData.urlsticker,
    descriptionsticker: insertData.descriptionsticker
  };
}
  