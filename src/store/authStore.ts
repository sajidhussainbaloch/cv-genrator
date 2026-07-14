import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AuthState {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  initialize: () => void;
  signup: (email: string, password: string, name: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  loading: true,
  isConfigured: isSupabaseConfigured(),

  initialize: () => {
    const configured = isSupabaseConfigured();
    if (!configured || !supabase) {
      set({ loading: false, isConfigured: false });
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, loading: false });
    }).catch(() => set({ loading: false }));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
    return () => subscription.unsubscribe();
  },

  signup: async (email, password, name) => {
    if (!supabase) return "Supabase not configured";
    try {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      return error?.message || null;
    } catch (e: any) {
      return e.message || "Signup failed";
    }
  },

  login: async (email, password) => {
    if (!supabase) return "Supabase not configured";
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message || null;
    } catch (e: any) {
      return e.message || "Login failed";
    }
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut();
    set({ user: null });
  },
}));
