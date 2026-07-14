import { useEffect, useState } from "react";
import { Plus, Trash2, Edit3, CheckCircle, Circle } from "lucide-react";
import { useProviderStore } from "../../store/providerStore";
import type { Provider } from "../../types";
import ProviderForm from "./ProviderForm";

export default function ProviderList() {
  const { providers, loading, fetchProviders, setActiveProvider, deleteProvider, updateProvider } = useProviderStore();
  const [showForm, setShowForm] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleSetActive = async (p: Provider) => {
    await updateProvider(p.id, { is_active: true } as any);
    setActiveProvider(p);
  };

  const handleEdit = (p: Provider) => {
    setEditProvider(p);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this provider?")) {
      await deleteProvider(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">AI Providers</h3>
        <button onClick={() => { setEditProvider(null); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">
          <Plus className="w-3.5 h-3.5" /> Add Provider
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm mb-3">No providers configured</p>
          <p className="text-gray-500 text-xs">Add OpenAI, Ollama, Groq, or any OpenAI-compatible API</p>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${p.is_active ? "border-indigo-300 bg-indigo-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => handleSetActive(p)} className="flex-shrink-0 text-gray-300 hover:text-indigo-600">
                  {p.is_active ? <CheckCircle className="w-5 h-5 text-indigo-600" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-400 truncate">{p.model} &middot; {p.base_url.replace(/^https?:\/\//, "").split("/")[0]}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProviderForm open={showForm} onClose={() => { setShowForm(false); setEditProvider(null); }} editProvider={editProvider} />
    </div>
  );
}
