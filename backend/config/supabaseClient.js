import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio actual para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde el archivo .env en el directorio backend
dotenv.config({ path: join(__dirname, '..', '.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL no está configurada en las variables de entorno')
  process.exit(1)
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_ANON_KEY no está configurada en las variables de entorno')
  process.exit(1)
}

console.log('✅ Supabase configurado:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;