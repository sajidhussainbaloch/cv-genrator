import { Briefcase, MapPin, DollarSign, ExternalLink, TrendingUp, Search } from "lucide-react";
import type { JobResult } from "../types";

interface JobCardProps {
  job: JobResult;
}

export default function JobCard({ job }: JobCardProps) {
  const scoreColor =
    job.matchPercentage >= 85
      ? "text-emerald-600 bg-emerald-50 border-emerald-100"
      : job.matchPercentage >= 70
      ? "text-indigo-600 bg-indigo-50 border-indigo-100"
      : "text-amber-600 bg-amber-50 border-amber-100";

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 ${job.isMock ? 'border-amber-200 hover:border-amber-300' : 'border-gray-100 hover:border-indigo-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 font-medium uppercase">{job.company}</p>
          <h4 className="text-sm font-bold text-gray-900 mt-0.5">{job.title}</h4>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${scoreColor}`}>
          <TrendingUp className="w-3 h-3" />
          {job.matchPercentage}%
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {job.location}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5" /> {job.salary}
        </span>
      </div>

      <p className="mt-3 text-xs text-gray-600 line-clamp-2">{job.description}</p>

      {job.matchReasons.length > 0 && (
        <div className="mt-3 space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Why matched:</p>
          {job.matchReasons.slice(0, 2).map((reason, i) => (
            <p key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
              <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              {reason}
            </p>
          ))}
        </div>
      )}

      {job.boardLinks && job.boardLinks.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {job.boardLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 font-semibold text-[10px] py-2 rounded-xl transition border"
              style={{
                backgroundColor: `${link.color}12`,
                color: link.color,
                borderColor: `${link.color}30`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${link.color}25`; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${link.color}12`; }}
            >
              <Search className="w-3 h-3 shrink-0" />
              {link.name}
            </a>
          ))}
        </div>
      )}

      {(!job.boardLinks || job.boardLinks.length === 0) && (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full flex items-center justify-center gap-1.5 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-xs py-2.5 rounded-xl transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Apply Now
        </a>
      )}
    </div>
  );
}
