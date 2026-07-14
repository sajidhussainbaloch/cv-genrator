import { upload, extractText, callAI, extractJSON, heuristicAnalyze } from "../lib/shared";

export function setupRoutes(app: any) {
  app.post("/api/cv/upload", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      const text = await extractText(req.file.path, req.file.mimetype);
      res.json({ success: true, text, filename: req.file.originalname });
    } catch (err: any) { res.status(500).json({ error: err.message || "Failed to parse file" }); }
  });

  app.post("/api/cv/analyze", async (req: any, res: any) => {
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

  app.post("/api/cv/improve", async (req: any, res: any) => {
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

  app.post("/api/cv/suggest", async (req: any, res: any) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "CV text is required" });
    const aiResult = await callAI(
      `Analyze this CV and return a JSON object with ONLY: - suggestedRole (string): the most likely job title/role - suggestedSkills (array of strings): top 5-8 key skills - suggestedLocations (array of strings): 3-4 suitable job locations including user's current location if detectable, plus "Remote"\n\nCV:\n"""${text.slice(0, 3000)}"""`,
      "You are a career analyst. Return ONLY valid JSON."
    );
    if (aiResult) { const parsed = extractJSON(aiResult); if (parsed?.suggestedRole) return res.json({ success: true, data: parsed }); }
    const lower = text.toLowerCase();
    const found = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
      "React", "Angular", "Vue.js", "Node.js", "Express", "Django", "FastAPI",
      "Flask", "Spring Boot", "Next.js", "Tailwind CSS", "Bootstrap",
      "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Elasticsearch",
      "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git",
      "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
      "TensorFlow", "PyTorch", "Scikit-learn", "Data Analysis", "SQL",
      "REST APIs", "GraphQL", "WebSockets", "Microservices",
      "Agile", "Scrum", "Project Management", "Leadership",
      "Communication", "Problem Solving", "Teamwork",
    ].filter((s) => lower.includes(s.toLowerCase()));
    res.json({ success: true, data: { suggestedRole: found[0] ? `${found[0]} Developer` : "Software Engineer", suggestedSkills: found.slice(0, 6), suggestedLocations: ["Remote", "United States", "United Kingdom", "Germany"] } });
  });
}
