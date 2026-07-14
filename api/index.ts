import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

try { fs.mkdirSync("/tmp/data", { recursive: true }); } catch {}
try { fs.mkdirSync("/tmp/uploads", { recursive: true }); } catch {}

const DATA_DIR = "/tmp/data";
const UPLOAD_DIR = "/tmp/uploads";

const app = express();
app.use(express.json({ limit: "50mb" }));

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = (supabaseUrl && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

function getUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const parts = auth.slice(7).split(".");
      if (parts.length === 3) {
        return JSON.parse(Buffer.from(parts[1], "base64").toString()).sub || "default";
      }
    } catch {}
  }
  return "default";
}

async function callLLM(config: { base_url: string; api_key: string; model: string; temperature?: number; max_tokens?: number }, messages: { role: string; content: string }[]): Promise<string | null> {
  try {
    const url = config.base_url.endsWith("/chat/completions") ? config.base_url : `${config.base_url.replace(/\/$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.api_key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, messages, temperature: config.temperature ?? 0.7, max_tokens: config.max_tokens ?? 4096, stream: false }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

app.get("/api/providers", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin) return res.json({ success: true, data: [] });
  const { data, error } = await supabaseAdmin.from("providers").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.post("/api/providers", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin) return res.status(500).json({ error: "Database not configured" });
  const { name, base_url, api_key, model, temperature, max_tokens } = req.body;
  if (!name || !base_url || !api_key || !model) return res.status(400).json({ error: "name, base_url, api_key, and model are required" });
  const { data, error } = await supabaseAdmin.from("providers").insert({ user_id: userId, name, base_url, api_key, model, temperature: temperature || 0.7, max_tokens: max_tokens || 4096, is_active: false }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.put("/api/providers/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin) return res.status(500).json({ error: "Database not configured" });
  const { name, base_url, api_key, model, temperature, max_tokens, is_active } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (base_url !== undefined) updates.base_url = base_url;
  if (api_key !== undefined) updates.api_key = api_key;
  if (model !== undefined) updates.model = model;
  if (temperature !== undefined) updates.temperature = temperature;
  if (max_tokens !== undefined) updates.max_tokens = max_tokens;
  if (is_active !== undefined) {
    if (is_active) await supabaseAdmin.from("providers").update({ is_active: false }).eq("user_id", userId).neq("id", req.params.id);
    updates.is_active = is_active;
  }
  const { data, error } = await supabaseAdmin.from("providers").update(updates).eq("id", req.params.id).eq("user_id", userId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.delete("/api/providers/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin) return res.status(500).json({ error: "Database not configured" });
  const { error } = await supabaseAdmin.from("providers").delete().eq("id", req.params.id).eq("user_id", userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.post("/api/providers/test", async (req, res) => {
  const { base_url, api_key, model } = req.body;
  if (!base_url || !api_key || !model) return res.status(400).json({ error: "base_url, api_key, and model required" });
  const result = await callLLM({ base_url, api_key, model }, [{ role: "user", content: "Reply with just: OK" }]);
  if (result) return res.json({ success: true });
  res.json({ error: "Connection failed" });
});

app.get("/api/ping", (_req, res) => res.json({ ok: true, vercel: !!process.env.VERCEL, node: process.version }));

app.get("/api/debug/load", (_req, res) => {
  res.json({ multer: typeof multer, openai: typeof OpenAI, supabase: !!supabaseAdmin, cwd: process.cwd() });
});

app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(process.cwd(), "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));

export default app;
