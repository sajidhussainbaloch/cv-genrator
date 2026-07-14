interface ATSScoreCardProps {
  score: number;
}

export default function ATSScoreCard({ score }: ATSScoreCardProps) {
  const color =
    score < 50 ? "text-red-500" : score < 75 ? "text-amber-500" : "text-emerald-500";
  const strokeColor =
    score < 50 ? "#ef4444" : score < 75 ? "#f59e0b" : "#10b981";
  const bgColor =
    score < 50 ? "bg-red-50 border-red-100" : score < 75 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100";
  const label =
    score < 50 ? "Needs Work" : score < 75 ? "Room to Grow" : "Great Score";

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`p-5 rounded-2xl border ${bgColor}`}>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={score < 50 ? "#fecaca" : score < 75 ? "#fde68a" : "#a7f3d0"}
              strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-black ${color}`}>{score}</span>
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">ATS Score</p>
          <p className={`text-sm font-semibold ${color}`}>{label}</p>
          <p className="text-xs text-gray-400 mt-1">Out of 100</p>
        </div>
      </div>
    </div>
  );
}
