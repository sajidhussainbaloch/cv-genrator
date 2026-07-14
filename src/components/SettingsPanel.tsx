import { useState } from "react";
import { X, Settings, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import type { AiSettings } from "../types";
import { getSettings, saveSettings } from "../api";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AiSettings>({
    baseUrl: "",
    model: "",
    apiKey: "",
    location: "",
    searxngUrl: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (open && !loaded) {
    setLoaded(true);
    getSettings().then(setSettings).catch(() => {});
  }

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-sm font-bold text-gray-900">AI Provider Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">API Base URL</label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Model ID</label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              placeholder="gpt-4o-mini, llama3.1, gemini-2.0-flash"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 pr-10 focus:border-indigo-500 focus:outline-hidden"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Location</label>
            <input
              type="text"
              value={settings.location}
              onChange={(e) => setSettings({ ...settings, location: e.target.value })}
              placeholder="Berlin, Germany"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-hidden"
            />
            <p className="text-[10px] text-gray-400 mt-1">Used for job search near your area</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Local SearXNG URL (optional)</label>
            <input
              type="text"
              value={settings.searxngUrl}
              onChange={(e) => setSettings({ ...settings, searxngUrl: e.target.value })}
              placeholder="http://localhost:8888"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-hidden"
            />
            <p className="text-[10px] text-gray-400 mt-1">Leave empty to auto-detect or use public instances</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">Compatible AI providers:</p>
            <ul className="space-y-0.5">
              <li>• OpenAI: <code className="text-indigo-600">https://api.openai.com/v1</code></li>
              <li>• Ollama (local): <code className="text-indigo-600">http://localhost:11434/v1</code></li>
              <li>• Groq: <code className="text-indigo-600">https://api.groq.com/openai/v1</code></li>
              <li>• Google Gemini via OpenAI proxy</li>
            </ul>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-3 rounded-xl transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
