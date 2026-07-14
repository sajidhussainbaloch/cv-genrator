<div align="center">
  <br/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <br/><br/>
  <h1 align="center" style="border: none; margin: 0;">CV Analysis Studio</h1>
  <p align="center"><strong>AI-Powered Resume Optimization & Smart Job Matching</strong></p>
  <p align="center">
    Upload your CV → Get an instant ATS score → Improve with AI → Find matching jobs
  </p>
  <br/>
</div>

---

## Overview

**CV Analysis Studio** is a full-stack application that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS) and discover relevant job opportunities. It uses AI to analyze CV structure, suggests improvements, and searches live job boards — all within a single dashboard.

### Key Capabilities

| Feature | Description |
|---|---|
| **ATS Scoring** | AI-driven analysis with heuristic fallback — evaluates structure, keywords, and content quality |
| **Smart Improvement** | AI rewrite with action verbs, quantifiable achievements, and keyword optimization |
| **Job Discovery** | Searches 20+ job boards (LinkedIn, Indeed, Glassdoor, etc.) with role & location filtering |
| **CV History** | Per-user session persistence via Supabase — save, browse, and restore past analyses |
| **Multi-format Upload** | PDF, DOCX, and plain text CV parsing |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Vite 6 |
| **Backend** | Express.js, TypeScript (tsx), esbuild |
| **AI** | OpenAI-compatible API (works with OpenAI, Azure OpenAI, Ollama, etc.) |
| **Auth & Database** | Supabase (Authentication + Postgres) |
| **Job Search** | SearXNG meta-search engine with 20 job board targets |
| **Parsing** | pdfjs-dist (PDF), Mammoth.js (DOCX) |
| **Icons** | Lucide React |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                      │
│  React 19 + Tailwind + Vite                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Upload   │ │ Analyze  │ │ Improve  │ │  Jobs  │ │
│  │   Zone    │ │  Panel   │ │ Preview  │ │ Results│ │
│  └─────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│        └─────────────┴────────────┴────────────┘      │
│                        │                              │
│                  HTTP / JSON                           │
└────────────────────────┬──────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────┐
│                  Express Server                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │  CV API  │  │  Auth    │  │  Job     │  │Settings│ │
│  │ /api/cv  │  │ /api/auth│  │ /api/jobs│  │ /api  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┘ │
│       │             │             │                    │
│  ┌────▼────┐   ┌────▼────┐  ┌────▼────┐               │
│  │ OpenAI  │   │Supabase │  │SearXNG  │               │
│  │  API    │   │ REST    │  │ Instances│               │
│  └─────────┘   └─────────┘  └─────────┘               │
└────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (for auth + history)
- An OpenAI-compatible API key

### Installation

```bash
# Clone the repository
git clone https://github.com/sajidhussainbaloch/cv-genrator.git
cd cv-genrator

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Configuration

Edit `.env` with your credentials:

```env
# AI Provider (OpenAI / Azure OpenAI / Ollama)
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-...

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Setup

```bash
# Set your Supabase personal access token
export SUPABASE_SBP_TOKEN=sbp_...

# Create required tables
node scripts/setup-supabase.mjs
```

This creates the `profiles` and `cv_history` tables with Row Level Security.

### Development

```bash
npm run dev
```

Opens at `http://localhost:3000` — Vite HMR + Express backend run together.

### Production Build

```bash
npm run build
node dist/server.cjs
```

---

## Usage Guide

### 1. Upload Your CV

Drag and drop or select a PDF, DOCX, or TXT file. The server extracts text using pdfjs-dist or Mammoth.js.

### 2. Analyze for ATS

Click **Analyze CV** to get:
- **ATS Score** (0–100) based on structure, keywords, and content
- **Strengths** — what your CV does well
- **Weak Areas** — missing sections or content gaps
- **Suggestions** — actionable improvements
- **Role Suggestion** — AI predicts your target role and relevant skills

### 3. Improve with AI

Click **Make It Better** to generate an optimized version with:
- Strong action verbs
- Quantifiable achievements
- Keyword optimization for ATS
- Professional structure

### 4. Find Matching Jobs

Click **Find Jobs** to search 20+ job boards (LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, and more) with your skills, role, and location. Results show match percentage and direct links to search results on each board.

### 5. Save & Restore

Click **Save Session** to persist your analysis to Supabase. Use **History** to browse and restore past sessions.

---

## API Endpoints

### CV Operations

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/cv/upload` | Upload and parse a CV file |
| `POST` | `/api/cv/analyze` | Run ATS analysis on CV text |
| `POST` | `/api/cv/improve` | Generate optimized CV |
| `POST` | `/api/cv/suggest` | Suggest role, skills, and locations |

### Job Search

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/jobs/search` | Search jobs via SearXNG across 20+ boards |
| `GET` | `/api/jobs` | Retrieve last cached job results |

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account (email + password) |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | Sign out |

### History (authenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cv/history` | List saved CV sessions |
| `POST` | `/api/cv/history` | Save current session |
| `DELETE` | `/api/cv/history/:id` | Delete a session |

---

## Job Boards Supported

The system randomly selects 6 boards per search from a pool of 20:

LinkedIn · Indeed · Glassdoor · Monster · ZipRecruiter · CareerBuilder · SimplyHired · Jooble · Adzuna · Trovit · Google Jobs · Dice · Wellfound · Upwork · Freelancer · Snagajob · FlexJobs · The Muse · Eurojobs · Crunchboard

Each job card shows search links pre-filled with the role and location.

---

## Project Structure

```
cv-analysis-studio/
├── scripts/
│   └── setup-supabase.mjs       # Database migration script
├── src/
│   ├── components/
│   │   ├── AnalysisPanel.tsx     # ATS score & feedback display
│   │   ├── HistoryPanel.tsx      # Saved sessions browser
│   │   ├── ImprovedPreview.tsx   # Before/after CV diff
│   │   ├── JobCard.tsx           # Individual job result card
│   │   ├── JobResults.tsx        # Job search results grid
│   │   ├── SearchTerminal.tsx    # Real-time search progress
│   │   ├── SettingsPanel.tsx     # AI & location configuration
│   │   ├── UploadZone.tsx        # Drag-and-drop file upload
│   │   ├── WizardSteps.tsx       # Progress indicator
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── DashboardHeader.tsx   # Top bar with user info
│   ├── context/
│   │   └── AuthContext.tsx       # Supabase auth state
│   ├── lib/
│   │   └── supabase.ts           # Supabase client init
│   ├── pages/
│   │   ├── Dashboard.tsx         # Main workspace
│   │   ├── Landing.tsx           # Marketing landing page
│   │   ├── Login.tsx             # Sign-in form
│   │   └── Signup.tsx            # Registration form
│   ├── api.ts                    # Client-side API layer
│   ├── App.tsx                   # Root with custom router
│   ├── main.tsx                  # Entry point
│   └── types.ts                  # Shared TypeScript types
├── server.ts                     # Express backend (all routes)
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

---

## Why This Approach?

### AI + Heuristic Hybrid Analysis
The ATS analyzer uses OpenAI when available, but falls back to a keyword-based heuristic engine so the app works even without an API key configured.

### Real Job Search, Not Mock Data
Instead of fabricated job listings with dead URLs, the system generates real search links to 20 job boards — each pre-filled with your target role and location. You click and land on live search results.

### Per-User Persistence
All CV analyses are saved to Supabase with Row Level Security — your data is private to your account.

---

## License

[MIT](LICENSE)

---

<div align="center">
  <sub>Built with TypeScript, React, and ❤️</sub>
</div>
