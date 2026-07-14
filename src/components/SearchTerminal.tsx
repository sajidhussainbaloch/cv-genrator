import { useEffect, useState } from "react";
import { Brain } from "lucide-react";

const lines = [
  { text: "Initializing AI job search engine...", delay: 300 },
  { text: "Reading your CV profile...", delay: 800 },
  { text: "Extracting skills & experience data...", delay: 1300 },
  { text: "Creating personalized job search summary...", delay: 1800 },
  { text: "Connecting to search provider...", delay: 2300 },
  { text: "Scanning job boards near your location...", delay: 2800 },
  { text: "Analyzing match scores against your CV...", delay: 3400 },
  { text: "Ranking results by relevance...", delay: 3900 },
  { text: "", delay: 4200, isComplete: true },
];

export default function SearchTerminal() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [typedChars, setTypedChars] = useState<Record<number, string>>({});

  useEffect(() => {
    lines.forEach((line, idx) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, idx]);
        if (line.text) {
          let charIdx = 0;
          const interval = setInterval(() => {
            charIdx++;
            setTypedChars((prev) => ({ ...prev, [idx]: line.text.slice(0, charIdx) }));
            if (charIdx >= line.text.length) clearInterval(interval);
          }, 15 + Math.random() * 20);
        }
      }, line.delay);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-950 border-b border-slate-800">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-300">AI Job Search Engine</span>
          <div className="ml-auto flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
        </div>
        <div className="p-5 font-mono text-xs space-y-2 min-h-[220px]">
          {lines.map((line, idx) => {
            if (line.isComplete) {
              return visibleLines.includes(idx) ? (
                <p key={idx} className="text-emerald-400 font-bold flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Complete! Loading results...
                </p>
              ) : null;
            }
            if (!visibleLines.includes(idx)) return null;
            const typed = typedChars[idx] || "";
            const isTyping = typed.length < line.text.length;
            return (
              <p key={idx} className="text-slate-300">
                <span className="text-emerald-400">$</span>{" "}
                {typed}
                {isTyping && <span className="inline-block w-2 h-4 bg-emerald-400/70 ml-0.5 animate-pulse" />}
              </p>
            );
          })}
          {visibleLines.length >= lines.length && (
            <p className="text-slate-500 animate-pulse mt-4 text-center">Displaying results...</p>
          )}
        </div>
      </div>
    </div>
  );
}
