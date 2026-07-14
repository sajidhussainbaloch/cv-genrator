import { supabaseFetch, supabaseUrl, supabaseAnonKey, getAuthToken } from "../lib/shared";

export function setupRoutes(app: any) {
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const result = await supabaseFetch("/auth/v1/signup", { email, password, data: { full_name: name || "" } });
    if (result.error) return res.status(400).json({ error: result.error });
    const { access_token, refresh_token, user } = result.data || {};
    res.json({ success: true, user, session: access_token ? { access_token, refresh_token, user, expires_in: 3600, token_type: "bearer" } : null });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const result = await supabaseFetch("/auth/v1/token?grant_type=password", { email, password });
    if (result.error) return res.status(401).json({ error: result.error });
    const { access_token, refresh_token, user, expires_in, token_type } = result.data || {};
    res.json({ success: true, user, session: { access_token, refresh_token, user, expires_in, token_type } });
  });

  app.get("/api/auth/me", async (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: "No token provided" });
    if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: "Auth not configured" });
    try {
      const resp = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` } });
      const data = await resp.json();
      if (!resp.ok) return res.status(401).json({ error: data.msg || "Invalid token" });
      res.json({ success: true, user: data });
    } catch (e: any) { res.status(500).json({ error: e.message || "Network error" }); }
  });

  app.post("/api/auth/logout", (_req, res) => res.json({ success: true }));

  app.get("/api/debug/env", (_req, res) => {
    res.json({ supabaseUrl: supabaseUrl ? supabaseUrl.slice(0, 20) + "..." : "MISSING", hasAnonKey: !!supabaseAnonKey, nodeEnv: process.env.NODE_ENV || "not set" });
  });
}
