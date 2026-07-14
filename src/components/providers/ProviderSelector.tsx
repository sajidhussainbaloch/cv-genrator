import { useEffect, useState, useRef } from "react";
import { ChevronDown, Check, Settings } from "lucide-react";
import { useProviderStore } from "../../store/providerStore";

export default function ProviderSelector() {
  const { providers, activeProvider, fetchProviders, setActiveProvider, updateProvider } = useProviderStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = async (p: any) => {
    await updateProvider(p.id, { is_active: true } as any);
    setActiveProvider(p);
    setOpen(false);
  };

  if (providers.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-gray-300">
        <Settings className="w-3.5 h-3.5 text-gray-400" />
        <span className="max-w-[100px] truncate">{activeProvider?.name || "Select Provider"}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
          {providers.map((p) => (
            <button key={p.id} onClick={() => handleSelect(p)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <div className="text-left min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-gray-400 truncate">{p.model}</div>
              </div>
              {activeProvider?.id === p.id && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
