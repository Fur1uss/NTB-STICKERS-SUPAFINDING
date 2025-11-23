import { verifyToken } from '../../lib/middleware/auth.js';
import { uploadSticker } from '../../lib/controllers/uploadController.js';

/**
 * Sube un sticker al bucket y guarda la metadata en la base de datos
 * POST /api/upload/sticker
 */
export const config = {
  api: {
    bodyParser: false, // Deshabilitar bodyParser para manejar multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticación
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      });
    }


    // Parsear FormData manualmente
    // Nota: En producción, considera usar una librería como formidable o busboy
    // Para Vercel, podemos usar el body directamente si viene como base64
    // o usar una librería de parsing
    
    // Intentar obtener datos del body
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      // Si no es multipart, intentar obtener del body directamente
      const { file, name, description, userId } = req.body;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo'
        });
      }

      // Validar que el userId coincida con el usuario autenticado
      if (parseInt(userId) !== parseInt(user.id)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para subir stickers para otro usuario'
        });
      }

      // Convertir base64 a buffer si es necesario
      let fileBuffer;
      if (typeof file === 'string') {
        // Asumir que viene como base64
        fileBuffer = Buffer.from(file.split(',')[1] || file, 'base64');
      } else if (Buffer.isBuffer(file)) {
        fileBuffer = file;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Formato de archivo no soportado'
        });
      }

      // Validar campos requeridos
      if (!name || !description || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: name, description, userId'
        });
      }

      // Llamar a la función de upload del controlador
      const result = await uploadSticker(
        fileBuffer,
        parseInt(userId),
        name,
        description,
        req.body.fileName || 'sticker.png'
      );

      if (result.error) {
        return res.status(500).json({
          success: false,
          message: result.error
        });
      }


      return res.status(201).json({
        success: true,
        message: 'Sticker subido exitosamente',
        data: result
      });
    }

    // Si es multipart/form-data, necesitamos parsearlo
    // Para Vercel, podemos usar formidable o busboy
    // Por ahora, retornar error indicando que se necesita configuración adicional
    return res.status(501).json({
      success: false,
      message: 'Multipart/form-data parsing requiere configuración adicional. Por favor, envía el archivo como base64 en el body JSON.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir el sticker'
    });
  }
}
