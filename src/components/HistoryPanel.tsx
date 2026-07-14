import { useEffect, useState } from "react";
import { Clock, FileText, TrendingUp, Trash2, RotateCcw, Loader2, AlertCircle, History } from "lucide-react";
import type { CvHistoryEntry } from "../types";
import { fetchHistory, deleteHistory } from "../api";

interface HistoryPanelProps {
  onRestore: (entry: CvHistoryEntry) => void;
  onClose: () => void;
}

export default function HistoryPanel({ onRestore, onClose }: HistoryPanelProps) {
  const [entries, setEntries] = useState<CvHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory().then((res) => {
      if (res.success) setEntries(res.data || []);
      else setError("Failed to load history");
      setLoading(false);
    }).catch(() => {
      setError("Failed to load history");
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const res = await deleteHistory(id);
    if (res.success) setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            CV History
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500">No saved CV analyses yet</p>
              <p className="text-[10px] text-gray-400 mt-1">Upload and analyze a CV to save it here</p>
            </div>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-indigo-100 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {entry.filename || "Untitled CV"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.created_at).toLocaleDateString(undefined, {
                      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {entry.analysis && (
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    entry.analysis.atsScore >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
                    entry.analysis.atsScore >= 60 ? "text-amber-600 bg-amber-50 border-amber-200" :
                    "text-red-600 bg-red-50 border-red-200"
                  }`}>
                    <TrendingUp className="w-3 h-3 inline mr-0.5" />
                    {entry.analysis.atsScore}
                  </span>
                )}
              </div>

              {entry.job_role && (
                <p className="text-[10px] text-gray-500 mt-2 truncate">
                  Role: {entry.job_role}
                </p>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onRestore(entry)}
                  className="flex items-center gap-1 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="flex items-center gap-1 text-[10px] font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-red-200"
                >
                  {deleting === entry.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}