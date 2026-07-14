import { AlertTriangle, CheckCircle, Lightbulb, Target } from "lucide-react";
import ATSScoreCard from "./ATSScoreCard";
import type { CvAnalysis } from "../types";

interface AnalysisPanelProps {
  analysis: CvAnalysis;
}

export default function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  return (
    <div className="space-y-4">
      <ATSScoreCard score={analysis.atsScore} />

      {analysis.missingSkills.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Missing Skills</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.missingSkills.map((skill, i) => (
              <span
                key={i}
                className="bg-rose-50 text-rose-600 text-xs font-semibold px-2.5 py-1 rounded-lg border border-rose-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.weakAreas.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Weak Areas</h3>
          </div>
          <ul className="space-y-2">
            {analysis.weakAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                {area}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.strengths.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggestions.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Suggestions</h3>
          </div>
          <ul className="space-y-2">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
