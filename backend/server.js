import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// Importar rutas del juego
import gameRoutes from './routes/gameRoutes.js';
import scoreboardRoutes from './routes/scoreboardRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Mutex simple para evitar creaciones duplicadas
const processingUsers = new Set();

// Configurar Supabase
// Cliente para todas las operaciones (usa solo ANON key)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🔑 VERIFICACIÓN DE CLAVES SUPABASE:');
console.log('URL:', process.env.SUPABASE_URL);
console.log('ANON Key (primeros 20 chars):', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Middleware
app.use(cors());
app.use(express.json());

// Logs para todas las peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// RUTAS DEL JUEGO
console.log('🎮 Configurando rutas del juego...');
app.use('/api/game', gameRoutes);

// RUTAS DEL SCOREBOARD  
console.log('🏆 Configurando rutas del scoreboard...');
app.use('/api/scoreboard', scoreboardRoutes);

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint principal para crear o obtener usuario
app.post('/api/auth/create-or-get-user', async (req, res) => {
  try {
    console.log('\n🔐 SOLICITUD DE CREAR/OBTENER USUARIO');
    console.log('📋 Headers:', req.headers);
    console.log('📦 Body:', req.body);

    // Obtener el token de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Token de autorización no encontrado');
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Se requiere un token de autorización válido'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token recibido (primeros 20 chars):', token.substring(0, 20) + '...');

    // Verificar el token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Error de autenticación:', authError?.message || 'Usuario no encontrado');
      return res.status(401).json({
        error: 'Token inválido',
        message: authError?.message || 'No se pudo verificar el token'
      });
    }

    console.log('✅ Usuario autenticado:', user.email);
    console.log('\n📊 INFORMACIÓN COMPLETA DEL USUARIO:');
    console.log('='.repeat(60));
    console.log('🆔 Supabase ID:', user.id);
    console.log('📧 Email:', user.email);
    console.log('👤 Email Verificado:', user.email_confirmed_at ? '✅ Sí' : '❌ No');
    console.log('📅 Creado:', user.created_at);
    console.log('🔄 Última actualización:', user.updated_at);
    console.log('📱 Teléfono:', user.phone || 'No disponible');

    // Extraer Google Provider ID
    const googleId = user.user_metadata?.provider_id || user.user_metadata?.sub;
    console.log('🔑 Google Provider ID:', googleId);
    console.log('🖼️ Avatar URL:', user.user_metadata?.avatar_url || user.user_metadata?.picture || 'No disponible');
    
    console.log('\n👤 METADATOS DE USUARIO:');
    console.log(JSON.stringify(user.user_metadata, null, 2));
    console.log('='.repeat(60));

    if (!googleId) {
      console.error('❌ Google Provider ID no encontrado en metadatos');
      return res.status(400).json({
        error: 'Google ID no encontrado',
        message: 'No se pudo obtener el Provider ID de Google del usuario'
      });
    }

    // PROTECCIÓN CONTRA PROCESOS DUPLICADOS
    if (processingUsers.has(googleId)) {
      console.log('⚠️ Usuario ya está siendo procesado, esperando...');
      return res.status(429).json({
        error: 'Procesando',
        message: 'El usuario ya está siendo procesado, por favor espera'
      });
    }

    // Marcar como en procesamiento
    processingUsers.add(googleId);
    
    try {

    console.log('\n🔍 BUSCANDO USUARIO POR GOOGLE ID:', googleId);

    // PASO 1: BUSCAR POR GOOGLE ID (método principal y más confiable)
    let { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('googleId', googleId);

    if (fetchError) {
      console.error('❌ Error buscando usuario por Google ID:', fetchError);
      return res.status(500).json({
        error: 'Error de base de datos',
        message: 'Error al buscar usuario por Google ID'
      });
    }

    console.log('📊 RESULTADOS DE BÚSQUEDA:');
    console.log('- Usuarios encontrados con este Google ID:', existingUsers?.length || 0);
    
    if (existingUsers && existingUsers.length > 1) {
      console.log('⚠️ ADVERTENCIA: Se encontraron múltiples usuarios con el mismo Google ID');
      // Tomar el primer usuario (el más antiguo)
      existingUsers = [existingUsers[0]];
    }

    let userData;
    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    // Si el usuario YA EXISTE por Google ID
    if (existingUser && !fetchError) {
      console.log('✅ USUARIO ENCONTRADO POR GOOGLE ID:', existingUser.username);
      console.log('🆔 DB ID:', existingUser.id);
      console.log('📧 DB Email:', existingUser.emailuser);
      console.log('🔑 DB Google ID:', existingUser.googleId);
      
      // Verificar si necesita actualizar el avatar
      const currentAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      if (currentAvatar && currentAvatar !== existingUser.avatarUser) {
        console.log('🔄 Actualizando avatar del usuario...');
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ avatarUser: currentAvatar })
          .eq('id', existingUser.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Error actualizando avatar:', updateError);
        } else {
          console.log('✅ Avatar actualizado exitosamente');
          existingUser = updatedUser;
        }
      }
      
      userData = existingUser;
    } else {
      // NO EXISTE: CREAR NUEVO USUARIO
      console.log('📝 USUARIO NO ENCONTRADO - CREANDO NUEVO USUARIO');
      console.log('🆔 Google ID para nuevo usuario:', googleId);
      
      // VERIFICACIÓN ADICIONAL: Buscar por email para evitar duplicados
      const { data: usersByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('emailuser', user.email);
        
      if (usersByEmail && usersByEmail.length > 0) {
        console.log('⚠️ USUARIO ENCONTRADO POR EMAIL - ACTUALIZANDO GOOGLE ID');
        const userByEmail = usersByEmail[0];
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ googleId: googleId })
          .eq('id', userByEmail.id)
          .select()
          .single();
          
        if (updateError) {
          console.error('❌ Error actualizando Google ID:', updateError);
        } else {
          console.log('✅ Google ID actualizado exitosamente');
          userData = updatedUser;
        }
      } else {
        // CREAR COMPLETAMENTE NUEVO
        console.log('🆕 CREANDO USUARIO COMPLETAMENTE NUEVO');
        
        const username = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
        const avatarUser = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        const emailuser = user.email;
        
        console.log('👤 Nombre de usuario:', username);
        console.log('📧 Email:', emailuser);
        console.log('🖼️ Avatar:', avatarUser);
        
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
          console.error('❌ Error creando nuevo usuario:', insertError);
          return res.status(500).json({
            error: 'Error creando usuario',
            message: 'No se pudo crear el usuario en la base de datos',
            details: insertError.message
          });
        }
        
        console.log('✅ NUEVO USUARIO CREADO EXITOSAMENTE');
        console.log('🆔 Nuevo DB ID:', newUser.id);
        console.log('👤 Username:', newUser.username);
        console.log('🔑 Google ID guardado:', newUser.googleId);
        
        userData = newUser;
      }
    }

    // Respuesta exitosa
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');
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

    } catch (innerError) {
      console.error('❌ Error en el proceso de búsqueda/creación:', innerError);
      return res.status(500).json({
        error: 'Error procesando usuario',
        message: innerError.message
      });
    } finally {
      // Limpiar el mutex
      processingUsers.delete(googleId);
    }

  } catch (error) {
    console.error('❌ Error interno del servidor:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint para obtener información del usuario
app.get('/api/auth/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Se requiere un token de autorización válido'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Token inválido',
        message: authError?.message || 'No se pudo verificar el token'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Error obteniendo información del usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('✅ Supabase configurado:', process.env.SUPABASE_URL);
  console.log();
  console.log('🚀 SERVIDOR INICIADO');
  console.log('='.repeat(50));
  console.log('📡 Puerto:', PORT);
  console.log('🌐 URL:', `http://localhost:${PORT}`);
  console.log('🔗 Health Check:', `http://localhost:${PORT}/health`);
  console.log('🔐 Auth Endpoint:', `http://localhost:${PORT}/api/auth/create-or-get-user`);
  console.log('👤 User Endpoint:', `http://localhost:${PORT}/api/auth/user`);
  console.log('🎮 Game Endpoints:', `http://localhost:${PORT}/api/game/*`);
  console.log('🏆 Scoreboard Endpoints:', `http://localhost:${PORT}/api/scoreboard/*`);
  console.log('='.repeat(50));
  console.log('✅ Servidor listo para recibir peticiones');
  console.log();
});
