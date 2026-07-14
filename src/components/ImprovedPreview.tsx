import { useState } from "react";
import { FileDown, FileText, Check, Copy, Download } from "lucide-react";

interface ImprovedPreviewProps {
  originalText: string;
  optimizedText: string;
}

export default function ImprovedPreview({ originalText, optimizedText }: ImprovedPreviewProps) {
  const [view, setView] = useState<"optimized" | "side-by-side">("optimized");
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(optimizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = () => {
    const blob = new Blob([optimizedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized-cv.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Improved CV</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "optimized" ? "side-by-side" : "optimized")}
            className="text-xs text-gray-500 hover:text-indigo-600 font-semibold px-2 py-1 rounded-lg hover:bg-gray-50"
          >
            {view === "optimized" ? "Compare" : "Optimized"}
          </button>
          <button
            onClick={copyText}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 font-semibold px-2 py-1 rounded-lg hover:bg-gray-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={downloadText}
            className="flex items-center gap-1 text-xs bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      <div className="p-4">
        {view === "optimized" ? (
          <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {optimizedText}
          </pre>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Original</p>
              <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-gray-50 rounded-lg p-3">
                {originalText}
              </pre>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Optimized</p>
              <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto bg-emerald-50/30 rounded-lg p-3 border border-emerald-100">
                {optimizedText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
