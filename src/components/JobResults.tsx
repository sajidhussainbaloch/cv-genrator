import { Briefcase, Search, AlertCircle, MapPin, Sparkles } from "lucide-react";
import JobCard from "./JobCard";
import type { JobResult } from "../types";

interface JobResultsProps {
  jobs: JobResult[];
  loading: boolean;
  skills: string;
  role: string;
  location: string;
  isMock?: boolean;
  suggestedLocations: string[];
  onSkillsChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onSearch: () => void;
}

export default function JobResults({
  jobs,
  loading,
  skills,
  role,
  location,
  isMock,
  suggestedLocations,
  onSkillsChange,
  onRoleChange,
  onLocationChange,
  onSearch,
}: JobResultsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4 text-indigo-500" />
          Find Matching Jobs
        </h3>
        <p className="text-[11px] text-gray-400 mb-4">
          AI will search the web for jobs matching your CV and location
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            placeholder="Target role"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-hidden"
          />
          <input
            type="text"
            value={skills}
            onChange={(e) => onSkillsChange(e.target.value)}
            placeholder="Key skills"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:border-indigo-500 focus:outline-hidden"
          />
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Location"
              className="text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 w-full focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
          <button
            onClick={onSearch}
            disabled={loading || !role}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {loading ? "Searching..." : "Find Jobs"}
          </button>
        </div>

        {suggestedLocations.length > 0 && !location && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-gray-400">Suggested:</span>
            {suggestedLocations.map((loc) => (
              <button
                key={loc}
                onClick={() => onLocationChange(loc)}
                className="text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition"
              >
                {loc}
              </button>
            ))}
          </div>
        )}
      </div>

      {isMock && jobs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-800">Live search unavailable</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              SearXNG job search didn't return results. Click LinkedIn, Indeed, or Glassdoor below to search with your criteria pre-filled.
            </p>
          </div>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-gray-700">No Jobs Found</h4>
          <p className="text-[11px] text-gray-400 mt-1">
            Enter a target role and your skills above to search
          </p>
        </div>
      )}
    </div>
  );
}
