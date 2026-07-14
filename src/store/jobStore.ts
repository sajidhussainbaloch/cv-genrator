import { create } from "zustand";
import type { JobResult } from "../types";

interface JobState {
  jobs: JobResult[];
  role: string;
  skills: string;
  location: string;
  searchLoading: boolean;
  searchTerminalOpen: boolean;

  setJobs: (jobs: JobResult[]) => void;
  setRole: (r: string) => void;
  setSkills: (s: string) => void;
  setLocation: (l: string) => void;
  setSearchLoading: (v: boolean) => void;
  setSearchTerminalOpen: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  jobs: [] as JobResult[],
  role: "",
  skills: "",
  location: "",
  searchLoading: false,
  searchTerminalOpen: false,
};

export const useJobStore = create<JobState>()((set) => ({
  ...initialState,
  setJobs: (jobs) => set({ jobs }),
  setRole: (role) => set({ role }),
  setSkills: (skills) => set({ skills }),
  setLocation: (location) => set({ location }),
  setSearchLoading: (searchLoading) => set({ searchLoading }),
  setSearchTerminalOpen: (searchTerminalOpen) => set({ searchTerminalOpen }),
  reset: () => set(initialState),
}));
