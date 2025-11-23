import supabase from '../config/supabaseClient.js';

/**
 * Servicio de autenticación usando Supabase directamente
 * Reemplaza la funcionalidad de api/auth
 */
class AuthServiceDirect {
  
  /**
   * Crea o obtiene un usuario en la base de datos
   * Reemplaza POST /api/auth/create-or-get-user
   */
  async createOrGetUser() {
    try {
      // Obtener usuario autenticado de Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Extraer Google Provider ID
      const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub;

      if (!googleId) {
        throw new Error('Google ID no encontrado en los metadatos del usuario');
      }

      // PASO 1: BUSCAR POR GOOGLE ID (método principal)
      let { data: existingUsers, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('googleId', googleId);

      if (fetchError) {
        throw new Error('Error al buscar usuario por Google ID');
      }
      
      if (existingUsers && existingUsers.length > 1) {
        existingUsers = [existingUsers[0]];
      }

      let userData;
      const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

      // Si el usuario YA EXISTE por Google ID
      if (existingUser) {
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

        return {
          success: true,
          user: userData,
          isNewUser: false
        };
      }

      // Si el usuario NO EXISTE, crearlo
      const username = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'Usuario';
      
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      const newUserData = {
        googleId: googleId,
        username: username,
        emailuser: user.email,
        avatarUser: avatarUrl
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([newUserData])
        .select()
        .single();

      if (insertError) {
        // Si falla por duplicado (email), intentar buscar por email
        if (insertError.code === '23505') {
          const { data: userByEmail } = await supabase
            .from('users')
            .select('*')
            .eq('emailuser', user.email)
            .single();

          if (userByEmail) {
            // Actualizar con Google ID si no lo tiene
            if (!userByEmail.googleId) {
              const { data: updatedUser } = await supabase
                .from('users')
                .update({ googleId: googleId })
                .eq('id', userByEmail.id)
                .select()
                .single();

              return {
                success: true,
                user: updatedUser || userByEmail,
                isNewUser: false
              };
            }

            return {
              success: true,
              user: userByEmail,
              isNewUser: false
            };
          }
        }
        throw insertError;
      }

      return {
        success: true,
        user: newUser,
        isNewUser: true
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene la información del usuario desde la base de datos
   * Reemplaza GET /api/auth/user
   */
  async getUserInfo() {
    try {
      // Obtener usuario autenticado de Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Buscar usuario en la base de datos por email o Google ID
      const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub;

      let userData = null;

      if (googleId) {
        const { data: userByGoogleId } = await supabase
          .from('users')
          .select('*')
          .eq('googleId', googleId)
          .single();

        if (userByGoogleId) {
          userData = userByGoogleId;
        }
      }

      if (!userData) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('emailuser', user.email)
          .single();

        if (userByEmail) {
          userData = userByEmail;
        }
      }

      if (!userData) {
        throw new Error('Usuario no encontrado en la base de datos');
      }

      return {
        success: true,
        user: userData
      };

    } catch (error) {
      throw error;
    }
  }
}

// Exportar una instancia singleton
const authServiceDirect = new AuthServiceDirect();
export default authServiceDirect;

