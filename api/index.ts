import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

try { fs.mkdirSync("/tmp/data", { recursive: true }); } catch {}
try { fs.mkdirSync("/tmp/uploads", { recursive: true }); } catch {}
try { fs.mkdirSync("/tmp/sessions", { recursive: true }); } catch {}

const DATA = "/tmp/data";
const UPLOADS = "/tmp/uploads";
const SESSIONS = "/tmp/sessions";
const SETTINGS_PATH = path.join(DATA, "settings.json");
const JOBS_PATH = path.join(DATA, "jobs.json");

const app = express();
app.use(express.json({ limit: "50mb" }));

const supabaseUrl_ = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey_ = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin_ = (supabaseUrl_ && serviceRoleKey_)
  ? createClient(supabaseUrl_, serviceRoleKey_, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

const defaultSettings = {
  baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
  model: process.env.AI_MODEL || "gpt-4o-mini",
  apiKey: process.env.AI_API_KEY || "",
  location: "",
  searxngUrl: "",
};
try { if (!fs.existsSync(SETTINGS_PATH)) fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2)); } catch {}
try { if (!fs.existsSync(JOBS_PATH)) fs.writeFileSync(JOBS_PATH, JSON.stringify([], null, 2)); } catch {}

function getSettings() {
  try { if (fs.existsSync(SETTINGS_PATH)) return { ...defaultSettings, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")) }; } catch {}
  return defaultSettings;
}

function getUserId(req: any): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const parts = auth.slice(7).split(".");
      if (parts.length === 3) return JSON.parse(Buffer.from(parts[1], "base64").toString()).sub || "00000000-0000-0000-0000-000000000000";
    } catch {}
  }
  return "00000000-0000-0000-0000-000000000000";
}

function getAuthToken(req: any): string | null {
  const a = req.headers.authorization;
  return a?.startsWith("Bearer ") ? a.slice(7) : null;
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

function getOpenAI(): OpenAI | null {
  const s = getSettings();
  return s.apiKey ? new OpenAI({ baseURL: s.baseUrl, apiKey: s.apiKey }) : null;
}

async function callAI(prompt: string, systemPrompt?: string): Promise<string | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const s = getSettings();
  try {
    const r = await openai.chat.completions.create({
      model: s.model,
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] : [{ role: "user", content: prompt }],
      temperature: 0.7, max_tokens: 4096,
    });
    return r.choices[0]?.message?.content || null;
  } catch { return null; }
}

function extractJSON(text: string): any {
  if (!text?.trim()) return null;
  try { return JSON.parse(text.trim()); } catch {}
  const nb = text.replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(nb); } catch {}
  const fb = text.indexOf("{"), lb = text.lastIndexOf("}");
  if (fb !== -1 && lb > fb) try { return JSON.parse(text.substring(fb, lb + 1)); } catch {}
  return null;
}

const skillsTaxonomy = [
  "Python","JavaScript","TypeScript","Java","C++","C#","Go","Rust",
  "React","Angular","Vue.js","Node.js","Express","Django","FastAPI",
  "Flask","Spring Boot","Next.js","Tailwind CSS","Bootstrap",
  "PostgreSQL","MySQL","MongoDB","Redis","SQLite","Elasticsearch",
  "Docker","Kubernetes","AWS","Azure","GCP","CI/CD","Git",
  "Machine Learning","Deep Learning","NLP","Computer Vision",
  "TensorFlow","PyTorch","Scikit-learn","Data Analysis","SQL",
  "REST APIs","GraphQL","WebSockets","Microservices",
  "Agile","Scrum","Project Management","Leadership",
  "Communication","Problem Solving","Teamwork",
];

function heuristicAnalyze(text: string) {
  const lower = text.toLowerCase();
  const foundSkills = skillsTaxonomy.filter((s) => lower.includes(s.toLowerCase()));
  const missingSkills = skillsTaxonomy.filter((s) => !lower.includes(s.toLowerCase())).slice(0, 5);
  const weak: string[] = [];
  const suggestions: string[] = [];
  const strengths: string[] = [];
  if (!lower.includes("experience") && !lower.includes("work history")) {
    weak.push("No experience section found");
    suggestions.push("Add a detailed work experience section with your roles and responsibilities");
  } else if (!/\d+/.test(text)) {
    weak.push("No quantified achievements in experience");
    suggestions.push("Add measurable results (e.g., 'Increased revenue by 30%')");
  }
  if (!lower.includes("education") && !lower.includes("university") && !lower.includes("degree")) {
    weak.push("No education section found");
    suggestions.push("Include your education background with degrees and institutions");
  }
  if (!lower.includes("project")) {
    weak.push("No projects section found");
    suggestions.push("Add key projects with technologies used and your contributions");
  }
  const wc = text.split(/\s+/).length;
  if (wc < 100) { weak.push("CV is too short (under 100 words)"); suggestions.push("Expand your CV with more details about your experience and skills"); }
  if (wc > 800) { weak.push("CV is too long (over 800 words)"); suggestions.push("Keep your CV concise — aim for 400-600 words"); }
  if (foundSkills.length === 0) { weak.push("No recognizable technical skills found"); suggestions.push("List your technical skills clearly with proficiency levels"); }
  if (foundSkills.length > 3) strengths.push(`Strong technical skill set: ${foundSkills.slice(0, 5).join(", ")}`);
  if (lower.includes("lead") || lower.includes("manag")) strengths.push("Demonstrates leadership and management experience");
  if (lower.includes("team")) strengths.push("Shows teamwork and collaboration experience");
  if (/\d+%|\d+x|\$\d+/.test(text)) strengths.push("Uses quantifiable achievements (great for ATS)");
  if (strengths.length === 0) strengths.push("CV has been submitted for analysis");
  if (weak.length === 0) strengths.push("Well-structured CV with all key sections");
  const atsScore = Math.min(100, Math.max(10, Math.max(0, 60 - weak.length * 10) + Math.min(30, foundSkills.length * 3) + Math.min(10, strengths.length * 3)));
  return { atsScore, missingSkills, weakAreas: weak, suggestions, strengths };
}

const ALLOWED_MIMES = ["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain"];
const upload = multer({ dest: UPLOADS, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (_req: any, _file: any, cb: any) => cb(null, ALLOWED_MIMES.includes(_file.mimetype)) });

async function extractText(filePath: string, mimetype: string): Promise<string> {
  if (mimetype === "text/plain") return fs.readFileSync(filePath, "utf-8");
  if (mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({ data: new Uint8Array(dataBuffer), useWorkerFetch: false, disableWorker: true, disableFontFace: true, isEvalSupported: false }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
  }
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: fs.readFileSync(filePath) });
    return result.value;
  }
  return "";
}

async function generateSearchQuery(role: string, skills: string, location: string, cvText?: string): Promise<string> {
  const locPart = location?.trim() || "Remote";
  const cv = cvText?.trim();
  if (cv && cv.length > 50) {
    const aiQuery = await callAI(
      `Generate a concise job search query (max 12 words) including the location "${locPart}". Extract the target job role from the CV, include key skills mentioned, MUST include location "${locPart}".\n\nCV:\n"""${cv.slice(0, 3000)}"""\n\nReturn ONLY the search query string.`,
      "You are a job search query optimizer. Output only the query."
    );
    if (aiQuery?.trim()) return `${aiQuery.trim()} ${locPart}`.trim();
  }
  return `${role || "software engineer"} ${skills || ""} ${locPart} job`.trim();
}

function scoreJobByContent(job: any, skills: string, cvText: string): number {
  const combined = ((job.title || "") + " " + (job.content || "")).toLowerCase();
  const skillList = skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const skillScore = skillList.length > 0 ? (skillList.filter((s) => combined.includes(s)).length / skillList.length) * 40 : 20;
  const keywordScore = ["2025","2026","remote","hybrid","senior","lead","engineer","developer"].filter((k) => combined.includes(k)).length * 5;
  if (cvText) {
    const cvWords = new Set(cvText.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const jobWords = new Set(combined.split(/\W+/).filter((w) => w.length > 3));
    let overlap = 0;
    cvWords.forEach((w) => { if (jobWords.has(w)) overlap++; });
    return Math.round(Math.min(98, skillScore + keywordScore + Math.min(30, (overlap / Math.max(cvWords.size, 1)) * 30) + 10));
  }
  return Math.round(Math.min(95, skillScore + keywordScore + 30));
}

function extractCompany(result: any): string {
  if (result.metadata?.source) return result.metadata.source;
  if (result.parsedUrl?.host) return result.parsedUrl.host.replace("www.", "").split(".")[0] || "Tech Company";
  return "Tech Company";
}

function estimateSalary(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("senior") || t.includes("lead") || t.includes("principal")) return "$130k - $180k";
  if (t.includes("mid") || t.includes("engineer")) return "$90k - $140k";
  if (t.includes("junior") || t.includes("entry")) return "$60k - $95k";
  return "$80k - $130k";
}

function generateMatchReasons(skills: string, score: number, job?: any): string[] {
  const reasons = ["Skills align with job requirements", "Experience level matches role", score > 80 ? "Strong overall fit" : "Relevant position"];
  const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
  if (skillList.length > 0) reasons.push(`Matching skills: ${skillList.slice(0, 3).join(", ")}`);
  if (job?.title) reasons.push(`Role: ${job.title}`);
  return reasons;
}

const JOB_BOARDS = [
  { name: "LinkedIn", domain: "linkedin.com/jobs", url: (q: string, loc: string) => `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`, color: "#0A66C2" },
  { name: "Indeed", domain: "indeed.com", url: (q: string, loc: string) => `https://www.indeed.com/jobs?q=${q}&l=${loc}`, color: "#2164F3" },
  { name: "Glassdoor", domain: "glassdoor.com", url: (q: string, loc: string) => `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}&locKeyword=${loc}`, color: "#0CAA41" },
  { name: "Google Jobs", domain: "google.com", url: (q: string, loc: string) => `https://www.google.com/search?q=${q}+jobs+${loc}&ibp=htl;jobs`, color: "#4285F4" },
];
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pickJobBoardLinks(role: string, location: string, count = 6) {
  const q = encodeURIComponent(role || "software engineer");
  const loc = encodeURIComponent(location || "Remote");
  return shuffleArray(JOB_BOARDS).slice(0, count).map((b) => ({ name: b.name, url: b.url(q, loc), color: b.color }));
}
function generateMockJobs(role: string, skills: string, location: string): any[] {
  const companies = ["Google","Microsoft","Amazon","Meta","Apple","Netflix","Spotify","Shopify","Stripe","GitHub","Atlassian","Notion"];
  const locations = [location || "San Francisco, CA","New York, NY","Seattle, WA",location ? `${location} (Remote)`:"Austin, TX","Remote (US)","Remote (Global)","London, UK","Berlin, Germany"];
  return Array.from({ length: 6 }, (_, i) => {
    const matchScore = Math.min(95, 55 + Math.floor(Math.random() * 35));
    const company = companies[Math.floor(Math.random() * companies.length)];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const titles = [`${role}`,`Senior ${role}`,`${role} - ${company}`,`Lead ${role}`,`${role} II`,`Principal ${role}`];
    const boardLinks = pickJobBoardLinks(titles[i % titles.length], loc, 6);
    return {
      id: `job_mock_${Date.now()}_${i}`, title: titles[i % titles.length], company, location: loc,
      salary: estimateSalary(titles[i % titles.length]),
      description: `${company} is seeking a talented ${titles[i % titles.length]} to join our team.`,
      url: boardLinks[0].url, matchPercentage: matchScore, matchReasons: generateMatchReasons(skills, matchScore),
      isMock: true, boardLinks,
    };
  });
}

const SEARXNG_INSTANCES = ["https://searx.be","https://search.sapti.me","https://searx.space","https://northboot.xyz"];

async function searchSearXNG(query: string): Promise<any[]> {
  const settings = getSettings();
  const instances = settings.searxngUrl?.trim() ? [settings.searxngUrl.trim(), ...SEARXNG_INSTANCES] : SEARXNG_INSTANCES;
  for (const instance of instances) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&language=en&categories=general`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { "User-Agent": "Mozilla/5.0" } });
      if (response.ok) { const data: any = await response.json(); if (data.results?.length > 0) return data.results; }
    } catch {}
  }
  return [];
}

async function searchDuckDuckGo(query: string): Promise<any[]> {
  try {
    const dds = await import("duck-duck-scrape");
    const results = await dds.search(query, { safeSearch: -1 });
    return (results.results || []).map((r: any) => ({
      title: r.title || "",
      content: r.description || r.snippet || "",
      url: r.url || "",
      metadata: { source: new URL(r.url || "").hostname.replace("www.", "") },
      parsedUrl: { host: new URL(r.url || "").hostname },
    }));
  } catch { return []; }
}

async function searchWeb(query: string): Promise<any[]> {
  let results = await searchSearXNG(query);
  if (results.length === 0) results = await searchDuckDuckGo(query);
  return results;
}

// ===== AGENT ENGINE =====

const sseClients = new Map<string, express.Response>();

function addSSEClient(sessionId: string, res: express.Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  sseClients.set(sessionId, res);
  const hb = setInterval(() => { try { res.write(":heartbeat\n\n"); } catch {} }, 30000);
  res.on("close", () => { clearInterval(hb); sseClients.delete(sessionId); });
}

function sendSSE(sessionId: string, event: string, data: unknown) {
  const client = sseClients.get(sessionId);
  if (client) {
    try {
      client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {}
  }
}

async function runAgent(cvText: string, provider: { base_url: string; api_key: string; model: string; temperature?: number; max_tokens?: number }, sessionId: string) {
  const context: any = { cvText, analysis: null, searchResults: [], matchedJobs: [] };

  const send = (tool: string, status: string, message: string, result?: string) => {
    sendSSE(sessionId, "step", { tool, status, message, result });
  };

  // Step 1: Analyze CV
  send("analyze_cv", "running", "Extracting skills and experience from your CV...");
  const analysisPrompt = `Extract the following from this CV as JSON. Return ONLY valid JSON:\n{\n  "skills": ["skill1", "skill2"],\n  "experience": [{"role": "str", "company": "str", "years": int}],\n  "education": [{"degree": "str", "field": "str"}],\n  "targetRole": "str",\n  "summary": "str"\n}\n\nCV:\n"""${cvText.slice(0, 4000)}"""`;
  const analysisRaw = await callLLM(provider, [{ role: "system", content: "You are a CV analyzer. Output ONLY valid JSON." }, { role: "user", content: analysisPrompt }]);
  const analysisParsed = analysisRaw ? extractJSON(analysisRaw) : null;
  context.analysis = analysisParsed || heuristicAnalyze(cvText);
  send("analyze_cv", "complete", "CV analyzed successfully", JSON.stringify(context.analysis));

  // Step 2: Generate search queries
  send("generate_queries", "running", "Generating job search queries based on your profile...");
  const role = context.analysis?.targetRole || "software engineer";
  const skills = (context.analysis?.skills || []).join(", ");
  const query = await generateSearchQuery(role, skills, getSettings().location, cvText);
  const queries = [query, `${role} jobs`, `${skills.split(",")[0]} developer jobs`].filter(Boolean);
  send("generate_queries", "complete", `Generated ${queries.length} search queries`, queries.join(", "));

  // Step 3: Search the web
  for (const q of queries.slice(0, 2)) {
    send("search_web", "running", `Searching: "${q}"...`);
    const results = await searchWeb(q);
    context.searchResults.push(...results.map((r: any) => ({ ...r, query: q })));
  }
  send("search_web", "complete", `Found ${context.searchResults.length} results from web search`);

  // Step 4: Match jobs
  send("match_jobs", "running", "Matching jobs to your skills and experience...");
  const jobResults = context.searchResults.slice(0, 10).map((r: any, i: number) => {
    const score = scoreJobByContent(r, skills, cvText);
    return {
      id: `job_${Date.now()}_${i}`, title: r.title || role, company: extractCompany(r),
      location: getSettings().location || r.metadata?.source || "Remote",
      salary: estimateSalary(r.title || ""), description: r.content || "",
      url: r.url || "#", matchPercentage: score, matchReasons: generateMatchReasons(skills, score, r),
      isMock: false,
    };
  });
  context.matchedJobs = jobResults.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);
  send("match_jobs", "complete", `Found ${context.matchedJobs.length} matching jobs`);

  // Step 5: Improve CV
  send("improve_cv", "running", "Generating CV improvement suggestions...");
  const improvePrompt = `Return a JSON object with:\n{\n  "strengths": ["str"],\n  "improvements": ["str"],\n  "keywordsToAdd": ["str"],\n  "atsScore": int\n}\n\nBased on this CV and the top job match requirements.\n\nCV: """${cvText.slice(0, 2000)}"""`;
  const improveRaw = await callLLM(provider, [{ role: "system", content: "You are a professional resume writer. Output ONLY valid JSON." }, { role: "user", content: improvePrompt }]);
  const improvement = improveRaw ? extractJSON(improveRaw) : heuristicAnalyze(cvText);
  send("improve_cv", "complete", "Improvement suggestions ready");

  sendSSE(sessionId, "complete", {
    analysis: context.analysis,
    jobs: context.matchedJobs,
    improvement,
    summary: {
      skillsFound: context.analysis?.skills?.length || 0,
      jobsFound: context.matchedJobs?.length || 0,
      topJob: context.matchedJobs?.[0]?.title || null,
    },
  });
}

// ===== PROVIDER ROUTES =====
app.get("/api/providers", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin_) return res.json({ success: true, data: [] });
  const { data, error } = await supabaseAdmin_.from("providers").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.post("/api/providers", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin_) return res.status(500).json({ error: "Database not configured" });
  const { name, base_url, api_key, model, temperature, max_tokens } = req.body;
  if (!name || !base_url || !api_key || !model) return res.status(400).json({ error: "name, base_url, api_key, and model are required" });
  const { data, error } = await supabaseAdmin_.from("providers").insert({ user_id: userId, name, base_url, api_key, model, temperature: temperature || 0.7, max_tokens: max_tokens || 4096, is_active: false }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.put("/api/providers/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin_) return res.status(500).json({ error: "Database not configured" });
  const { name, base_url, api_key, model, temperature, max_tokens, is_active } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (base_url !== undefined) updates.base_url = base_url;
  if (api_key !== undefined) updates.api_key = api_key;
  if (model !== undefined) updates.model = model;
  if (temperature !== undefined) updates.temperature = temperature;
  if (max_tokens !== undefined) updates.max_tokens = max_tokens;
  if (is_active !== undefined) {
    if (is_active) await supabaseAdmin_.from("providers").update({ is_active: false }).eq("user_id", userId).neq("id", req.params.id);
    updates.is_active = is_active;
  }
  const { data, error } = await supabaseAdmin_.from("providers").update(updates).eq("id", req.params.id).eq("user_id", userId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

app.delete("/api/providers/:id", async (req, res) => {
  const userId = getUserId(req);
  if (!supabaseAdmin_) return res.status(500).json({ error: "Database not configured" });
  const { error } = await supabaseAdmin_.from("providers").delete().eq("id", req.params.id).eq("user_id", userId);
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

// ===== AGENT ROUTES =====
app.post("/api/agent/prepare", async (req, res) => {
  const { cvText } = req.body;
  if (!cvText) return res.status(400).json({ error: "cvText required" });
  const sessionId = crypto.randomUUID();
  try {
    fs.writeFileSync(path.join(SESSIONS, `${sessionId}.json`), JSON.stringify({ cvText, createdAt: Date.now() }));
  } catch (e: any) { return res.status(500).json({ error: e.message }); }
  res.json({ success: true, sessionId });
});

app.get("/api/agent/run", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  let sessionData: any;
  try {
    sessionData = JSON.parse(fs.readFileSync(path.join(SESSIONS, `${sessionId}.json`), "utf-8"));
  } catch { return res.status(404).json({ error: "Session not found" }); }

  const providerId = req.query.provider as string;
  let provider: any = null;
  if (providerId && supabaseAdmin_) {
    const { data } = await supabaseAdmin_.from("providers").select("*").eq("id", providerId).single();
    if (data) provider = data;
  }
  if (!provider) {
    const s = getSettings();
    provider = { base_url: s.baseUrl, api_key: s.apiKey, model: s.model, temperature: 0.7, max_tokens: 4096 };
  }

  addSSEClient(sessionId, res);
  try {
    await runAgent(sessionData.cvText, provider, sessionId);
  } catch (e: any) {
    sendSSE(sessionId, "error", { error: e.message });
  } finally {
    sseClients.delete(sessionId);
    try { fs.unlinkSync(path.join(SESSIONS, `${sessionId}.json`)); } catch {}
    res.end();
  }
});

// ===== AUTH ROUTES =====
async function supabaseFetch(p: string, body?: any) {
  if (!supabaseUrl_ || !supabaseAnonKey_) return { error: "Auth not configured" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${supabaseUrl_}${p}`, {
      method: body ? "POST" : "GET",
      headers: { apikey: supabaseAnonKey_, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json();
    return { data, error: res.ok ? null : data.error_description || data.msg || data.error || "Request failed" };
  } catch (e: any) { return { error: e.name === "AbortError" ? "Request timed out" : e.message || "Network error" }; }
  finally { clearTimeout(timeout); }
}

async function supabaseData(p: string, token: string, options?: { method?: string; body?: any }) {
  if (!supabaseUrl_ || !supabaseAnonKey_) return { error: "Auth not configured" };
  const method = (options?.method || "GET").toUpperCase();
  try {
    const res = await fetch(`${supabaseUrl_}${p}`, {
      method,
      headers: { apikey: supabaseAnonKey_, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: ["POST","PATCH","PUT"].includes(method) && options?.body ? JSON.stringify(options.body) : undefined,
    });
    if (method === "DELETE") return { error: res.ok ? null : "Delete failed", status: res.status };
    const data = await res.json();
    return { data, error: res.ok ? null : "Request failed" };
  } catch (e: any) { return { error: e.message || "Network error" }; }
}

const supabaseAnonKey_ = process.env.VITE_SUPABASE_ANON_KEY || "";

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
  if (!token) return res.status(401).json({ error: "No token" });
  if (!supabaseUrl_ || !supabaseAnonKey_) return res.status(500).json({ error: "Auth not configured" });
  try {
    const resp = await fetch(`${supabaseUrl_}/auth/v1/user`, { headers: { apikey: supabaseAnonKey_, Authorization: `Bearer ${token}` } });
    const data = await resp.json();
    if (!resp.ok) return res.status(401).json({ error: data.msg || "Invalid token" });
    res.json({ success: true, user: data });
  } catch (e: any) { res.status(500).json({ error: e.message || "Network error" }); }
});

app.post("/api/auth/logout", (_req, res) => res.json({ success: true }));

// ===== CV ROUTES =====
app.post("/api/cv/upload", upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const text = await extractText(req.file.path, req.file.mimetype);
    res.json({ success: true, text, filename: req.file.originalname });
  } catch (err: any) { res.status(500).json({ error: err.message || "Failed to parse file" }); }
});

app.post("/api/cv/analyze", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "CV text is required" });
  try {
    const aiResult = await callAI(
      `Analyze this CV and return a JSON object with: atsScore (0-100), missingSkills (array), weakAreas (array), suggestions (array), strengths (array)\n\nCV:\n"""${text}"""`,
      "You are an ATS expert. Return ONLY valid JSON."
    );
    if (aiResult) { const parsed = extractJSON(aiResult); if (parsed?.atsScore) return res.json({ success: true, data: parsed }); }
    res.json({ success: true, data: heuristicAnalyze(text) });
  } catch { res.json({ success: true, data: heuristicAnalyze(text) }); }
});

app.post("/api/cv/improve", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "CV text is required" });
  try {
    const aiResult = await callAI(
      `Rewrite this CV to be ATS-friendly and more impactful: add strong action verbs, improve structure, inject relevant keywords, add quantifiable achievements, keep it professional (max 600 words)\n\nOriginal CV:\n"""${text}"""\n\nReturn ONLY the rewritten CV.`,
      "You are a professional resume writer and ATS optimization expert."
    );
    if (aiResult) return res.json({ success: true, optimizedText: aiResult });
    const lines = text.split("\n");
    const improved = [
      (lines[0] || "PROFESSIONAL CV").toUpperCase(), "",
      "PROFESSIONAL SUMMARY",
      "Results-driven professional with proven expertise in delivering high-impact solutions.",
      "", "CORE COMPETENCIES",
      "- Strategic Planning & Execution", "- Cross-functional Team Leadership",
      "- Process Optimization & Efficiency", "- Stakeholder Management",
      "- Data-driven Decision Making", "",
      ...lines.slice(1).map((l: string) => l.trim()).filter(Boolean),
    ].join("\n");
    res.json({ success: true, optimizedText: improved });
  } catch { res.status(500).json({ error: "Failed to improve CV" }); }
});

app.post("/api/cv/suggest", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "CV text is required" });
  const aiResult = await callAI(
    `Analyze this CV and return JSON with: suggestedRole (string), suggestedSkills (array of 5-8 strings), suggestedLocations (array of 3-4 strings including "Remote")\n\nCV:\n"""${text.slice(0, 3000)}"""`,
    "You are a career analyst. Return ONLY valid JSON."
  );
  if (aiResult) { const parsed = extractJSON(aiResult); if (parsed?.suggestedRole) return res.json({ success: true, data: parsed }); }
  res.json({ success: true, data: { suggestedRole: "Software Engineer", suggestedSkills: skillsTaxonomy.slice(0, 6), suggestedLocations: ["Remote","United States","United Kingdom","Germany"] } });
});

// ===== JOBS ROUTES =====
app.post("/api/jobs/search", async (req, res) => {
  const { skills, role, location, cvText } = req.body;
  const loc = location?.trim() || "Remote";
  const rol = role?.trim() || "software engineer";
  try {
    const searchQuery = await generateSearchQuery(rol, skills || "", loc, cvText);
    const siteQueries = shuffleArray(JOB_BOARDS).slice(0, 3).map((b: any) => `site:${b.domain} ${searchQuery}`);
    let jobResults: any[] = [];
    for (const q of [...siteQueries, searchQuery]) { jobResults = await searchWeb(q); if (jobResults.length > 0) break; }
    const cvSummary = jobResults.length > 0 && cvText ? await callAI(
      `Summarize this CV's key skills and target role in 2-3 sentences (under 100 words):\n"""${cvText.slice(0, 3000)}"""`,
      "You are a career summary writer."
    ) : null;
    const boardLinks = pickJobBoardLinks(rol, loc, 6);
    const matchedJobs = (jobResults.length > 0 ? jobResults.slice(0, 12) : generateMockJobs(rol, skills || "", loc))
      .map((result: any, idx: number) => {
        const isMock = !jobResults.length;
        const s = isMock ? result.matchPercentage : scoreJobByContent(result, skills || "", cvText || "");
        return {
          id: `job_${Date.now()}_${idx}`, title: result.title || `${rol}`,
          company: isMock ? result.company : extractCompany(result),
          location: isMock ? result.location : (result.metadata?.source || result.parsedUrl?.host || loc),
          salary: isMock ? result.salary : estimateSalary(result.title || ""),
          description: result.description || result.content || "",
          url: result.url || boardLinks[0]?.url || "#",
          matchPercentage: s, matchReasons: generateMatchReasons(skills || "", s, result),
          isMock, boardLinks,
        };
      });
    matchedJobs.sort((a: any, b: any) => b.matchPercentage - a.matchPercentage);
    try { fs.writeFileSync(JOBS_PATH, JSON.stringify(matchedJobs, null, 2)); } catch {}
    res.json({ success: true, jobs: matchedJobs, summary: cvSummary });
  } catch {
    const mockJobs = generateMockJobs(rol, skills || "", loc);
    try { fs.writeFileSync(JOBS_PATH, JSON.stringify(mockJobs, null, 2)); } catch {}
    res.json({ success: true, jobs: mockJobs, isMock: true });
  }
});

app.get("/api/jobs", (_req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(JOBS_PATH, "utf-8"))); } catch { res.json([]); }
});

// ===== SETTINGS ROUTES =====
app.get("/api/settings", (_req, res) => {
  const s = getSettings();
  res.json({ baseUrl: s.baseUrl, model: s.model, apiKey: s.apiKey, location: s.location || "", searxngUrl: s.searxngUrl || "" });
});

app.post("/api/settings", (req, res) => {
  const { baseUrl, model, apiKey, location, searxngUrl } = req.body;
  const current = getSettings();
  const updated = {
    baseUrl: baseUrl ?? current.baseUrl, model: model ?? current.model, apiKey: apiKey ?? current.apiKey,
    location: location ?? current.location, searxngUrl: searxngUrl ?? current.searxngUrl,
  };
  try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2)); } catch {}
  res.json({ success: true, settings: updated });
});

// ===== HISTORY ROUTES =====
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

// ===== DEBUG =====
app.get("/api/ping", (_req, res) => res.json({ ok: true, vercel: !!process.env.VERCEL, node: process.version }));
app.get("/api/debug/load", (_req, res) => {
  res.json({ multer: typeof multer, supabase: !!supabaseAdmin_, cwd: process.cwd() });
});
app.get("/api/debug/env", (_req, res) => {
  res.json({ supabaseUrl: supabaseUrl_?.slice(0, 20) + "...", hasAnonKey: !!supabaseAnonKey_, hasServiceKey: !!serviceRoleKey_, aiUrl: (process.env.AI_BASE_URL || "").slice(0, 20) + "..." });
});

// ===== STATIC =====
app.use("/uploads", express.static(UPLOADS));
app.use(express.static(path.join(process.cwd(), "dist")));
app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));

export default app;
