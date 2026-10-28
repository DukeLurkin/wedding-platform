import { createHmac, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const environmentFile = new URL("../.env.development.local", import.meta.url);
const codesFile = new URL("../.env.rsvp-demo-codes.json", import.meta.url);
process.loadEnvFile(".env.database.local");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.includes("[SENSITIVE]")) {
  console.error("Save a usable DATABASE_URL in .env.database.local first.");
  process.exit(1);
}
const existing = existsSync(environmentFile) ? await readFile(environmentFile, "utf8") : "";
const priorSecret = existing.match(/^RSVP_HASH_SECRET="?([a-f0-9]{64})"?\s*$/m)?.[1];
const secret = priorSecret ?? randomBytes(32).toString("hex");
const priorCodes = existsSync(codesFile) ? JSON.parse(await readFile(codesFile, "utf8")) : [];
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  return Array.from(randomBytes(12), (byte) => alphabet[byte & 31]).join("").match(/.{4}/g).join("-");
}
const definitions = [
  { sourceKey: "rsvp-sample-single", label: "Sample guest with a plus-one", lastName: "Sample", names: ["Avery"], plusOne: true },
  { sourceKey: "rsvp-sample-pair", label: "Two named sample guests", lastName: "Example", names: ["Morgan", "Taylor"], plusOne: false },
];

async function main() {
  const sql = neon(databaseUrl);
  const manifest = [];
  for (const sample of definitions) {
    const previous = priorSecret && priorCodes.find((item) => item.sourceKey === sample.sourceKey);
    const code = previous?.code ?? newCode();
    const codeHash = createHmac("sha256", secret).update(`invitation:${code.replace(/-/g, "")}`).digest("hex");
    const partyId = randomBytes(16).toString("hex");
    // A source-key conflict can update only our existing test invitation, never a real invitation.
    const statements = [sql`INSERT INTO wedding.invitation_parties(id, display_name, invitation_code_hash, is_test, source_key)
      VALUES (${partyId}::uuid, ${sample.label}, ${codeHash}, true, ${sample.sourceKey})
      ON CONFLICT (source_key) DO UPDATE SET invitation_code_hash = EXCLUDED.invitation_code_hash
        WHERE wedding.invitation_parties.is_test = true`,
    ];
    if (!previous) statements.push(sql`DELETE FROM wedding.guest_sessions WHERE invitation_party_id IN
      (SELECT id FROM wedding.invitation_parties WHERE source_key = ${sample.sourceKey} AND is_test)`);
    for (const name of sample.names) {
      statements.push(sql`INSERT INTO wedding.guests(invitation_party_id, first_name, last_name)
        SELECT id, ${name}, ${sample.lastName} FROM wedding.invitation_parties p
        WHERE p.source_key = ${sample.sourceKey} AND p.is_test
          AND NOT EXISTS (SELECT 1 FROM wedding.guests g WHERE g.invitation_party_id = p.id AND g.first_name = ${name} AND g.last_name = ${sample.lastName})`);
      statements.push(sql`INSERT INTO wedding.event_invitations(guest_id, event_id, allows_plus_one)
        SELECT g.id, e.id, ${sample.plusOne} FROM wedding.guests g
        JOIN wedding.invitation_parties p ON p.id = g.invitation_party_id
        CROSS JOIN wedding.events e WHERE p.source_key = ${sample.sourceKey} AND p.is_test
          AND g.first_name = ${name} AND g.last_name = ${sample.lastName} AND e.slug = 'wedding-2027'
        ON CONFLICT (guest_id, event_id) DO NOTHING`);
    }
    await sql.transaction(statements);
    manifest.push({ sourceKey: sample.sourceKey, label: sample.label, code, lastName: sample.lastName });
  }
  // Preserve unrelated downloaded environment variables. These files are ignored by Git.
  const kept = existing.split(/\r?\n/).filter((line) => !/^(DATABASE_URL|RSVP_MODE|RSVP_HASH_SECRET)=/.test(line)).join("\n").trimEnd();
  await writeFile(environmentFile, `${kept}\nDATABASE_URL=${JSON.stringify(databaseUrl)}\nRSVP_HASH_SECRET="${secret}"\nRSVP_MODE="database-preview"\n`);
  await writeFile(codesFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("Database preview configured locally with 2 test invitations. Private codes are in .env.rsvp-demo-codes.json.");
  console.log("No real guest list was imported. Hosted environment settings were not changed.");
}

main().catch(() => {
  console.error("Sample setup failed. Check the connection and migration status. Private details are omitted.");
  process.exitCode = 1;
});
