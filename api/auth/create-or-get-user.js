import supabase from '../../lib/config/supabaseClient.js';

/**
 * Crea o obtiene un usuario
 * POST /api/auth/create-or-get-user
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener el token de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Se requiere un token de autorización válido'
      });
    }

    const token = authHeader.substring(7);

    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Token inválido',
        message: authError?.message || 'No se pudo verificar el token'
      });
    }

    // Extraer Google Provider ID
    const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub;

    if (!googleId) {
      return res.status(400).json({
        error: 'Google ID no encontrado',
        message: 'No se pudo obtener el Provider ID de Google del usuario'
      });
    }

    // PASO 1: BUSCAR POR GOOGLE ID (método principal y más confiable)
    let { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('googleId', googleId);

    if (fetchError) {
      return res.status(500).json({
        error: 'Error de base de datos',
        message: 'Error al buscar usuario por Google ID'
      });
    }
    
    if (existingUsers && existingUsers.length > 1) {
      existingUsers = [existingUsers[0]];
    }

    let userData;
    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    // Si el usuario YA EXISTE por Google ID
    if (existingUser && !fetchError) {
      // Verificar si necesita actualizar el avatar
      const currentAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (currentAvatar && currentAvatar !== existingUser.avatarUser) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ avatarUser: currentAvatar })
          .eq('id', existingUser.id)
          .select()
          .single();
          
        if (!updateError) {
          userData = updatedUser;
        } else {
          userData = existingUser;
        }
      } else {
        userData = existingUser;
      }
    } else {
      // NO EXISTE: CREAR NUEVO USUARIO
      // VERIFICACIÓN ADICIONAL: Buscar por email para evitar duplicados
      const { data: usersByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('emailuser', user.email);
        
      if (usersByEmail && usersByEmail.length > 0) {
        const userByEmail = usersByEmail[0];
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ googleId: googleId })
          .eq('id', userByEmail.id)
          .select()
          .single();
          
        if (!updateError) {
          userData = updatedUser;
        }
      } else {
        // CREAR COMPLETAMENTE NUEVO
        const username = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
        const avatarUser = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        const emailuser = user.email;
        
        // Crear el nuevo usuario en la base de datos
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{
            googleId: googleId,
            username: username,
            emailuser: emailuser,
            avatarUser: avatarUser
          }])
          .select()
          .single();
          
        if (insertError) {
          return res.status(500).json({
            error: 'Error creando usuario',
            message: 'No se pudo crear el usuario en la base de datos',
            details: insertError.message
          });
        }
        
        userData = newUser;
      }
    }

    // Respuesta exitosa
    res.json({
      success: true,
      user: userData,
      authUser: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      message: existingUser ? 'Usuario encontrado por Google ID' : 'Nuevo usuario creado exitosamente'
    });

  } catch (error) {
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}
