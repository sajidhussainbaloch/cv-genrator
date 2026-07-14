import { Brain, Upload, Search, Wand2, Briefcase, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { AppStep } from "../types";

interface SidebarProps {
  currentStep: AppStep;
  userName: string;
}

const steps: { key: AppStep; icon: typeof Upload; label: string }[] = [
  { key: "upload", icon: Upload, label: "Upload CV" },
  { key: "analyze", icon: Search, label: "Analyze" },
  { key: "improve", icon: Wand2, label: "Improve" },
  { key: "jobs", icon: Briefcase, label: "Find Jobs" },
];

export default function Sidebar({ currentStep, userName }: SidebarProps) {
  const { logout } = useAuth();

  return (
    <aside className="w-56 bg-slate-900 text-slate-300 shrink-0 flex flex-col border-r border-slate-800 hidden md:flex">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold text-white tracking-tight">CV STUDIO</h1>
            <p className="text-[9px] text-slate-500 mt-0.5">AI Career Assistant</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {steps.map((s) => {
          const isActive = s.key === currentStep;
          const isPast = steps.findIndex((x) => x.key === currentStep) >= steps.findIndex((x) => x.key === s.key);
          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : isPast
                  ? "text-slate-400"
                  : "text-slate-600"
              }`}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              {s.label}
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-400">
          <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="truncate">{userName}</span>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-red-400 hover:bg-slate-800 transition">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
