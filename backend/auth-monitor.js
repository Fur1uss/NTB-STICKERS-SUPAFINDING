import supabase from './config/supabaseClient.js';
import { createRequire } from 'module';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const require = createRequire(import.meta.url);

console.log('🚀 Iniciando script de monitoreo de autenticación...');
console.log('📡 Conectando con Supabase...');

// Función para obtener información detallada del usuario
const getUserInfo = async (session) => {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 NUEVA SESIÓN DE USUARIO DETECTADA');
  console.log('='.repeat(80));
  
  if (session?.user) {
    const user = session.user;
    
    console.log('📋 INFORMACIÓN BÁSICA DEL USUARIO:');
    console.log('  🆔 ID:', user.id);
    console.log('  📧 Email:', user.email);
    console.log('  👤 Email Verificado:', user.email_confirmed_at ? '✅ Sí' : '❌ No');
    console.log('  📅 Creado:', user.created_at);
    console.log('  🔄 Última actualización:', user.updated_at);
    console.log('  📱 Teléfono:', user.phone || 'No disponible');
    
    console.log('\n🔑 INFORMACIÓN DE AUTENTICACIÓN:');
    console.log('  🏢 Proveedor:', user.app_metadata?.provider || 'No disponible');
    console.log('  🔗 Providers:', user.app_metadata?.providers || []);
    
    console.log('\n👤 METADATOS DE USUARIO:');
    if (user.user_metadata) {
      console.log('  🖼️ Avatar URL:', user.user_metadata.avatar_url || 'No disponible');
      console.log('  📧 Email:', user.user_metadata.email || 'No disponible');
      console.log('  👤 Email Verificado:', user.user_metadata.email_verified ? '✅ Sí' : '❌ No');
      console.log('  📛 Nombre Completo:', user.user_metadata.full_name || 'No disponible');
      console.log('  🎯 ISS:', user.user_metadata.iss || 'No disponible');
      console.log('  📛 Nombre:', user.user_metadata.name || 'No disponible');
      console.log('  🔗 Provider ID:', user.user_metadata.provider_id || 'No disponible');
      console.log('  📷 Picture:', user.user_metadata.picture || 'No disponible');
      console.log('  🏢 Sub:', user.user_metadata.sub || 'No disponible');
    } else {
      console.log('  ❌ No hay metadatos de usuario disponibles');
    }
    
    console.log('\n🔧 METADATOS DE APLICACIÓN:');
    if (user.app_metadata) {
      console.log('  🏢 Provider:', user.app_metadata.provider || 'No disponible');
      console.log('  🔗 Providers:', JSON.stringify(user.app_metadata.providers, null, 2));
      console.log('  🆔 Provider ID:', user.app_metadata.provider_id || 'No disponible');
    } else {
      console.log('  ❌ No hay metadatos de aplicación disponibles');
    }
    
    console.log('\n🎫 INFORMACIÓN DE SESIÓN:');
    console.log('  🔑 Access Token (primeros 20 chars):', session.access_token?.substring(0, 20) + '...');
    console.log('  🔄 Refresh Token (primeros 20 chars):', session.refresh_token?.substring(0, 20) + '...');
    console.log('  ⏰ Expira en:', session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'No disponible');
    console.log('  🆔 Token Type:', session.token_type || 'No disponible');
    
    console.log('\n📊 OBJETO COMPLETO (RAW):');
    console.log('🔍 USER OBJECT:');
    console.log(JSON.stringify(user, null, 2));
    
    console.log('\n🔍 SESSION OBJECT:');
    console.log(JSON.stringify(session, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ ANÁLISIS COMPLETADO');
    console.log('='.repeat(80) + '\n');
    
    return user;
  } else {
    console.log('❌ No hay información de usuario en la sesión');
    return null;
  }
};

// Función para obtener la sesión actual
const getCurrentSession = async () => {
  try {
    console.log('🔍 Obteniendo sesión actual...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error obteniendo sesión:', error);
      return;
    }
    
    if (session) {
      console.log('✅ Sesión activa encontrada');
      await getUserInfo(session);
    } else {
      console.log('ℹ️ No hay sesión activa en este momento');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Escuchar cambios de autenticación
console.log('👂 Configurando listener de cambios de autenticación...');

const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('\n🎯 EVENTO DE AUTENTICACIÓN:', event);
  
  switch (event) {
    case 'SIGNED_IN':
      console.log('✅ Usuario ha iniciado sesión');
      await getUserInfo(session);
      break;
      
    case 'SIGNED_OUT':
      console.log('🚪 Usuario ha cerrado sesión');
      break;
      
    case 'TOKEN_REFRESHED':
      console.log('🔄 Token de sesión renovado');
      await getUserInfo(session);
      break;
      
    case 'USER_UPDATED':
      console.log('👤 Información de usuario actualizada');
      await getUserInfo(session);
      break;
      
    default:
      console.log('🔔 Evento de autenticación:', event);
      if (session) {
        await getUserInfo(session);
      }
  }
});

console.log('✅ Listener configurado correctamente');

// Obtener sesión actual al iniciar
await getCurrentSession();

console.log('🎯 Script listo. Esperando eventos de autenticación...');
console.log('💡 Para probar: Inicia sesión con Google en tu frontend');
console.log('🔄 Para salir: Ctrl + C\n');

// Mantener el script corriendo
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando script de monitoreo...');
  subscription?.unsubscribe();
  process.exit(0);
});
