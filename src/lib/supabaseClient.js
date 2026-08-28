import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables de entorno de Supabase no configuradas.');
}

/**
 * Cliente único y centralizado de Supabase para el frontend.
 * Utiliza exclusivamente la clave anónima (anon key) con RLS.
 */
export const supabase = createClient(
  supabaseUrl || 'https://utlohnidkuvxqppmoevj.supabase.co',
  supabaseAnonKey || ''
);

export default supabase;
