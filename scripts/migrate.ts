/**
 * Database migration runner.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts                 # apply pending migrations
 *   npx tsx scripts/migrate.ts --status        # show migration status
 *
 * Requires DATABASE_URL env var:
 *   postgresql://postgres:[password]@[host]:5432/postgres
 *
 * Or the script will attempt to construct one from Supabase env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

const MIGRATIONS_DIR = path.join(import.meta.dirname, "..", "supabase", "migrations");

interface Migration {
  name: string;
  filePath: string;
}

function getMigrations(): Migration[] {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // 001_, 002_, etc.
  return files.map((f) => ({ name: f, filePath: path.join(MIGRATIONS_DIR, f) }));
}

function getConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // Try to construct from Supabase env vars
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set DATABASE_URL or (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) env vars.\n" +
      "DATABASE_URL format: postgresql://postgres:[password]@[host]:5432/postgres",
    );
  }

  // Extract project ref from Supabase URL: https://[ref].supabase.co
  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) throw new Error(`Cannot extract project ref from ${url}`);

  // Get DB password from service role key (Supabase encodes password in JWT, but we guess common patterns)
  // For safety, prefer DATABASE_URL env var
  throw new Error(
    "Cannot construct DATABASE_URL from Supabase vars. Please set DATABASE_URL directly.\n" +
    "Find it in Supabase Dashboard → Settings → Database → Connection string → URI\n" +
    `Project ref: ${ref}`,
  );
}

async function ensureTrackingTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client: Client): Promise<Set<string>> {
  await ensureTrackingTable(client);
  const { rows } = await client.query("SELECT name FROM public._migrations ORDER BY name");
  return new Set(rows.map((r: { name: string }) => r.name));
}

async function applyMigration(client: Client, migration: Migration): Promise<void> {
  const sql = fs.readFileSync(migration.filePath, "utf-8");
  const start = performance.now();
  await client.query(sql);
  await client.query("INSERT INTO public._migrations (name) VALUES ($1)", [migration.name]);
  const ms = (performance.now() - start).toFixed(0);
  console.log(`  ✓ ${migration.name} (${ms}ms)`);
}

async function main() {
  const command = process.argv.includes("--status") ? "status" : "migrate";
  const migrations = getMigrations();

  if (migrations.length === 0) {
    console.log("No migration files found.");
    process.exit(0);
  }

  console.log(`\nMigrations dir: ${MIGRATIONS_DIR}`);
  console.log(`Found ${migrations.length} migration(s)\n`);

  const connString = getConnectionString();
  const client = new Client({ connectionString: connString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    const applied = await getAppliedMigrations(client);

    if (command === "status") {
      for (const m of migrations) {
        const status = applied.has(m.name) ? "✓ applied" : "— pending";
        console.log(`  ${m.name.padEnd(50)} ${status}`);
      }
      return;
    }

    // Apply pending migrations
    let appliedCount = 0;
    for (const m of migrations) {
      if (applied.has(m.name)) {
        console.log(`  • ${m.name} (already applied)`);
        continue;
      }
      await applyMigration(client, m);
      appliedCount++;
    }

    console.log(`\n${appliedCount > 0 ? `Applied ${appliedCount} migration(s).` : "All migrations already applied."}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
