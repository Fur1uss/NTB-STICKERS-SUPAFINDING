import { verifyToken } from '../../../lib/middleware/auth.js';
import supabase from '../../../lib/config/supabaseClient.js';

/**
 * Obtiene los stickers de un usuario específico
 * GET /api/upload/user-stickers/:userId
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // En Vercel, los parámetros dinámicos vienen en req.query
    const userId = req.query.userId || req.query['userId'];
    const authenticatedUserId = user.id;

    // Verificar que el usuario solo pueda ver sus propios stickers
    if (parseInt(userId) !== authenticatedUserId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver stickers de otro usuario'
      });
    }

    const { data: stickers, error } = await supabase
      .from('stickers')
      .select('*')
      .eq('iduser', userId)
      .order('created_at', { ascending: false });

    if (error) {
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
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}
