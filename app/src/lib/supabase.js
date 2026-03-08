import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we are in production
const isProduction = import.meta.env.PROD || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost'));

// Check if environment variables are present
const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url';

// Force configuration check in production
if (isProduction && !isConfigured) {
  console.error('CRITICAL: Supabase keys are missing in production environment!');
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Helper to check if Supabase is configured
 * In production, this always returns true (forcing errors if missing keys)
 * In development, it allows demo mode fallbacks if keys are missing
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
  if (isProduction) return true; // Fail fast in prod
  return !!supabase;
};
