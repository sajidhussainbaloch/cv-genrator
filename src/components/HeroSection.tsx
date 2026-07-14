import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 bg-indigo-950/50 border border-indigo-800/30 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold text-indigo-300">AI-Powered Career Assistant</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          Upload CV &rarr; Analyze &rarr; Improve &rarr;
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">Get Matching Jobs</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          AI-powered CV analysis that checks your ATS score, finds skill gaps, rewrites your resume, and matches you with the best jobs near your location.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="/signup" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/20">
            Get Started Free <ArrowRight className="w-4 h-4" />
          </a>
          <a href="/login" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm px-6 py-3 rounded-xl border border-slate-700 transition">
            Sign In
          </a>
        </div>
        <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-3 text-xs text-slate-500 font-mono">
            <span className="text-emerald-400">$</span> CV Analysis Studio — Demo Preview
          </div>
          <div className="space-y-1.5 text-xs font-mono text-left">
            <p className="text-slate-400"><span className="text-emerald-400">$</span> Analyzing CV... <span className="text-emerald-400">✓</span></p>
            <p className="text-slate-400"><span className="text-indigo-400">ATS Score:</span> <span className="text-emerald-400">78%</span></p>
            <p className="text-slate-400"><span className="text-amber-400">Missing Skills:</span> Python, Docker, Kubernetes</p>
            <p className="text-slate-400"><span className="text-emerald-400">$</span> Found <span className="text-white font-bold">6</span> matching jobs in your area</p>
          </div>
        </div>
      </div>
    </section>
  );
}
