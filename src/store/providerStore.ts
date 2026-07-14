import { create } from "zustand";
import type { Provider } from "../types";

interface ProviderState {
  providers: Provider[];
  activeProvider: Provider | null;
  loading: boolean;
  fetchProviders: () => Promise<void>;
  setActiveProvider: (p: Provider | null) => void;
  addProvider: (data: Partial<Provider>) => Promise<Provider | null>;
  updateProvider: (id: string, data: Partial<Provider>) => Promise<boolean>;
  deleteProvider: (id: string) => Promise<boolean>;
  testProvider: (data: Partial<Provider>) => Promise<string | null>;
}

export const useProviderStore = create<ProviderState>()((set, get) => ({
  providers: [],
  activeProvider: null,
  loading: false,

  fetchProviders: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/providers");
      const json = await res.json();
      if (json.success) {
        set({ providers: json.data, loading: false });
        const active = json.data.find((p: Provider) => p.is_active);
        if (active) set({ activeProvider: active });
      }
    } catch {
      set({ loading: false });
    }
  },

  setActiveProvider: (activeProvider) => set({ activeProvider }),

  addProvider: async (data) => {
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchProviders();
        return json.data;
      }
      return null;
    } catch { return null; }
  },

  updateProvider: async (id, data) => {
    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        await get().fetchProviders();
        return true;
      }
      return false;
    } catch { return false; }
  },

  deleteProvider: async (id) => {
    try {
      const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await get().fetchProviders();
        return true;
      }
      return false;
    } catch { return false; }
  },

  testProvider: async (data) => {
    try {
      const res = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json.error || null;
    } catch (e: any) { return e.message || "Connection failed"; }
  },
}));
