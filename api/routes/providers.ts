import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { callLLM } from "../lib/llm";

const router = Router();

function getUserId(req: any): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        return payload.sub || null;
      }
    } catch {}
  }
  return null;
}

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!supabaseAdmin) return res.json({ success: true, data: [] });
  const { data, error } = await supabaseAdmin
    .from("providers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Database not configured" });
  const { name, base_url, api_key, model, temperature, max_tokens } = req.body;
  if (!name || !base_url || !api_key || !model) {
    return res.status(400).json({ error: "name, base_url, api_key, and model are required" });
  }
  const { data, error } = await supabaseAdmin
    .from("providers")
    .insert({ user_id: userId, name, base_url, api_key, model, temperature: temperature || 0.7, max_tokens: max_tokens || 4096, is_active: false })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

router.put("/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Database not configured" });
  const { name, base_url, api_key, model, temperature, max_tokens, is_active } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (base_url !== undefined) updates.base_url = base_url;
  if (api_key !== undefined) updates.api_key = api_key;
  if (model !== undefined) updates.model = model;
  if (temperature !== undefined) updates.temperature = temperature;
  if (max_tokens !== undefined) updates.max_tokens = max_tokens;
  if (is_active !== undefined) {
    if (is_active) {
      await supabaseAdmin.from("providers").update({ is_active: false }).eq("user_id", userId).neq("id", req.params.id);
    }
    updates.is_active = is_active;
  }
  const { data, error } = await supabaseAdmin
    .from("providers")
    .update(updates)
    .eq("id", req.params.id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Database not configured" });
  const { error } = await supabaseAdmin.from("providers").delete().eq("id", req.params.id).eq("user_id", userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

router.post("/test", async (req, res) => {
  const { base_url, api_key, model } = req.body;
  if (!base_url || !api_key || !model) return res.status(400).json({ error: "base_url, api_key, and model required" });
  const result = await callLLM({ base_url, api_key, model }, [{ role: "user", content: "Reply with just: OK" }]);
  if (result) return res.json({ success: true });
  res.json({ error: "Connection failed — check your URL, key, and model name" });
});

export default router;
