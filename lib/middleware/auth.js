import supabase from '../config/supabaseClient.js';

/**
 * Middleware para verificar el token de autenticación de Supabase
 * Adaptado para funciones serverless de Vercel
 * @param {Object} req - Request object de Vercel
 * @returns {Object|null} Usuario autenticado o null
 */
export const verifyToken = async (req) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization || req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remover 'Bearer ' del inicio

    console.log('🔐 Verificando token de autenticación...');

    // Verificar el token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Error verificando token:', error);
      return null;
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
      return null;
    }

    console.log('✅ Usuario encontrado en backend DB:', {
      id: backendUser.id,
      username: backendUser.username,
      email: backendUser.emailuser
    });

    // Retornar la información del usuario (usando el ID del backend)
    return {
      id: backendUser.id, // Usar el ID de la base de datos del backend
      email: backendUser.emailuser,
      username: backendUser.username,
      supabaseId: user.id, // Guardar también el ID de Supabase por si se necesita
      user_metadata: user.user_metadata
    };

  } catch (error) {
    console.error('❌ Error en middleware de autenticación:', error);
    return null;
  }
};

/**
 * Middleware opcional para verificar token (no falla si no hay token)
 * @param {Object} req - Request object de Vercel
 * @returns {Object|null} Usuario autenticado o null
 */
export const optionalAuth = async (req) => {
  try {
    const authHeader = req.headers.authorization || req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, retornar null
      return null;
    }

    const token = authHeader.substring(7);

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Token inválido, retornar null
      return null;
    }

    // Obtener el usuario de la base de datos del backend usando el email
    const { data: backendUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('emailuser', user.email)
      .single();

    if (dbError || !backendUser) {
      // Usuario no encontrado en backend, retornar null
      return null;
    }

    // Token válido, retornar usuario (usando el ID del backend)
    return {
      id: backendUser.id, // Usar el ID de la base de datos del backend
      email: backendUser.emailuser,
      username: backendUser.username,
      supabaseId: user.id, // Guardar también el ID de Supabase por si se necesita
      user_metadata: user.user_metadata
    };

  } catch (error) {
    console.error('❌ Error en middleware de autenticación opcional:', error);
    // En caso de error, retornar null
    return null;
  }
};
