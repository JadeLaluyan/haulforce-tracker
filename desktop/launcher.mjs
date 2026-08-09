/**
 * Haulforce launcher: starts the embedded database and the app server,
 * then opens the browser. Closing this window stops everything.
 */
import { spawn, exec } from "node:child_process";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { APP_DIR, DATA_DIR, loadConfig, dbUrl, startPg } from "./common.mjs";

const cfg = loadConfig();
if (!cfg) {
  console.error("Not installed yet. Run install.bat first.");
  process.exit(1);
}

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: "postgres",
  password: cfg.dbPassword,
  port: cfg.dbPort,
  persistent: true,
});

let app = null;
let shuttingDown = false;

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\nStopping Haulforce...");
  if (app && !app.killed) app.kill();
  try {
    await pg.stop();
  } catch {
    /* already stopped */
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  console.log("Starting database...");
  await startPg(pg, cfg.dbPort);

  console.log("Starting Haulforce Advanced Tracker...");
  const nextBin = join(APP_DIR, "node_modules", "next", "dist", "bin", "next");
  app = spawn(
    process.execPath,
    [nextBin, "start", "-p", String(cfg.appPort)],
    {
      cwd: APP_DIR,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATABASE_URL: dbUrl(cfg),
        AUTH_SECRET: cfg.authSecret,
      },
    }
  );
  app.on("exit", (code) => shutdown(code ?? 0));

  // Give the server a moment, then open the browser.
  setTimeout(() => {
    const url = `http://localhost:${cfg.appPort}`;
    if (process.platform === "win32") {
      // Open as a standalone app window (no browser chrome); falls back to default browser.
      exec(`start msedge --app=${url}`, (err) => {
        if (err) exec(`start "" "${url}"`);
      });
    } else {
      exec(process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`);
    }
    console.log(`\nHaulforce is running at ${url}`);
    console.log("Keep this window open. Close it (or press Ctrl+C) to stop the app.");
  }, 3500);
} catch (e) {
  console.error("LAUNCH FAILED:", e?.message ?? e);
  await shutdown(1);
}
