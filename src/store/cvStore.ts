import { create } from "zustand";
import type { CvAnalysis, AppStep } from "../types";

interface CVState {
  cvText: string;
  fileName: string;
  analysis: CvAnalysis | null;
  optimizedText: string;
  activeStep: AppStep;
  uploadLoading: boolean;
  analyzeLoading: boolean;
  improveLoading: boolean;

  setCV: (text: string, fileName: string) => void;
  setAnalysis: (a: CvAnalysis | null) => void;
  setOptimizedText: (t: string) => void;
  setActiveStep: (s: AppStep) => void;
  setUploadLoading: (v: boolean) => void;
  setAnalyzeLoading: (v: boolean) => void;
  setImproveLoading: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  cvText: "",
  fileName: "",
  analysis: null as CvAnalysis | null,
  optimizedText: "",
  activeStep: "upload" as AppStep,
  uploadLoading: false,
  analyzeLoading: false,
  improveLoading: false,
};

export const useCVStore = create<CVState>()((set) => ({
  ...initialState,

  setCV: (text, fileName) => set({ cvText: text, fileName }),
  setAnalysis: (analysis) => set({ analysis }),
  setOptimizedText: (optimizedText) => set({ optimizedText }),
  setActiveStep: (activeStep) => set({ activeStep }),
  setUploadLoading: (uploadLoading) => set({ uploadLoading }),
  setAnalyzeLoading: (analyzeLoading) => set({ analyzeLoading }),
  setImproveLoading: (improveLoading) => set({ improveLoading }),
  reset: () => set(initialState),
}));
