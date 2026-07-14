import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

export const supabaseUrl_ = supabaseUrl;
export const supabaseAnonKey_ = supabaseAnonKey;

export function isSupabaseConfigured() {
  return !!(supabaseUrl && (supabaseAnonKey || serviceRoleKey));
}
