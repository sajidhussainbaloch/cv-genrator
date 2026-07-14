import express from "express";

const app = express();

app.use(express.json());

app.get("/api/ping", (_req: any, res: any) => {
  res.json({ ok: true, cwd: process.cwd(), vercel: !!process.env.VERCEL, node: process.version });
});

app.get("/api/debug/env", (_req: any, res: any) => {
  res.json({
    cwd: process.cwd(),
    vercel: !!process.env.VERCEL,
    node: process.version,
    has_ai_key: !!process.env.AI_API_KEY,
    has_ai_url: !!process.env.AI_BASE_URL,
    has_ai_model: !!process.env.AI_MODEL,
    has_supabase_url: !!process.env.VITE_SUPABASE_URL,
  });
});

app.all("*", (_req: any, res: any) => {
  res.status(200).send("OK");
});

export default app;
