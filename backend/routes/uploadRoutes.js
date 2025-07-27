import express from 'express';
import multer from 'multer';
import { uploadSticker } from '../controllers/uploadController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para manejar archivos
const upload = multer({
  storage: multer.memoryStorage(), // Almacenar en memoria como Buffer
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos PNG
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PNG'), false);
    }
  }
});

/**
 * POST /api/upload/sticker
 * Sube un sticker al bucket y guarda la metadata en la base de datos
 */
router.post('/sticker', 
  verifyToken, // Verificar que el usuario esté autenticado
  upload.single('file'), // Manejar un solo archivo con el campo 'file'
  async (req, res) => {
    try {
      console.log('📤 === SUBIDA DE STICKER DESDE FRONTEND ===');
      console.log('👤 Usuario autenticado:', req.user);
      console.log('📁 Archivo recibido:', req.file?.originalname);
      console.log('📝 Datos del formulario:', {
        name: req.body.name,
        description: req.body.description,
        userId: req.body.userId
      });

      // Validar que se recibió un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se recibió ningún archivo'
        });
      }

      // Validar campos requeridos
      const { name, description, userId } = req.body;
      if (!name || !description || !userId) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: name, description, userId'
        });
      }

      // Validar que el userId coincida con el usuario autenticado
      if (parseInt(userId) !== parseInt(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para subir stickers para otro usuario'
        });
      }

      // Llamar a la función de upload del controlador
      const result = await uploadSticker(
        req.file.buffer, // Buffer del archivo
        parseInt(userId),
        name,
        description,
        req.file.originalname // Nombre original del archivo
      );

      // Verificar si hubo error en la subida
      if (result.error) {
        console.error('❌ Error en uploadSticker:', result.error);
        return res.status(500).json({
          success: false,
          message: result.error
        });
      }

      console.log('✅ Sticker subido exitosamente:', result);

      // Devolver respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Sticker subido exitosamente',
        data: result
      });

    } catch (error) {
      console.error('❌ Error en ruta de upload:', error);
      
      // Manejar errores específicos de multer
      if (error.message === 'Solo se permiten archivos PNG') {
        return res.status(400).json({
          success: false,
          message: 'Solo se permiten archivos PNG'
        });
      }

      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande. Máximo 5MB'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al subir el sticker'
      });
    }
  }
);

/**
 * GET /api/upload/user-stickers/:userId
 * Obtiene los stickers de un usuario específico
 */
router.get('/user-stickers/:userId', 
  verifyToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const authenticatedUserId = req.user.id;

      // Verificar que el usuario solo pueda ver sus propios stickers
      if (parseInt(userId) !== authenticatedUserId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver stickers de otro usuario'
        });
      }

      // Importar Supabase para consultar la base de datos
      const supabase = (await import('../config/supabaseClient.js')).default;

      const { data: stickers, error } = await supabase
        .from('stickers')
        .select('*')
        .eq('iduser', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo stickers del usuario:', error);
        return res.status(500).json({
          success: false,
          message: 'Error al obtener los stickers del usuario'
        });
      }

      res.json({
        success: true,
        message: 'Stickers obtenidos exitosamente',
        data: stickers
      });

    } catch (error) {
      console.error('❌ Error en ruta de obtener stickers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

export default router; 