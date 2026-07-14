import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    val = val.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const UPLOAD_DIR = process.env.VERCEL ? path.join("/tmp", "uploads") : path.join(process.cwd(), "uploads");
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
try { if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}

const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
const ANALYSES_PATH = path.join(DATA_DIR, "analyses.json");
const JOBS_PATH = path.join(DATA_DIR, "jobs.json");

const defaultSettings = {
  baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
  model: process.env.AI_MODEL || "gpt-4o-mini",
  apiKey: process.env.AI_API_KEY || "",
  location: "",
  searxngUrl: "",
};

function initData() {
  try { if (!fs.existsSync(SETTINGS_PATH)) fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2)); } catch {}
  try { if (!fs.existsSync(ANALYSES_PATH)) fs.writeFileSync(ANALYSES_PATH, JSON.stringify({}, null, 2)); } catch {}
  try { if (!fs.existsSync(JOBS_PATH)) fs.writeFileSync(JOBS_PATH, JSON.stringify([], null, 2)); } catch {}
}
initData();

function getSettings() {
  try { if (fs.existsSync(SETTINGS_PATH)) return { ...defaultSettings, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8")) }; } catch {}
  return defaultSettings;
}

function getOpenAI(): OpenAI | null {
  const s = getSettings();
  if (!s.apiKey) return null;
  return new OpenAI({ baseURL: s.baseUrl, apiKey: s.apiKey });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

async function supabaseFetch(p: string, body?: any) {
  if (!supabaseUrl || !supabaseAnonKey) return { error: "Auth not configured" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${supabaseUrl}${p}`, {
      method: body ? "POST" : "GET",
      headers: { apikey: supabaseAnonKey, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const data = await res.json();
    return { data, error: res.ok ? null : data.error_description || data.msg || data.error || "Request failed" };
  } catch (e: any) {
    return { error: e.name === "AbortError" ? "Request timed out" : e.message || "Network error" };
  } finally { clearTimeout(timeout); }
}

const ALLOWED_MIMES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => cb(null, ALLOWED_MIMES.includes(file.mimetype)),
});

async function extractText(filePath: string, mimetype: string): Promise<string> {
  if (mimetype === "text/plain") return fs.readFileSync(filePath, "utf-8");
  if (mimetype === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfjs = await import("pdfjs-dist");
    const doc = await pdfjs.getDocument(new Uint8Array(dataBuffer)).promise;
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

async function callAI(prompt: string, systemPrompt?: string): Promise<string | null> {
  const openai = getOpenAI();
  if (!openai) return null;
  const settings = getSettings();
  try {
    const response = await openai.chat.completions.create({
      model: settings.model,
      messages: systemPrompt ? [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }] : [{ role: "user", content: prompt }],
      temperature: 0.7, max_tokens: 4096,
    });
    return response.choices[0]?.message?.content || null;
  } catch { return null; }
}

function extractJSON(text: string): any {
  if (!text?.trim()) return null;
  try { return JSON.parse(text.trim()); } catch {}
  const noBlocks = text.replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(noBlocks); } catch {}
  const fb = text.indexOf("{"), lb = text.lastIndexOf("}");
  if (fb !== -1 && lb > fb) try { return JSON.parse(text.substring(fb, lb + 1)); } catch {}
  return null;
}

const skillsTaxonomy = [
  "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
  "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "FastAPI",
  "Flask", "Spring Boot", "Next.js", "Tailwind CSS", "Bootstrap",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Elasticsearch",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git",
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
  "TensorFlow", "PyTorch", "Scikit-learn", "Data Analysis", "SQL",
  "REST APIs", "GraphQL", "WebSockets", "Microservices",
  "Agile", "Scrum", "Project Management", "Leadership",
  "Communication", "Problem Solving", "Teamwork",
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

const SEARXNG_INSTANCES = ["https://searx.be", "https://search.sapti.me", "https://searx.space", "https://northboot.xyz"];

async function searchWeb(query: string): Promise<any[]> {
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

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

function getAuthToken(req: any): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

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

app.post("/api/cv/upload", upload.single("file"), async (req, res) => {
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
      `Analyze this CV and return a JSON object with: - atsScore (0-100) - missingSkills (array of missing important skills) - weakAreas (array of weak points in the CV) - suggestions (array of improvement suggestions) - strengths (array of strong points)\n\nCV:\n"""${text}"""`,
      "You are an ATS (Applicant Tracking System) expert. Return ONLY valid JSON."
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
      `Rewrite this CV to be ATS-friendly and more impactful: 1. Add strong action verbs 2. Improve structure and readability 3. Inject relevant keywords naturally 4. Add quantifiable achievements where possible 5. Keep it professional and concise (max 600 words)\n\nOriginal CV:\n"""${text}"""\n\nReturn ONLY the rewritten CV text, no explanations.`,
      "You are a professional resume writer and ATS optimization expert."
    );
    if (aiResult) return res.json({ success: true, optimizedText: aiResult });
    const lines = text.split("\n");
    const header = lines[0] || "PROFESSIONAL CV";
    const improved = [
      header.toUpperCase(), "", "PROFESSIONAL SUMMARY",
      "Results-driven professional with proven expertise in delivering high-impact solutions. Adept at driving organizational growth through strategic planning, technical excellence, and cross-functional collaboration.",
      "", "CORE COMPETENCIES",
      "- Strategic Planning & Execution", "- Cross-functional Team Leadership",
      "- Process Optimization & Efficiency", "- Stakeholder Management",
      "- Data-driven Decision Making",
      "", ...lines.slice(1).map((l: string) => l.trim()).filter(Boolean).map((l: string) => {
        if (l.startsWith("-") || l.startsWith("*") || /^\d/.test(l)) return l;
        if (l.length > 80) return l;
        return l;
      }),
    ].join("\n");
    res.json({ success: true, optimizedText: improved });
  } catch { res.status(500).json({ error: "Failed to improve CV" }); }
});

app.post("/api/cv/suggest", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "CV text is required" });
  const aiResult = await callAI(
    `Analyze this CV and return a JSON object with ONLY: - suggestedRole (string): the most likely job title/role - suggestedSkills (array of strings): top 5-8 key skills - suggestedLocations (array of strings): 3-4 suitable job locations including user's current location if detectable, plus "Remote"\n\nCV:\n"""${text.slice(0, 3000)}"""`,
    "You are a career analyst. Return ONLY valid JSON."
  );
  if (aiResult) { const parsed = extractJSON(aiResult); if (parsed?.suggestedRole) return res.json({ success: true, data: parsed }); }
  const lower = text.toLowerCase();
  const found = skillsTaxonomy.filter((s) => lower.includes(s.toLowerCase()));
  res.json({ success: true, data: { suggestedRole: found[0] ? `${found[0]} Developer` : "Software Engineer", suggestedSkills: found.slice(0, 6), suggestedLocations: ["Remote", "United States", "United Kingdom", "Germany"] } });
});

async function generateSearchQuery(role: string, skills: string, location: string, cvText?: string): Promise<string> {
  const locPart = location?.trim() || "Remote";
  if (cvText?.trim().length > 50) {
    const aiQuery = await callAI(
      `Generate a concise job search query (max 12 words) including the location "${locPart}". - Extract the target job role from the CV - Include key skills mentioned - MUST include the location: ${locPart} - Focus on what makes this candidate unique\n\nCV:\n"""${cvText.slice(0, 3000)}"""\n\nReturn ONLY the search query string, no explanations.`,
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
  const keywordScore = ["2025", "2026", "remote", "hybrid", "senior", "lead", "engineer", "developer"].filter((k) => combined.includes(k)).length * 5;
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
  { name: "Monster", domain: "monster.com", url: (q: string, loc: string) => `https://www.monster.com/jobs/search/?q=${q}&where=${loc}`, color: "#6D1B7B" },
  { name: "ZipRecruiter", domain: "ziprecruiter.com", url: (q: string, loc: string) => `https://www.ziprecruiter.com/candidate/search?search=${q}&location=${loc}`, color: "#5F63F5" },
  { name: "CareerBuilder", domain: "careerbuilder.com", url: (q: string, loc: string) => `https://www.careerbuilder.com/jobs?keywords=${q}&location=${loc}`, color: "#1F8AC0" },
  { name: "SimplyHired", domain: "simplyhired.com", url: (q: string, loc: string) => `https://www.simplyhired.com/search?q=${q}&l=${loc}`, color: "#E7762B" },
  { name: "Jooble", domain: "jooble.org", url: (q: string, loc: string) => `https://jooble.org/SearchResult?keyword=${q}&location=${loc}`, color: "#F0832B" },
  { name: "Adzuna", domain: "adzuna.com", url: (q: string, loc: string) => `https://www.adzuna.com/search?q=${q}&loc=${loc}`, color: "#00A3E0" },
  { name: "Trovit", domain: "trovit.com", url: (q: string, loc: string) => `https://www.trovit.com/jobs?what=${q}&where=${loc}`, color: "#3CB371" },
  { name: "Google Jobs", domain: "google.com", url: (q: string, loc: string) => `https://www.google.com/search?q=${q}+jobs+${loc}&ibp=htl;jobs`, color: "#4285F4" },
  { name: "Dice", domain: "dice.com", url: (q: string, loc: string) => `https://www.dice.com/jobs?q=${q}&location=${loc}`, color: "#FB5D5D" },
  { name: "Wellfound", domain: "wellfound.com", url: (q: string, loc: string) => `https://wellfound.com/jobs?q=${q}&location=${loc}`, color: "#0BDA51" },
  { name: "Upwork", domain: "upwork.com", url: (q: string, loc: string) => `https://www.upwork.com/search/jobs/?q=${q}`, color: "#6FDA44" },
  { name: "Freelancer", domain: "freelancer.com", url: (q: string, loc: string) => `https://www.freelancer.com/jobs/?keyword=${q}`, color: "#29B2FE" },
  { name: "Snagajob", domain: "snagajob.com", url: (q: string, loc: string) => `https://www.snagajob.com/search?q=${q}&location=${loc}`, color: "#F47321" },
  { name: "FlexJobs", domain: "flexjobs.com", url: (q: string, loc: string) => `https://www.flexjobs.com/search?search=${q}`, color: "#00A3E0" },
  { name: "The Muse", domain: "themuse.com", url: (q: string, loc: string) => `https://www.themuse.com/jobs/search?keyword=${q}&location=${loc}`, color: "#F25D5D" },
  { name: "Eurojobs", domain: "eurojobs.com", url: (q: string, loc: string) => `https://www.eurojobs.com/search.php?q=${q}&where=${loc}`, color: "#2E86C1" },
  { name: "Crunchboard", domain: "crunchboard.com", url: (q: string, loc: string) => `https://www.crunchboard.com/jobs?q=${q}`, color: "#744C9E" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function pickJobBoardLinks(role: string, location: string, count: number = 6) {
  const q = encodeURIComponent(role || "software engineer");
  const loc = encodeURIComponent(location || "Remote");
  return shuffleArray(JOB_BOARDS).slice(0, count).map((b) => ({ name: b.name, url: b.url(q, loc), color: b.color }));
}

function generateMockJobs(role: string, skills: string, location: string): any[] {
  const companies = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Spotify", "Shopify", "Stripe", "GitHub", "Atlassian", "Notion"];
  const locations = [location || "San Francisco, CA", "New York, NY", "Seattle, WA", location ? `${location} (Remote)` : "Austin, TX", "Remote (US)", "Remote (Global)", "London, UK", "Berlin, Germany"];
  return Array.from({ length: 6 }, (_, i) => {
    const matchScore = Math.min(95, 55 + Math.floor(Math.random() * 35));
    const company = companies[Math.floor(Math.random() * companies.length)];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const titles = [`${role}`, `Senior ${role}`, `${role} - ${company}`, `Lead ${role}`, `${role} II`, `Principal ${role}`];
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

app.post("/api/jobs/search", async (req, res) => {
  const { skills, role, location, cvText } = req.body;
  const loc = location?.trim() || "Remote";
  const rol = role?.trim() || "software engineer";
  try {
    const searchQuery = await generateSearchQuery(rol, skills || "", loc, cvText);
    const siteQueries = shuffleArray(JOB_BOARDS).slice(0, 3).map((b) => `site:${b.domain} ${searchQuery}`);
    const jobBoardQueries = [...siteQueries, searchQuery];
    let jobResults: any[] = [];
    for (const q of jobBoardQueries) { jobResults = await searchWeb(q); if (jobResults.length > 0) break; }

    const cvSummary = jobResults.length > 0 && cvText ? await callAI(
      `Summarize this CV's key skills, experience, and target role in 2-3 sentences (under 100 words):\n"""${cvText.slice(0, 3000)}"""`,
      "You are a career summary writer. Be concise."
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

async function supabaseData(p: string, token: string, options?: { method?: string; body?: any }) {
  if (!supabaseUrl || !supabaseAnonKey) return { error: "Auth not configured" };
  const method = (options?.method || "GET").toUpperCase();
  try {
    const res = await fetch(`${supabaseUrl}${p}`, {
      method,
      headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: ["POST", "PATCH", "PUT"].includes(method) && options?.body ? JSON.stringify(options.body) : undefined,
    });
    if (method === "DELETE") return { error: res.ok ? null : "Delete failed", status: res.status };
    const data = await res.json();
    return { data, error: res.ok ? null : "Request failed" };
  } catch (e: any) { return { error: e.message || "Network error" }; }
}

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

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof multer.MulterError || err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File too large. Max 10MB." });
  if (err) return res.status(400).json({ error: err.message || "Upload error" });
});

if (process.env.VERCEL) {
  app.use(express.static(path.join(process.cwd(), "dist")));
  app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
}

export default app;
