import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync, writeFileSync, rmSync } from "node:fs";

export const DESKTOP_DIR = dirname(fileURLToPath(import.meta.url));
export const APP_DIR = join(DESKTOP_DIR, "..");
export const DATA_DIR = join(APP_DIR, "pgdata");
export const CONFIG_PATH = join(APP_DIR, "config.json");

export const appRequire = createRequire(join(APP_DIR, "package.json"));

export const APP_PORT = 3777;
export const DB_PORT = 5477;

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

export function saveConfig(cfg) {
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function randomSecret(len = 48) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function dbUrl(cfg) {
  return `postgresql://postgres:${cfg.dbPassword}@127.0.0.1:${cfg.dbPort}/haulforce`;
}

/**
 * Start the embedded cluster, self-healing stale lock files left behind by
 * crashes or forced shutdowns (common on desktop machines).
 */
export async function startPg(pg, port) {
  try {
    await pg.start();
  } catch {
    forceCleanLocks(port);
    try {
      await pg.stop();
    } catch {
      /* not running */
    }
    await pg.start();
  }
}

function forceCleanLocks(port) {
  const targets = [join(DATA_DIR, "postmaster.pid")];
  if (port && process.platform !== "win32") {
    targets.push("/tmp/.s.PGSQL." + port + ".lock", "/tmp/.s.PGSQL." + port);
  }
  for (const t of targets) {
    try {
      rmSync(t, { force: true });
    } catch {
      /* best effort */
    }
  }
}
