import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  historyPanelOpen: boolean;
  settingsPanelOpen: boolean;

  toggleSidebar: () => void;
  setHistoryPanelOpen: (v: boolean) => void;
  setSettingsPanelOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  historyPanelOpen: false,
  settingsPanelOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setHistoryPanelOpen: (historyPanelOpen) => set({ historyPanelOpen }),
  setSettingsPanelOpen: (settingsPanelOpen) => set({ settingsPanelOpen }),
}));
