export interface AiSettings {
  baseUrl: string;
  model: string;
  apiKey: string;
  location: string;
  searxngUrl: string;
}

export interface CvAnalysis {
  atsScore: number;
  missingSkills: string[];
  weakAreas: string[];
  suggestions: string[];
  strengths: string[];
}

export interface BoardLink {
  name: string;
  url: string;
  color: string;
}

export type JobBoardLinks = BoardLink[];

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  matchPercentage: number;
  matchReasons: string[];
  isMock?: boolean;
  boardLinks?: JobBoardLinks;
}

export interface UploadResponse {
  success: boolean;
  text: string;
  filename: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data: CvAnalysis;
}

export interface ImproveResponse {
  success: boolean;
  optimizedText: string;
}

export interface JobSearchResponse {
  success: boolean;
  jobs: JobResult[];
  summary?: string;
}

export interface CvSuggest {
  suggestedRole: string;
  suggestedSkills: string[];
  suggestedLocations: string[];
}

export interface SuggestResponse {
  success: boolean;
  data: CvSuggest;
}

export interface CvHistoryEntry {
  id: string;
  user_id: string;
  filename: string;
  cv_text: string;
  analysis: CvAnalysis | null;
  optimized_text: string;
  job_role: string;
  job_skills: string;
  job_location: string;
  created_at: string;
}

export type AppStep = "upload" | "analyze" | "improve" | "jobs";
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface Provider {
  id: string;
  user_id: string;
  name: string;
  base_url: string;
  api_key: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  created_at: string;
}

export interface AgentStep {
  tool: string;
  status: "running" | "complete" | "error";
  message: string;
  result?: string;
}
