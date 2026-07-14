import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { Loader2 } from "lucide-react";

function getPath() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("popstate"));
}

function Router() {
  const { user, loading, isConfigured } = useAuth();
  const path = getPath();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (path === "/login") return <Login />;
  if (path === "/signup") return <Signup />;

  if (isConfigured && !user && path.startsWith("/dashboard")) {
    navigate("/login");
    return null;
  }

  if (isConfigured && user && (path === "/" || path === "/login" || path === "/signup")) {
    navigate("/dashboard");
    return null;
  }

  if (path.startsWith("/dashboard") || (isConfigured && user)) {
    return <Dashboard />;
  }

  return <Landing />;
}

export default function App() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    const handler = () => setKey((k) => k + 1);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return <Router key={key} />;
}
