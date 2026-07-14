import app from "./api/index.js";
import { spawn } from "child_process";

function tryStartLocalSearXNG() {
  try {
    const proc = spawn("python", ["-m", "searxng", "--port", "8888", "--quiet"], { stdio: "ignore", detached: true });
    proc.unref();
    console.log("  -> Local SearXNG instance started at http://localhost:8888");
  } catch {
    console.log("  -> Using public SearXNG instances for web search");
  }
}

const PORT = 3000;

async function startServer() {
  console.log("CV Analysis Studio starting...");
  tryStartLocalSearXNG();
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: "spa" });
  app.use(vite.middlewares);
  app.listen(PORT, () => console.log(`  -> Ready at http://localhost:${PORT}`));
}

startServer();
