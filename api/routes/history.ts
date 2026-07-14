import { supabaseData, getAuthToken } from "../lib/shared";

export function setupRoutes(app: any) {
  app.get("/api/cv/history", async (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: "No token" });
    const result = await supabaseData("/rest/v1/cv_history?select=*&order=created_at.desc", token);
    if (result.error) return res.status(500).json({ error: result.error });
    res.json({ success: true, data: result.data });
  });

  app.post("/api/cv/history", async (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: "No token" });
    const { cv_text, filename, analysis, optimized_text, job_role, job_skills, job_location } = req.body;
    if (!cv_text) return res.status(400).json({ error: "cv_text is required" });
    const result = await supabaseData("/rest/v1/cv_history", token, { method: "POST", body: { cv_text, filename, analysis, optimized_text, job_role, job_skills, job_location } });
    if (result.error) return res.status(500).json({ error: result.error });
    res.json({ success: true, data: result.data?.[0] || result.data });
  });

  app.delete("/api/cv/history/:id", async (req, res) => {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ error: "No token" });
    const result = await supabaseData(`/rest/v1/cv_history?id=eq.${req.params.id}`, token, { method: "DELETE" });
    if (result.error) return res.status(500).json({ error: result.error });
    res.json({ success: true });
  });
}
