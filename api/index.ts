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
const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const JOBS_PATH = path.join(DATA_DIR, "jobs.json");

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

app.get("/api/ping", (_req, res) => res.json({ ok: true, cwd: process.cwd(), vercel: !!process.env.VERCEL, node: process.version }));

app.get("/api/debug/load", (_req, res) => {
  res.json({
    multer: typeof multer,
    openai: typeof OpenAI,
    supabase: typeof supabaseAdmin,
    cwd: process.cwd(),
    hasFs: typeof fs,
  });
});

app.use(express.static(path.join(process.cwd(), "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));

export default app;
