import { createClient, SupabaseClient } from '@supabase/supabase-js';

function _getEnv(): any {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) return (import.meta as any).env;
  if (typeof process !== 'undefined' && process.env) return process.env;
  return {};
}

const env = _getEnv();

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseEnabled = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = isSupabaseEnabled ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export default supabase;
