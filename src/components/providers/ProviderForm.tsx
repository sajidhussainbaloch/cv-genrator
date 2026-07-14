import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Loader2, Check } from "lucide-react";
import type { Provider } from "../../types";
import { useProviderStore } from "../../store/providerStore";

interface ProviderFormProps {
  open: boolean;
  onClose: () => void;
  editProvider?: Provider | null;
}

export default function ProviderForm({ open, onClose, editProvider }: ProviderFormProps) {
  const { addProvider, updateProvider, testProvider } = useProviderStore();
  const [form, setForm] = useState({
    name: "",
    base_url: "",
    api_key: "",
    model: "",
    temperature: 0.7,
    max_tokens: 4096,
  });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      if (editProvider) {
        setForm({
          name: editProvider.name,
          base_url: editProvider.base_url,
          api_key: editProvider.api_key,
          model: editProvider.model,
          temperature: editProvider.temperature,
          max_tokens: editProvider.max_tokens,
        });
      } else {
        setForm({ name: "", base_url: "", api_key: "", model: "", temperature: 0.7, max_tokens: 4096 });
      }
      setTestResult(null);
      setSaved(false);
    }
  }, [open, editProvider]);

  if (!open) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const err = await testProvider(form);
    setTestResult(err || "Connected successfully!");
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    let ok = false;
    if (editProvider) {
      ok = await updateProvider(editProvider.id, form);
    } else {
      const result = await addProvider(form);
      ok = !!result;
    }
    if (ok) {
      setSaved(true);
      setTimeout(() => onClose(), 1000);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{editProvider ? "Edit Provider" : "Add Provider"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Local LLM" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Base URL</label>
            <input type="text" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              placeholder="http://localhost:11434/v1" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <div className="relative">
              <input type={showKey ? "text" : "password"} value={form.api_key} onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder="sk-..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
              <input type="text" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="gpt-4o-mini" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temperature</label>
              <input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) || 0.7 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Tokens</label>
            <input type="number" value={form.max_tokens} onChange={(e) => setForm({ ...form, max_tokens: parseInt(e.target.value) || 4096 })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${testResult === "Connected successfully!" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {testResult}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleTest} disabled={testing || !form.base_url || !form.api_key}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
              {testing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Test Connection"}
            </button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.base_url || !form.api_key || !form.model}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : saved ? <Check className="w-4 h-4 mx-auto" /> : editProvider ? "Update" : "Add Provider"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
