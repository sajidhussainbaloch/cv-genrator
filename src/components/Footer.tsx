import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/50 py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-400">CV Studio</span>
        </div>
        <p className="text-[10px] text-slate-600">AI-Powered CV Analysis & Job Matching. &copy; 2026</p>
      </div>
    </footer>
  );
}
