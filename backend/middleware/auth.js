import supabase from '../config/supabaseClient.js';

/**
 * Middleware para verificar el token de autenticación de Supabase
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autorización requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer ' del inicio

    console.log('🔐 Verificando token de autenticación...');

    // Verificar el token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Error verificando token:', error);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    console.log('✅ Usuario autenticado en Supabase:', {
      id: user.id,
      email: user.email
    });

    // Obtener el usuario de la base de datos del backend usando el email
    const { data: backendUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('emailuser', user.email)
      .single();

    if (dbError || !backendUser) {
      console.error('❌ Error obteniendo usuario del backend:', dbError);
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado en la base de datos'
      });
    }

    console.log('✅ Usuario encontrado en backend DB:', {
      id: backendUser.id,
      username: backendUser.username,
      email: backendUser.emailuser
    });

    // Agregar la información del usuario al request (usando el ID del backend)
    req.user = {
      id: backendUser.id, // Usar el ID de la base de datos del backend
      email: backendUser.emailuser,
      username: backendUser.username,
      supabaseId: user.id, // Guardar también el ID de Supabase por si se necesita
      user_metadata: user.user_metadata
    };

    next();

  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor en autenticación'
    });
  }
};

/**
 * Middleware opcional para verificar token (no falla si no hay token)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin autenticación
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Token inválido, continuar sin autenticación
      req.user = null;
      return next();
    }

    // Obtener el usuario de la base de datos del backend usando el email
    const { data: backendUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('emailuser', user.email)
      .single();

    if (dbError || !backendUser) {
      // Usuario no encontrado en backend, continuar sin autenticación
      req.user = null;
      return next();
    }

    // Token válido, agregar usuario al request (usando el ID del backend)
    req.user = {
      id: backendUser.id, // Usar el ID de la base de datos del backend
      email: backendUser.emailuser,
      username: backendUser.username,
      supabaseId: user.id, // Guardar también el ID de Supabase por si se necesita
      user_metadata: user.user_metadata
    };

    next();

  } catch (error) {
    console.error('❌ Error en middleware de autenticación opcional:', error);
    // En caso de error, continuar sin autenticación
    req.user = null;
    next();
  }
}; 