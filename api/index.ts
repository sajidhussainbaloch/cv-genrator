import express from "express";
import path from "path";
import multer from "multer";
import { UPLOAD_DIR } from "./lib/shared";
import { setupRoutes as setupAuth } from "./routes/auth";
import { setupRoutes as setupCv } from "./routes/cv";
import { setupRoutes as setupJobs } from "./routes/jobs";
import { setupRoutes as setupSettings } from "./routes/settings";
import { setupRoutes as setupHistory } from "./routes/history";
import providersRouter from "./routes/providers";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

setupAuth(app);
setupCv(app);
setupJobs(app);
setupSettings(app);
setupHistory(app);
app.use("/api/providers", providersRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err instanceof multer.MulterError || err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Max 10MB." });
  }
  if (err) return res.status(400).json({ error: err.message || "Upload error" });
});

if (process.env.VERCEL) {
  app.use(express.static(path.join(process.cwd(), "dist")));
  app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
}

export default app;
