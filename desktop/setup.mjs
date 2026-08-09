/**
 * First-run setup: initialise the embedded PostgreSQL cluster, apply
 * migrations, and create the admin login. Safe to re-run (skips existing).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import {
  APP_DIR,
  DATA_DIR,
  APP_PORT,
  DB_PORT,
  appRequire,
  loadConfig,
  saveConfig,
  randomSecret,
  dbUrl,
  startPg,
} from "./common.mjs";

const { Client } = appRequire("pg");
const bcrypt = appRequire("bcryptjs");

async function main() {
  let cfg = loadConfig();
  const firstRun = !cfg;
  if (!cfg) {
    cfg = {
      appPort: APP_PORT,
      dbPort: DB_PORT,
      dbPassword: randomSecret(24),
      authSecret: randomSecret(48),
    };
    // Persist immediately so a failed first run can resume with the same credentials.
    saveConfig(cfg);
  }

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: "postgres",
    password: cfg.dbPassword,
    port: cfg.dbPort,
    persistent: true,
  });

  if (!existsSync(join(DATA_DIR, "PG_VERSION"))) {
    console.log("Initialising database cluster...");
    await pg.initialise();
  }
  await startPg(pg, cfg.dbPort);
  try {
    try {
      console.log("Creating database...");
      await pg.createDatabase("haulforce");
    } catch (e) {
      if (!String(e?.message ?? e).includes("already exists")) throw e;
      console.log("Database already exists - keeping it.");
    }

    const client = new Client(dbUrl(cfg));
    await client.connect();

    // Apply migrations in order (tracked in a simple table).
    await client.query(
      `CREATE TABLE IF NOT EXISTS "_hf_migrations" (name TEXT PRIMARY KEY, applied_at TIMESTAMP DEFAULT now())`
    );
    const applied = new Set(
      (await client.query(`SELECT name FROM "_hf_migrations"`)).rows.map((r) => r.name)
    );
    const migDir = join(APP_DIR, "prisma", "migrations");
    const dirs = readdirSync(migDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const dir of dirs) {
      if (applied.has(dir)) continue;
      const sql = readFileSync(join(migDir, dir, "migration.sql"), "utf8");
      console.log(`Applying migration ${dir}...`);
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO "_hf_migrations" (name) VALUES ($1)`, [dir]);
      await client.query("COMMIT");
    }

    // Admin user
    const existing = await client.query(`SELECT id FROM "User" LIMIT 1`);
    if (existing.rowCount === 0) {
      const email = (process.env.HF_ADMIN_EMAIL || "admin@haulforce.ph").trim();
      const password = (process.env.HF_ADMIN_PASSWORD || "admin123").trim();
      console.log("Hashing password...");
      const hash = await bcrypt.hash(password, 10);
      console.log("Creating admin row...");
      await client.query(
        `INSERT INTO "User" (id, email, "passwordHash", name, role) VALUES ($1, $2, $3, $4, 'MANAGER')`,
        ["usr_" + randomSecret(20), email.toLowerCase(), hash, "Administrator"]
      );
      console.log(`Admin account created: ${email}`);
    } else {
      console.log("Admin account already exists - keeping it.");
    }

    await client.end();
    console.log(firstRun ? "Setup complete." : "Setup re-checked. All good.");
  } finally {
    await pg.stop();
  }
}

main().catch((e) => {
  console.error("SETUP FAILED:", e?.message ?? e);
  process.exit(1);
});
