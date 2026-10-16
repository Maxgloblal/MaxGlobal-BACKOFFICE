import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables de entorno de Supabase no configuradas (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). ' +
    'Configura el entorno adecuadamente para evitar conexiones accidentales a bases de datos indebidas.'
  );
}

/**
 * Cliente único y centralizado de Supabase para el frontend.
 * Utiliza exclusivamente la clave anónima (anon key) con RLS.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
