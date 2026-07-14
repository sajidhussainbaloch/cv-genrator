import { Search, Wand2, Briefcase, Target } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "ATS Score Analysis",
    desc: "Get a precise 0-100 ATS score with color-coded feedback. Identify missing keywords and weak sections that hurt your chances.",
    color: "text-indigo-400 bg-indigo-950/50 border-indigo-800/30",
  },
  {
    icon: Wand2,
    title: "Smart CV Rewriting",
    desc: "AI rewrites your CV with strong action verbs, proper structure, and relevant keywords. Download the optimized version instantly.",
    color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/30",
  },
  {
    icon: Briefcase,
    title: "Location-Based Jobs",
    desc: "Searches jobs near your location using AI + web search. Get matched results with match % and direct apply links.",
    color: "text-amber-400 bg-amber-950/50 border-amber-800/30",
  },
];

export default function FeaturesGrid() {
  return (
    <section className="py-20 px-4 border-t border-slate-800/50" id="features">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2">Everything you need to land your next role</h2>
        <p className="text-slate-400 text-sm text-center mb-12 max-w-lg mx-auto">AI-powered tools to analyze, improve, and match your CV with the perfect job.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className={`rounded-2xl p-5 border ${f.color}`}>
              <div className="p-2 rounded-xl bg-slate-900 w-fit mb-4">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
