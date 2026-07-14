import fs from "fs";
import {
  generateSearchQuery, shuffleArray, JOB_BOARDS, searchWeb, callAI,
  pickJobBoardLinks, scoreJobByContent, extractCompany, estimateSalary,
  generateMatchReasons, generateMockJobs, JOBS_PATH,
} from "../lib/shared";

export function setupRoutes(app: any) {
  app.post("/api/jobs/search", async (req, res) => {
    const { skills, role, location, cvText } = req.body;
    const loc = location?.trim() || "Remote";
    const rol = role?.trim() || "software engineer";
    try {
      const searchQuery = await generateSearchQuery(rol, skills || "", loc, cvText);
      const siteQueries = shuffleArray(JOB_BOARDS).slice(0, 3).map((b: any) => `site:${b.domain} ${searchQuery}`);
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
}
