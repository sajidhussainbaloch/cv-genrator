# AI Career Agent Platform — Rebuild Plan

## Core Vision

Build an **AI Career Agent Platform** — not a CV app. A system where:
- User provides CV
- System acts like an agent
- It can search the web, analyze jobs, compare with CV, suggest improvements
- Adapt using custom AI models (provider system)

## Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                   Frontend                        │
│  React + Vite + Tailwind + Zustand               │
│  ┌──────────┬───────────────┬────────────────┐   │
│  │ Sidebar  │ Agent Console │ Results Panel  │   │
│  │ (History)│ (Live Steps)  │ (CV/Jobs)      │   │
│  └──────────┴───────────────┴────────────────┘   │
└──────────────────────┬───────────────────────────┘
                       │ SSE Stream
┌──────────────────────▼───────────────────────────┐
│                Backend (Node.js)                   │
│  ┌─────────────────────────────────────────────┐  │
│  │          Agent Engine (Core)                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ Tool     │ │ Agent    │ │ LLM        │  │  │
│  │  │ System   │ │ Loop     │ │ Provider   │  │  │
│  │  └──────────┘ └──────────┘ └────────────┘  │  │
│  └─────────────────────────────────────────────┘  │
│  ┌───────────┐ ┌────────────┐ ┌────────────────┐  │
│  │ DuckDuckGo│ │ Supabase   │ │ SSE Stream     │  │
│  │ Search    │ │ (DB/Auth)  │ │ Manager        │  │
│  └───────────┘ └────────────┘ └────────────────┘  │
└──────────────────────────────────────────────────┘
```

## High-Level Architecture

Think in modules (brick-by-brick):

```
Frontend (Web App)
        ↓
Backend API (Node.js / Express)
        ↓
Agent Engine (Core Brain)
        ↓
-----------------------------------
| CV Parser | Search Tool | LLM    |
-----------------------------------
        ↓
Database (Supabase)
```

## Core Modules

### 3.1 User System (Supabase)
- Supabase Auth (JWT)
- Supabase DB (PostgreSQL)
- Tables: users, cvs, job_results, search_history, providers

### 3.2 Provider System (Differentiator)
User can add any OpenAI-compatible provider:
- Base URL, API Key, Model ID, Temperature, Max Tokens, Context Window

Supports:
- OpenAI
- Local models (Ollama)
- Groq
- Any custom API

### 3.3 CV Processing Engine
Pipeline: Upload → Convert to text → Extract skills, experience, roles

### 3.4 Agent Engine (Core Brain)
Tool-based agent instead of simple function calls.

**Tools:**
- search_web(query)
- extract_jobs(html)
- analyze_cv(cv_data)
- match_jobs(cv, jobs)

**Agent Flow:**
User clicks "Analyze + Find Jobs"
→ Agent decides:
   Step 1: Extract CV data
   Step 2: Generate search query
   Step 3: Call web search tool
   Step 4: Parse results
   Step 5: Rank jobs
   Step 6: Return output

### 3.5 Real Web Search (Free)
**DuckDuckGo** via `duck-duck-scrape` npm package
- No API key needed
- No server to run
- Free, works anywhere

### 3.6 Model System
- Ollama for local models (LLaMA 3, Mistral, Mixtral)
- Provider system connects to any OpenAI-compatible API
- vLLM for faster inference

## Backend Design

### Key Endpoints
```
POST /api/providers        → Create provider
GET  /api/providers        → List providers
POST /api/agent/run        → Run career agent
GET  /api/agent/stream     → SSE stream for agent updates
POST /api/cv/upload        → Upload CV
POST /api/cv/analyze       → Analyze CV
POST /api/jobs/search      → Search jobs
GET  /api/cv/history       → Get history
```

## Frontend Design (Agent Console UI)

### UI Flow
```
Dashboard:
├── Left Panel → History / Navigation
├── Center → Agent Console (live execution)
│   ├── CV Upload
│   ├── Provider Selector
│   ├── "Run Career Agent" button
│   └── Execution Panel
│       ├── Step Viewer (animated steps)
│       │   ├── [✓] CV analyzed
│       │   ├── [⟳] Searching web...
│       │   └── [ ] Matching jobs
│       └── Results Panel
│           ├── Analysis Panel
│           ├── Job Results
│           └── CV Improvement
└── Right → Settings / Providers
```

### Real-Time Updates (SSE)
Use Server-Sent Events for live agent execution display:
- No extra library needed (raw Express SSE)
- `Content-Type: text/event-stream`
- Heartbeat every 30s
- Auto-reconnect via browser EventSource

## Phase 0: Foundation — Fix & Stabilize

**Goal:** Make the current app stable, fix bugs, add proper routing + state management.

### Tasks:

1. **Add react-router-dom v7**
   - Replace custom `history.pushState` router
   - Define routes: `/`, `/login`, `/signup`, `/dashboard`
   - Route guards for auth

2. **Add Zustand stores**
   - `useAuthStore` — session, login/logout/signup actions
   - `useCVStore` — cvText, analysis, optimizedText
   - `useUIStore` — activeStep, modals, sidebar state
   - `useJobStore` — jobs, search state
   - `useProviderStore` — AI providers list

3. **Fix all bugs**
   - Remove 2.5s fake delay in `Dashboard.tsx`
   - Fix TS errors in `generateSearchQuery` (api/index.ts:308,310)
   - Move SettingsPanel side-effect from render to `useEffect`
   - Add React error boundary component wrapping Dashboard
   - Delete unused `SUPABASE_DB_PASS` variable

4. **Restructure backend into modules**
   ```
   api/
     index.ts           → App setup, middleware
     routes/
       auth.ts          → /api/auth/*
       cv.ts            → /api/cv/*
       jobs.ts          → /api/jobs/*
       settings.ts      → /api/settings
       history.ts       → /api/cv/history
       providers.ts     → /api/providers (NEW)
       agent.ts         → /api/agent (NEW)
     lib/
       supabase.ts      → Admin Supabase client
       llm.ts           → Dynamic LLM client (NEW)
       sse.ts           → SSE stream manager (NEW)
     types/
       index.ts         → Shared types
   ```

5. **Full Supabase migration**
   - Tables: `providers`, `cvs`, `job_results`, `search_history` (besides existing `cv_history`)
   - Replace all `data/*.json` file reads/writes with Supabase queries
   - Add RLS policies for user isolation

## Phase 1: Provider System

**Goal:** Users can add any OpenAI-compatible provider (OpenAI, Ollama, Groq, local models).

### Backend:
```
POST   /api/providers          → Create provider
GET    /api/providers          → List user's providers
PUT    /api/providers/:id      → Update provider
DELETE /api/providers/:id      → Delete provider
POST   /api/providers/test     → Test connection
```

### Dynamic LLM Client (api/lib/llm.ts):
```typescript
async function callProvider(provider: Provider, messages: Message[]) {
  const res = await fetch(provider.base_url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${provider.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: provider.temperature,
      max_tokens: provider.max_tokens,
      stream: false,
    }),
  });
  return res.json();
}
```

### Frontend Components:
- **ProviderSelector.tsx** — Dropdown in header/sidebar to pick active provider
- **ProviderForm.tsx** — Modal form (name, base URL, API key, model, temperature, max tokens)
- **ProviderList.tsx** — List of saved providers with edit/delete/test buttons
- **SettingsPanel update** — Replace hardcoded single AI settings with provider selector

### Supabase `providers` table:
```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  model TEXT NOT NULL,
  temperature FLOAT DEFAULT 0.7,
  max_tokens INT DEFAULT 4096,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Phase 2: Agent Engine — The Core Brain

**Goal:** Build a tool-based agent that can reason, search web, analyze CVs, and match jobs.

### Tool System Architecture:
```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: unknown, context: AgentContext): Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  data: unknown;
  summary: string;
}

interface AgentStep {
  id: string;
  tool: string;
  input: unknown;
  output: ToolResult;
  startedAt: Date;
  finishedAt: Date;
}

interface AgentContext {
  userId: string;
  cvText: string;
  analysis: CvAnalysis | null;
  jobs: JobResult[];
  provider: Provider;
  history: AgentStep[];
}
```

### Tools to Build:
| Tool | Description | Source |
|------|-------------|--------|
| `extract_cv_text` | Parse PDF/DOCX/TXT | `pdfjs-dist`, `mammoth` |
| `analyze_cv` | Extract skills, experience, education | LLM call |
| `search_web` | Search jobs with query | `duck-duck-scrape` |
| `extract_jobs` | Parse search results | LLM + regex |
| `match_jobs` | Score jobs against CV | LLM + TF-IDF |
| `improve_cv` | Rewrite CV for target role | LLM call |
| `generate_queries` | Generate search queries | LLM call |

### Agent Loop:
```typescript
async function runAgent(context: AgentContext, sse: SSEStream) {
  const tools = getTools(context);
  sse.send("step", { tool: "agent", status: "started", message: "Starting career analysis..." });

  // Step 1: Analyze CV
  sse.send("step", { tool: "analyze_cv", status: "running", message: "Extracting skills from CV..." });
  const analysis = await runTool("analyze_cv", context);
  context.analysis = analysis.data;
  sse.send("step", { tool: "analyze_cv", status: "complete", result: analysis.summary });

  // Step 2: Generate search queries
  sse.send("step", { tool: "generate_queries", status: "running", message: "Generating job search queries..." });
  const queries = await runTool("generate_queries", context);
  context.queries = queries.data;
  sse.send("step", { tool: "generate_queries", status: "complete", result: queries.summary });

  // Step 3: Search web for each query
  for (const query of queries.data) {
    sse.send("step", { tool: "search_web", status: "running", message: `Searching: ${query}` });
    const results = await runTool("search_web", { query, context });
    context.searchResults.push(...results.data);
  }
  sse.send("step", { tool: "search_web", status: "complete", result: `Found ${context.searchResults.length} results` });

  // Step 4: Match & rank jobs
  sse.send("step", { tool: "match_jobs", status: "running", message: "Matching jobs to your profile..." });
  const matched = await runTool("match_jobs", context);
  sse.send("step", { tool: "match_jobs", status: "complete", result: `Found ${matched.data.length} matching jobs` });

  // Step 5: Final result
  sse.send("complete", { analysis: context.analysis, jobs: matched.data });
}
```

### SSE Streaming:
```typescript
const clients = new Map<string, Response>();

export function addClient(userId: string, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  clients.set(userId, res);
  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 30000);
  res.on("close", () => { clearInterval(heartbeat); clients.delete(userId); });
}

export function sendEvent(userId: string, event: string, data: unknown) {
  const client = clients.get(userId);
  if (client) {
    client.write(`event: ${event}\n`);
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
```

## Phase 3: Agent Console UI

**Goal:** Replace the static Dashboard with a live agent console.

### New Component Tree:
```
Dashboard
├── AppLayout
│   ├── Sidebar (clickable tabs: Agent, History, Providers, Settings)
│   └── Main Content
│       ├── AgentConsole
│       │   ├── CVUploader
│       │   ├── ProviderSelector
│       │   ├── "Run Career Agent" button
│       │   └── ExecutionPanel
│       │       ├── StepViewer (animated step list)
│       │       └── ResultPanel (analysis + jobs + improvement)
│       ├── HistoryView (tab)
│       ├── ProvidersView (tab)
│       └── SettingsView (tab)
```

### SSE Frontend Integration:
```typescript
export function useAgentStream() {
  const eventSource = useRef<EventSource | null>(null);
  
  const startAgent = useCallback(() => {
    const es = new EventSource(`/api/agent/run?session=${sessionId}`);
    es.addEventListener("step", (e) => {
      const step = JSON.parse(e.data);
      useAgentStore.getState().addStep(step);
    });
    es.addEventListener("complete", (e) => {
      const result = JSON.parse(e.data);
      useAgentStore.getState().setResult(result);
      es.close();
    });
    es.onerror = () => { /* reconnect logic */ };
    eventSource.current = es;
  }, []);
}
```

## Phase 4: CV Builder

**Goal:** Replace raw text display with a split-pane CV editor.

### Features:
- Split pane: Left = form fields, Right = live rendered preview
- Section management: Add/remove/reorder sections
- 3-5 templates: Classic, Modern, Minimal, ATS-Optimized
- Inline editing: Click on preview to edit text
- Drag & drop: Reorder experience entries and sections
- Export: Download as PDF (browser print or jsPDF)
- Auto-save: localStorage + Supabase on each change

### Components:
- `CVEditor.tsx` — Main split-pane container
- `FormPanel.tsx` — Left form with section fields
- `PreviewPanel.tsx` — Right rendered CV
- `SectionEditor.tsx` — Individual section editor
- `TemplateSelector.tsx` — Template picker
- `SectionReorder.tsx` — Drag & drop handler

## Phase 5: Advanced Features

### 5.1 Background Jobs (BullMQ + Redis)
- Agent runs in background via BullMQ queue
- User can close browser and come back later
- Status persisted in Supabase
- Real-time updates via SSE on reconnect

### 5.2 Auto Query Expansion
- Agent generates 3-5 search variations:
  - "Python Developer Karachi"
  - "Backend Engineer Pakistan"
  - "Django jobs remote"
- Merges, deduplicates, and ranks results

### 5.3 Embedding-Based Matching
- Use sentence-transformers (Python) or OpenAI embeddings
- Store CV and job embeddings in Supabase (pgvector)
- Semantic similarity scoring instead of keyword overlap

### 5.4 Application Tracker (Kanban)
```
Saved → Applied → Interview → Offer → Rejected
```
- Drag & drop between columns
- Notes per application
- Status change dates

### 5.5 Career Roadmap
- AI generates 1-5-10 year career plan
- Skills to acquire, roles to target, certifications

## File Structure (Final)

```
cv-genrator/
├── api/
│   ├── index.ts                   # Express app, middleware, static serving
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── cv.ts
│   │   ├── jobs.ts
│   │   ├── settings.ts
│   │   ├── history.ts
│   │   ├── providers.ts           # NEW
│   │   └── agent.ts               # NEW — agent execution + SSE
│   ├── lib/
│   │   ├── supabase.ts            # Admin client
│   │   ├── llm.ts                 # Dynamic LLM provider caller
│   │   ├── sse.ts                 # SSE stream manager
│   │   └── agent/
│   │       ├── types.ts           # Tool, AgentStep, AgentContext interfaces
│   │       ├── loop.ts            # Agent execution loop
│   │       ├── tools/
│   │       │   ├── web-search.ts  # DuckDuckGo
│   │       │   ├── cv-analyzer.ts
│   │       │   ├── job-matcher.ts
│   │       │   ├── cv-improver.ts
│   │       │   └── query-gen.ts
│   │       └── index.ts           # Tool registry
│   └── types/
│       └── index.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # react-router-dom setup
│   ├── routes/
│   │   └── index.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   └── AgentConsole.tsx       # NEW
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx        # Upgraded
│   │   │   └── Header.tsx
│   │   ├── agent/
│   │   │   ├── AgentConsole.tsx
│   │   │   ├── StepViewer.tsx
│   │   │   └── ResultPanel.tsx
│   │   ├── editor/
│   │   │   ├── CVEditor.tsx
│   │   │   ├── FormPanel.tsx
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── SectionEditor.tsx
│   │   │   └── TemplateSelector.tsx
│   │   ├── cv/                    # Existing + refactored
│   │   ├── jobs/                  # Existing + refactored
│   │   ├── providers/             # NEW
│   │   └── common/                # ErrorBoundary, etc.
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── cvStore.ts
│   │   ├── agentStore.ts          # NEW
│   │   ├── jobStore.ts
│   │   └── providerStore.ts       # NEW
│   ├── hooks/
│   │   └── useAgentStream.ts      # NEW — SSE hook
│   ├── lib/
│   │   ├── api.ts
│   │   └── supabase.ts
│   └── types/
│       └── index.ts
├── plans.md
├── vercel.json
├── package.json
└── .env
```

## Dependencies to Add

```
npm install react-router-dom zustand duck-duck-scrape
npm install @ai-sdk/openai ai          # For agent LLM calls (optional)
```

## Deployment Strategy

| Component | Host | Cost |
|-----------|------|------|
| Frontend | Vercel (free) | $0 |
| Backend | Vercel serverless (free tier) | $0 |
| Database | Supabase (free tier: 500MB, 50K rows) | $0 |
| Search | DuckDuckGo (no server) | $0 |
| LLM | BYO provider (user's own API key) | User-paid |
| Background jobs | Skip Redis initially (sync agent first) | $0 |

## What Makes This Different

| Feature | Current App | New App |
|---------|-------------|---------|
| ATS Score | Fake keyword check | AI-powered analysis + JD comparison |
| Job Search | Mock jobs | Real DuckDuckGo search |
| AI Provider | Hardcoded | Any OpenAI-compatible (Ollama, Groq, local) |
| Agent Loop | No | Full tool-based agent with reasoning |
| UI | Static pages | Live agent console with step-by-step |
| State | Random useState | Zustand stores + auto-save |
| Router | Custom hacks | react-router-dom |
| CV Editing | Raw text | Split-pane editor + templates |
| Data Storage | JSON files | Supabase PostgreSQL |
