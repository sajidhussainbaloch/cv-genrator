import { Brain } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">CV Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-xs text-slate-300 hover:text-white font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition">Sign In</a>
          <a href="/signup" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition">Get Started</a>
        </div>
      </div>
    </nav>
  );
}
