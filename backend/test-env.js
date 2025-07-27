import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('� Verificando directorio de trabajo...');
console.log('📁 Directorio actual:', process.cwd());
console.log('📄 Archivo actual:', import.meta.url);
console.log('�📂 Directorio del script:', __dirname);

// Cargar variables de entorno
dotenv.config();

// Leer el archivo .env
try {
  const envPath = join(__dirname, '.env');
  const envContent = readFileSync(envPath, 'utf8');
  console.log('✅ Archivo .env encontrado');
  console.log('📋 Contenido del .env:');
  console.log(envContent);
} catch (error) {
  console.error('❌ Error leyendo .env:', error.message);
}

console.log('\n🔧 Variables de entorno después de dotenv.config():');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('ANON_KEY:', process.env.ANON_KEY ? 'Configurada' : 'No configurada');
