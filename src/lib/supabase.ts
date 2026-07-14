import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = rawUrl?.replace(/^["']|["']$/g, "").trim();
const supabaseAnonKey = rawKey?.replace(/^["']|["']$/g, "").trim();

let client: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")) {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;

export function isSupabaseConfigured(): boolean {
  return !!client;
}
