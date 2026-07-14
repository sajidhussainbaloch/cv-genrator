import type {
  UploadResponse,
  AnalyzeResponse,
  ImproveResponse,
  JobSearchResponse,
  AiSettings,
  SuggestResponse,
  CvHistoryEntry,
} from "./types";

export async function uploadCV(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/cv/upload", { method: "POST", body: formData });
  return res.json();
}

export async function analyzeCV(text: string): Promise<AnalyzeResponse> {
  const res = await fetch("/api/cv/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function improveCV(text: string): Promise<ImproveResponse> {
  const res = await fetch("/api/cv/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function searchJobs(
  skills: string,
  role: string,
  location?: string,
  cvText?: string
): Promise<JobSearchResponse> {
  const res = await fetch("/api/jobs/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skills, role, location, cvText }),
  });
  return res.json();
}

export async function suggestFromCV(text: string): Promise<SuggestResponse> {
  const res = await fetch("/api/cv/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function getSettings(): Promise<AiSettings> {
  const res = await fetch("/api/settings");
  return res.json();
}

export async function saveSettings(settings: AiSettings): Promise<{ success: boolean }> {
  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function authSignup(email: string, password: string, name: string) {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  return res.json();
}

export async function authLogin(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function authMe(token: string) {
  const res = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function authLogout() {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  return res.json();
}

export async function fetchHistory(): Promise<{ success: boolean; data: CvHistoryEntry[] }> {
  const res = await fetch("/api/cv/history");
  return res.json();
}

export async function saveHistory(data: {
  cv_text: string;
  filename?: string;
  analysis?: any;
  optimized_text?: string;
  job_role?: string;
  job_skills?: string;
  job_location?: string;
}): Promise<{ success: boolean; data?: CvHistoryEntry }> {
  const res = await fetch("/api/cv/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteHistory(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/cv/history/${id}`, { method: "DELETE" });
  return res.json();
}
