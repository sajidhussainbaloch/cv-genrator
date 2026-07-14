import { Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ProviderSelector from "./providers/ProviderSelector";

interface DashboardHeaderProps {
  userName: string;
  onOpenSettings: () => void;
}

export default function DashboardHeader({ userName, onOpenSettings }: DashboardHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 md:hidden">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <span className="text-sm font-bold text-gray-900">CV Studio</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ProviderSelector />
          <button onClick={onOpenSettings} className="p-2 hover:bg-gray-100 rounded-xl transition" title="Settings">
            <Settings className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-xl transition md:hidden" title="Logout">
            <LogOut className="w-4 h-4 text-gray-500" />
          </button>
          <div className="hidden md:flex items-center gap-2.5 text-xs">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-700">{userName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
