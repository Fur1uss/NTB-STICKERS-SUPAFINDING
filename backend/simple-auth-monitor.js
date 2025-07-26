import dotenv from 'dotenv';
dotenv.config();

console.log('🚀 Script de monitoreo de autenticación iniciado');
console.log('📡 SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('🔑 ANON_KEY:', process.env.ANON_KEY ? 'Configurada' : 'No configurada');

import supabase from './config/supabaseClient.js';

console.log('✅ Supabase cliente inicializado');

// Función para log de usuario
const logUserInfo = (session) => {
  if (!session?.user) {
    console.log('❌ No hay usuario en la sesión');
    return;
  }
  
  console.log('\n🎯 INFORMACIÓN DEL USUARIO:');
  console.log('='.repeat(50));
  console.log('🆔 ID:', session.user.id);
  console.log('📧 Email:', session.user.email);
  console.log('👤 Metadatos:', JSON.stringify(session.user.user_metadata, null, 2));
  console.log('🔧 App Metadata:', JSON.stringify(session.user.app_metadata, null, 2));
  console.log('='.repeat(50));
};

// Verificar sesión actual
console.log('🔍 Verificando sesión actual...');
const { data: { session }, error } = await supabase.auth.getSession();

if (error) {
  console.error('❌ Error obteniendo sesión:', error);
} else if (session) {
  console.log('✅ Sesión activa encontrada');
  logUserInfo(session);
} else {
  console.log('ℹ️ No hay sesión activa');
}

// Escuchar cambios
console.log('👂 Escuchando cambios de autenticación...');
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  console.log('\n🔔 Evento de auth:', event);
  logUserInfo(session);
});

console.log('✅ Listener configurado. Esperando eventos...');

// Mantener el proceso vivo
setInterval(() => {
  console.log('💓 Script activo...');
}, 30000); // Cada 30 segundos
