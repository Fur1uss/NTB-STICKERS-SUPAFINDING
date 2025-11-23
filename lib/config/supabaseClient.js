import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL y SUPABASE_ANON_KEY deben estar configuradas en Vercel');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
