import fs from "fs";
import { getSettings, SETTINGS_PATH } from "../lib/shared";

export function setupRoutes(app: any) {
  app.get("/api/settings", (_req: any, res: any) => {
    const s = getSettings();
    res.json({ baseUrl: s.baseUrl, model: s.model, apiKey: s.apiKey, location: s.location || "", searxngUrl: s.searxngUrl || "" });
  });

  app.post("/api/settings", (req: any, res: any) => {
    const { baseUrl, model, apiKey, location, searxngUrl } = req.body;
    const current = getSettings();
    const updated = {
      baseUrl: baseUrl ?? current.baseUrl, model: model ?? current.model, apiKey: apiKey ?? current.apiKey,
      location: location ?? current.location, searxngUrl: searxngUrl ?? current.searxngUrl,
    };
    try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2)); } catch {}
    res.json({ success: true, settings: updated });
  });
}
