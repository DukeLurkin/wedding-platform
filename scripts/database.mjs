import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { parseArgs } from "node:util";
import { neon } from "@neondatabase/serverless";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "env-file": { type: "string" },
    apply: { type: "boolean", default: false },
  },
});
const command = positionals[0] ?? "check";
const migrationsDirectory = new URL("../db/migrations/", import.meta.url);
const expectedTables = [
  "event_invitations", "events", "guest_sessions", "guests",
  "invitation_parties", "plus_one_responses", "rsvp_responses", "rsvp_rate_limits",
];

async function main() {
  if (!["check", "migrate", "verify"].includes(command)) {
    throw new Error("Use check, migrate, or verify. Migrations also require --apply.");
  }
  if (command === "migrate" && !values.apply) {
    throw new Error("No changes made. Add --apply to explicitly apply pending migrations.");
  }
  const envFile = values["env-file"] ?? ".env.development.local";
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("[SENSITIVE]") || connectionString.includes("PASTE_NEON_CONNECTION_STRING_HERE")) {
    throw new Error(`DATABASE_URL is missing or redacted in ${envFile}. Save a real Neon connection string there locally; never commit it.`);
  }
  // Keep credentials out of error output, even when URL parsing or Neon fails.
  let connectionUrl;
  try {
    connectionUrl = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection URL.");
  }
  if (!["postgres:", "postgresql:"].includes(connectionUrl.protocol) || !connectionUrl.hostname.endsWith(".neon.tech")) {
    throw new Error("Expected a Neon PostgreSQL connection URL. No changes made.");
  }
  const sql = neon(connectionString, { fetchOptions: { signal: AbortSignal.timeout(30_000) } });
  await sql`SELECT 1 AS connected`;
  console.log("Connected to Neon PostgreSQL. No credentials are shown.");

  if (command === "migrate") {
    await sql.transaction([
      sql`CREATE SCHEMA IF NOT EXISTS wedding`,
      sql`REVOKE ALL ON SCHEMA wedding FROM PUBLIC`,
      sql`CREATE TABLE IF NOT EXISTS wedding.schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )`,
    ]);
    const applied = await sql`SELECT name, checksum FROM wedding.schema_migrations`;
    const files = (await readdir(migrationsDirectory)).filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
    for (const name of files) {
      const source = await readFile(new URL(name, migrationsDirectory), "utf8");
      const checksum = createHash("sha256").update(source.replace(/\r\n/g, "\n")).digest("hex");
      const prior = applied.find((entry) => entry.name === name);
      if (prior) {
        if (prior.checksum !== checksum) throw new Error(`Applied migration ${name} has changed. Restore it and add a new migration instead.`);
        console.log(`Already applied: ${name}`);
        continue;
      }
      const statements = source.split(/^-- statement-breakpoint\s*$/m).map((statement) => statement.trim()).filter(Boolean);
      await sql.transaction([
        ...statements.map((statement) => sql.query(statement)),
        sql`INSERT INTO wedding.schema_migrations (name, checksum) VALUES (${name}, ${checksum})`,
      ]);
      console.log(`Applied: ${name}`);
    }
  }

  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'wedding' AND table_type = 'BASE TABLE' ORDER BY table_name`;
  const missing = expectedTables.filter((name) => !tables.some((table) => table.table_name === name));
  if (missing.length) {
    throw new Error(`Connection works; RSVP tables still needed: ${missing.join(", ")}. Run db:migrate when ready.`);
  }
  console.log(`Verified all ${expectedTables.length} RSVP tables.`);
  const events = await sql`SELECT event_date::text, to_char(rsvp_closes_at AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI:SS') AS closes_local, meals_selected_at_event FROM wedding.events WHERE slug = 'wedding-2027'`;
  if (events.length !== 1 || events[0].event_date !== "2027-04-11" || !events[0].meals_selected_at_event || events[0].closes_local !== "2027-02-12 00:00:00") {
    throw new Error("Wedding event settings differ from the expected date, RSVP cutoff, or meal policy. No settings were overwritten.");
  }
  console.log("Verified wedding date, February 11 RSVP deadline (Philadelphia time), and meals chosen at the event.");

  if (command === "verify") {
    const [before] = await sql`SELECT count(*)::text AS count FROM wedding.invitation_parties`;
    const source = await readFile(new URL("../db/tests/rsvp-constraints.sql", import.meta.url), "utf8");
    let rolledBack = false;
    try {
      await sql.transaction([sql.query(source)]);
    } catch (error) {
      if (error?.code !== "P0001" || error.message !== "RSVP_SCHEMA_VERIFICATION_ROLLBACK") {
        throw new Error("A database constraint check failed. Fixture writes were rolled back; no provider details are printed.");
      }
      rolledBack = true;
    }
    if (!rolledBack) throw new Error("Verification did not reach its required rollback marker.");
    const [after] = await sql`SELECT count(*)::text AS count FROM wedding.invitation_parties`;
    if (before.count !== after.count) throw new Error("Invitation count changed during verification. Investigate concurrent writes before continuing.");
    console.log("Passed 8 database constraint checks. All verification fixtures were rolled back.");
  }
}

main().catch((error) => {
  // Never log provider error objects: they may contain URLs or private SQL data.
  console.error(error?.name === "Error" ? error.message : "Database operation failed. Check connectivity and the locally saved credentials.");
  process.exitCode = 1;
});
