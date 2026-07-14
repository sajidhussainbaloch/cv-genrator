import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import DashboardHeader from "../components/DashboardHeader";
import WizardSteps from "../components/WizardSteps";
import UploadZone from "../components/UploadZone";
import AnalysisPanel from "../components/AnalysisPanel";
import ImprovedPreview from "../components/ImprovedPreview";
import JobResults from "../components/JobResults";
import SearchTerminal from "../components/SearchTerminal";
import SettingsPanel from "../components/SettingsPanel";
import HistoryPanel from "../components/HistoryPanel";
import { useAuth } from "../context/AuthContext";
import { suggestFromCV, getSettings, saveHistory } from "../api";
import type { CvAnalysis, JobResult, AppStep, LoadingState, CvSuggest, CvHistoryEntry } from "../types";
import { Sparkles, Loader2, History, Save } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [cvText, setCvText] = useState("");
  const [filename, setFilename] = useState("");
  const [analysis, setAnalysis] = useState<CvAnalysis | null>(null);
  const [optimizedText, setOptimizedText] = useState("");
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [jobSummary, setJobSummary] = useState("");
  const [isMockJobs, setIsMockJobs] = useState(false);
  const [suggest, setSuggest] = useState<CvSuggest | null>(null);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [analyzeState, setAnalyzeState] = useState<LoadingState>("idle");
  const [improveState, setImproveState] = useState<LoadingState>("idle");
  const [jobLoading, setJobLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);


  const [jobRole, setJobRole] = useState("");
  const [jobSkills, setJobSkills] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);

  useEffect(() => {
    getSettings().then((s) => setJobLocation(s.location || "")).catch(() => {});
  }, []);

  const currentStep: AppStep = !cvText ? "upload" : !analysis ? "analyze" : !optimizedText ? "improve" : "jobs";

  const handleUpload = (text: string, name: string) => {
    setCvText(text);
    setFilename(name);
    setAnalysis(null);
    setOptimizedText("");
    setJobs([]);
    setSuggest(null);
  };

  const handleAnalyze = async () => {
    if (!cvText) return;
    setAnalyzeState("loading");
    try {
      const [analyzeRes, suggestRes] = await Promise.all([
        fetch("/api/cv/analyze", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cvText }),
        }).then((r) => r.json()),
        suggestFromCV(cvText).catch(() => ({ success: false, data: null })),
      ]);
      if (analyzeRes.success) {
        setAnalysis(analyzeRes.data);
        setAnalyzeState("success");
      } else setAnalyzeState("idle");
      if (suggestRes.success && suggestRes.data) {
        setSuggest(suggestRes.data);
        setJobRole(suggestRes.data.suggestedRole || "");
        setJobSkills(suggestRes.data.suggestedSkills?.join(", ") || "");
      }
    } catch {
      setAnalyzeState("idle");
    }
  };

  const handleImprove = async () => {
    if (!cvText) return;
    setImproveState("loading");
    try {
      const res = await fetch("/api/cv/improve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cvText }),
      });
      const data = await res.json();
      if (data.success) { setOptimizedText(data.optimizedText); setImproveState("success"); }
      else setImproveState("idle");
    } catch { setImproveState("idle"); }
  };

  const handleJobSearch = async () => {
    if (!cvText) return;
    setShowTerminal(true);
    setJobLoading(true);
    setIsMockJobs(false);
    try {
      const loc = jobLocation || (await getSettings().then((s) => s.location).catch(() => ""));
      await new Promise((r) => setTimeout(r, 2500));
      const res = await fetch("/api/jobs/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: jobSkills, role: jobRole, cvText, location: loc }),
      });
      const data = await res.json();
      if (data.success) { setJobs(data.jobs); setJobSummary(data.summary || ""); setIsMockJobs(data.isMock || false); }
    } catch {}
    setJobLoading(false);
    setShowTerminal(false);
  };

  const handleImproveAndSearch = async () => {
    await handleImprove();
    if (jobRole || suggest?.suggestedRole) {
      handleJobSearch();
    }
  };

  const handleSaveToHistory = async () => {
    if (!cvText) return;
    setSavingHistory(true);
    try {
      await saveHistory({
        cv_text: cvText,
        filename: filename || "Untitled",
        analysis: analysis || undefined,
        optimized_text: optimizedText,
        job_role: jobRole,
        job_skills: jobSkills,
        job_location: jobLocation,
      });
    } catch {}
    setSavingHistory(false);
  };

  const handleRestoreFromHistory = (entry: CvHistoryEntry) => {
    setCvText(entry.cv_text);
    setFilename(entry.filename);
    setAnalysis(entry.analysis);
    setOptimizedText(entry.optimized_text || "");
    setJobRole(entry.job_role || "");
    setJobSkills(entry.job_skills || "");
    setJobLocation(entry.job_location || "");
    setShowHistory(false);
    if (entry.analysis) setAnalyzeState("success");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentStep={currentStep} userName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"} />
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <DashboardHeader userName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"} onOpenSettings={() => setSettingsOpen(true)} />
        <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-5">
          <WizardSteps currentStep={currentStep} />

          <UploadZone onUpload={handleUpload} loading={uploadLoading} />

          {cvText && (
            <>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleAnalyze} disabled={analyzeState === "loading"} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition disabled:opacity-50 shadow-xs">
                  {analyzeState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  )}
                  {analyzeState === "loading" ? "Analyzing..." : "Analyze CV"}
                </button>
                <button onClick={handleImprove} disabled={improveState === "loading"} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition disabled:opacity-50 shadow-xs">
                  {improveState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  )}
                  {improveState === "loading" ? "Improving..." : "Make It Better"}
                </button>
                {suggest && (
                  <button onClick={handleImproveAndSearch} disabled={improveState === "loading" || jobLoading} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition disabled:opacity-50 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                    Improve & Find Jobs
                  </button>
                )}
                <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm px-5 py-3 rounded-xl transition border border-gray-200 shadow-xs">
                  <History className="w-4 h-4" />
                  History
                </button>
                <button onClick={handleSaveToHistory} disabled={savingHistory} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm px-5 py-3 rounded-xl transition border border-gray-200 shadow-xs disabled:opacity-50">
                  {savingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingHistory ? "Saving..." : "Save Session"}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {analyzeState === "loading" && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-8 flex flex-col items-center justify-center min-h-60">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
                      <p className="text-sm font-semibold text-gray-700 animate-pulse">Analyzing your CV...</p>
                      <p className="text-xs text-gray-400 mt-1">Checking skills, structure, and ATS compatibility</p>
                    </div>
                  )}
                  {analyzeState === "success" && analysis && <AnalysisPanel analysis={analysis} />}
                  {analyzeState === "idle" && !analysis && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-8 flex flex-col items-center justify-center min-h-60 text-center">
                      <svg className="w-10 h-10 text-gray-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                      <p className="text-sm font-semibold text-gray-500">Click "Analyze CV" to see results</p>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">{filename || "CV Preview"}</p>
                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{optimizedText || cvText}</pre>
                </div>
              </div>

              {improveState === "loading" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-8 flex flex-col items-center justify-center min-h-40">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-2" />
                  <p className="text-sm font-semibold text-gray-700 animate-pulse">Optimizing your CV...</p>
                </div>
              )}
              {improveState === "success" && optimizedText && <ImprovedPreview originalText={cvText} optimizedText={optimizedText} />}
            </>
          )}

          <JobResults
            jobs={jobs}
            loading={jobLoading}
            skills={jobSkills}
            role={jobRole}
            location={jobLocation}
            isMock={isMockJobs}
            suggestedLocations={suggest?.suggestedLocations || []}
            onSkillsChange={setJobSkills}
            onRoleChange={setJobRole}
            onLocationChange={setJobLocation}
            onSearch={handleJobSearch}
          />
        </div>
      </main>
      {showTerminal && <SearchTerminal />}
      {showHistory && <HistoryPanel onRestore={handleRestoreFromHistory} onClose={() => setShowHistory(false)} />}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
