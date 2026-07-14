import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Brain, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Signup() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const err = await signup(email, password, name);
      if (err) {
        setError(err);
        setLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (e: any) {
      setError(e.message || "Signup failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <a href="/" className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-8 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </a>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Create Account</h1>
              <p className="text-[10px] text-slate-400">Start your CV journey</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="•••••••• (min 6 chars)" className="w-full text-sm bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 pr-10 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-hidden" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400 bg-red-950/50 rounded-lg px-3 py-2 border border-red-900">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 rounded-xl transition disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
          <p className="mt-4 text-xs text-center text-slate-500">
            Already have an account? <a href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
