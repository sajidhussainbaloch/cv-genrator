import { Upload, Search, Wand2, Briefcase } from "lucide-react";
import type { AppStep } from "../types";

interface WizardStepsProps {
  currentStep: AppStep;
}

const steps: { key: AppStep; icon: typeof Upload; label: string }[] = [
  { key: "upload", icon: Upload, label: "Upload" },
  { key: "analyze", icon: Search, label: "Analyze" },
  { key: "improve", icon: Wand2, label: "Improve" },
  { key: "jobs", icon: Briefcase, label: "Jobs" },
];

export default function WizardSteps({ currentStep }: WizardStepsProps) {
  const activeIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-0 bg-white rounded-2xl border border-gray-100 shadow-xs p-1">
      {steps.map((s, i) => {
        const isActive = i === activeIdx;
        const isDone = i < activeIdx;
        return (
          <div key={s.key} className="flex-1 flex items-center">
            <div className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex-1 ${
              isActive ? "bg-indigo-600 text-white shadow-sm" : isDone ? "text-emerald-600" : "text-gray-400"
            }`}>
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
              {isDone && <span className="text-emerald-400 ml-1">✓</span>}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${i < activeIdx ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
