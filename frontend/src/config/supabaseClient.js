import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

console.log('Supabase URL:', supabaseUrl) // Para debug - quitar en producción

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
