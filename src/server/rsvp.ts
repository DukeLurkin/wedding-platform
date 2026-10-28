import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { Pool } from "@neondatabase/serverless";
import type { PoolClient } from "@neondatabase/serverless";
import { normalizeInvitationCode, normalizeLastName, validateRsvpSubmission } from "@/lib/rsvp-contract";
import type { RsvpParty, RsvpGuest } from "@/lib/rsvp-contract";

export type RsvpConfig = {
  connectionString: string;
  hashSecret: string;
  mode: "database-preview" | "live";
  eventSlug: string;
};

export class RsvpError extends Error {
  constructor(public code: string, public errors: string[]) {
    super(errors[0]);
    this.name = "RsvpError";
  }
}

export function getRsvpMode() {
  const mode = process.env.RSVP_MODE;
  return mode === "database-preview" || mode === "live" ? mode : "preview";
}

export function getRsvpConfig(): RsvpConfig {
  const mode = getRsvpMode();
  const connectionString = process.env.DATABASE_URL;
  const hashSecret = process.env.RSVP_HASH_SECRET;
  if (mode === "preview" || !connectionString || connectionString.includes("[SENSITIVE]") || !hashSecret || hashSecret.length < 32) {
    throw new RsvpError("UNAVAILABLE", ["RSVP saving is not available yet. Please try again later."]);
  }
  return { connectionString, hashSecret, mode, eventSlug: "wedding-2027" };
}

export function hashCode(code: string, secret: string) {
  return createHmac("sha256", secret).update(`invitation:${normalizeInvitationCode(code)}`).digest("hex");
}

export function hashSession(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function withClient<T>(config: RsvpConfig, callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: config.connectionString, connectionTimeoutMillis: 10_000, query_timeout: 15_000, max: 1 });
  try {
    const client = await pool.connect();
    try { return await callback(client); } finally { client.release(); }
  } finally { await pool.end(); }
}

async function limit(client: PoolClient, config: RsvpConfig, key: string, maximum: number) {
  const bucket = createHmac("sha256", config.hashSecret).update(`limit:${key}`).digest("hex");
  const { rows } = await client.query<{ attempts: number }>(`
    INSERT INTO wedding.rsvp_rate_limits(bucket_hash, attempts, resets_at)
    VALUES ($1, 1, now() + interval '15 minutes')
    ON CONFLICT (bucket_hash) DO UPDATE SET
      attempts = CASE WHEN wedding.rsvp_rate_limits.resets_at <= now() THEN 1 ELSE wedding.rsvp_rate_limits.attempts + 1 END,
      resets_at = CASE WHEN wedding.rsvp_rate_limits.resets_at <= now() THEN now() + interval '15 minutes' ELSE wedding.rsvp_rate_limits.resets_at END
    RETURNING attempts`, [bucket]);
  if (rows[0].attempts > maximum) throw new RsvpError("RATE_LIMITED", ["Too many attempts. Please wait 15 minutes before trying again."]);
}

type PartyRow = { id: string; revision: number; event_id: string; deadline: string; closed: boolean };
type GuestRow = {
  guest_id: string; invitation_id: string; first_name: string; last_name: string;
  allows_plus_one: boolean; attending: boolean | null; dietary_restrictions: string | null;
  plus_attending: boolean | null; full_name: string | null; plus_dietary: string | null;
};

async function partyForSession(client: PoolClient, config: RsvpConfig, token: string, lock = false) {
  if (!/^[\w-]{43}$/.test(token)) throw new RsvpError("SESSION_EXPIRED", ["Please enter your invitation code again."]);
  const { rows } = await client.query<PartyRow>(`
    SELECT p.id, p.revision, e.id AS event_id,
      to_char((e.rsvp_closes_at AT TIME ZONE e.time_zone) - interval '1 day', 'FMMonth FMDD, YYYY') AS deadline,
      clock_timestamp() >= e.rsvp_closes_at AS closed
    FROM wedding.guest_sessions s
    JOIN wedding.invitation_parties p ON p.id = s.invitation_party_id
    JOIN wedding.events e ON e.slug = $2
    WHERE s.token_hash = $1 AND s.expires_at > clock_timestamp() AND s.revoked_at IS NULL
      AND p.access_revoked_at IS NULL AND p.is_test = $3
    ${lock ? "FOR UPDATE OF p" : ""}`,
  [hashSession(token), config.eventSlug, config.mode === "database-preview"]);
  if (!rows.length) throw new RsvpError("SESSION_EXPIRED", ["Your invitation session expired. Please enter your code again."]);
  return rows[0];
}

async function guestRows(client: PoolClient, party: PartyRow, lock = false) {
  // Lock invitation permissions during writes; separately read nullable response rows.
  if (lock) await client.query(`SELECT ei.id FROM wedding.event_invitations ei
    JOIN wedding.guests g ON g.id = ei.guest_id
    WHERE g.invitation_party_id = $1 AND ei.event_id = $2 ORDER BY ei.id FOR UPDATE OF ei`, [party.id, party.event_id]);
  const { rows } = await client.query<GuestRow>(`
    SELECT g.id AS guest_id, ei.id AS invitation_id, g.first_name, g.last_name, ei.allows_plus_one,
      r.attending, r.dietary_restrictions, x.attending AS plus_attending, x.full_name, x.dietary_restrictions AS plus_dietary
    FROM wedding.guests g JOIN wedding.event_invitations ei ON ei.guest_id = g.id AND ei.event_id = $2
    LEFT JOIN wedding.rsvp_responses r ON r.event_invitation_id = ei.id
    LEFT JOIN wedding.plus_one_responses x ON x.event_invitation_id = ei.id
    WHERE g.invitation_party_id = $1 ORDER BY g.created_at, g.id`, [party.id, party.event_id]);
  if (!rows.length || rows.length > 100) throw new RsvpError("UNAVAILABLE", ["Please contact us for help with this invitation."]);
  return rows;
}

function dto(party: PartyRow, rows: GuestRow[]): RsvpParty {
  return {
    revision: party.revision, deadline: party.deadline, closed: party.closed,
    hasResponse: rows.every((row) => row.attending !== null),
    guests: rows.map((row): RsvpGuest => ({
      id: row.guest_id, name: `${row.first_name} ${row.last_name}`, allowsPlusOne: row.allows_plus_one,
      response: row.attending === null ? null : { attending: row.attending, dietary: row.dietary_restrictions ?? "" },
      plusOne: row.plus_attending === null ? null : { attending: row.plus_attending, name: row.full_name ?? "", dietary: row.plus_dietary ?? "" },
    })),
  };
}

export async function lookupRsvp(config: RsvpConfig, code: string, lastName: string, ip: string) {
  return withClient(config, async (client) => {
    await limit(client, config, `lookup-ip:${ip}`, 15);
    const fail = () => new RsvpError("NOT_FOUND", ["We couldn’t find that invitation. Please check the code and last name."]);
    if (code.length > 40 || lastName.length > 100 || !/^[A-HJ-NP-Z2-9]{12}$/.test(normalizeInvitationCode(code)) || !lastName.trim()) throw fail();
    await limit(client, config, `lookup-code:${normalizeInvitationCode(code)}`, 15);
    const { rows } = await client.query<{ id: string; revision: number }>(`
      SELECT id, revision FROM wedding.invitation_parties
      WHERE invitation_code_hash = $1 AND is_test = $2 AND access_revoked_at IS NULL`,
    [hashCode(code, config.hashSecret), config.mode === "database-preview"]);
    if (!rows.length) throw fail();
    const { rows: names } = await client.query<{ last_name: string }>(`
      SELECT g.last_name FROM wedding.guests g
      JOIN wedding.event_invitations ei ON ei.guest_id = g.id
      JOIN wedding.events e ON e.id = ei.event_id AND e.slug = $2
      WHERE g.invitation_party_id = $1`, [rows[0].id, config.eventSlug]);
    if (!names.some((guest) => normalizeLastName(guest.last_name) === normalizeLastName(lastName))) throw fail();
    const token = randomBytes(32).toString("base64url");
    await client.query(`INSERT INTO wedding.guest_sessions(invitation_party_id, token_hash, expires_at)
      VALUES ($1, $2, clock_timestamp() + interval '24 hours')`, [rows[0].id, hashSession(token)]);
    const party = await partyForSession(client, config, token);
    return { token, party: dto(party, await guestRows(client, party)) };
  });
}

export async function loadRsvp(config: RsvpConfig, token: string) {
  return withClient(config, async (client) => {
    // A consistent snapshot avoids pairing a new revision with old responses.
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    try {
      const party = await partyForSession(client, config, token);
      const result = dto(party, await guestRows(client, party));
      await client.query("COMMIT");
      return result;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}

export async function saveRsvp(config: RsvpConfig, token: string, input: unknown, ip: string) {
  return withClient(config, async (client) => {
    await limit(client, config, `save:${hashSession(token)}:${ip}`, 30);
    await client.query("BEGIN");
    try {
      await client.query("SET LOCAL statement_timeout = '15s'");
      const party = await partyForSession(client, config, token, true);
      if (party.closed) throw new RsvpError("CLOSED", ["The RSVP deadline has passed. Please contact us to make a change."]);
      const rows = await guestRows(client, party, true);
      const validation = validateRsvpSubmission(input, dto(party, rows).guests);
      if (!validation.value) throw new RsvpError("VALIDATION", validation.errors);
      if (validation.value.revision !== party.revision) throw new RsvpError("CONFLICT", ["This invitation was updated in another tab. Reload the saved response before making more changes."]);
      for (const response of validation.value.responses) {
        const invitationId = rows.find((row) => row.guest_id === response.guestId)!.invitation_id;
        await client.query("DELETE FROM wedding.plus_one_responses WHERE event_invitation_id = $1", [invitationId]);
        await client.query(`INSERT INTO wedding.rsvp_responses(event_invitation_id, attending, dietary_restrictions)
          VALUES ($1, $2, $3) ON CONFLICT (event_invitation_id) DO UPDATE
          SET attending = EXCLUDED.attending, dietary_restrictions = EXCLUDED.dietary_restrictions`,
        [invitationId, response.attending, response.dietary]);
        if (response.plusOne) await client.query(`INSERT INTO wedding.plus_one_responses(event_invitation_id, attending, full_name, dietary_restrictions)
          VALUES ($1, $2, $3, $4)`, [invitationId, response.plusOne.attending, response.plusOne.name || null, response.plusOne.dietary]);
      }
      const { rows: updated } = await client.query<{ revision: number }>(`
        UPDATE wedding.invitation_parties p SET revision = revision + 1
        WHERE p.id = $1 AND p.access_revoked_at IS NULL AND p.is_test = $4
          AND EXISTS (SELECT 1 FROM wedding.guest_sessions s WHERE s.token_hash = $2
            AND s.invitation_party_id = p.id AND s.expires_at > clock_timestamp() AND s.revoked_at IS NULL)
          AND EXISTS (SELECT 1 FROM wedding.events e WHERE e.id = $3 AND clock_timestamp() < e.rsvp_closes_at)
        RETURNING revision`, [party.id, hashSession(token), party.event_id, config.mode === "database-preview"]);
      if (!updated.length) throw new RsvpError("EXPIRED", ["Your session or the RSVP deadline expired. Reload your invitation to continue."]);
      party.revision = updated[0].revision;
      const result = dto(party, await guestRows(client, party));
      await client.query("COMMIT");
      return result;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
  });
}

export async function logoutRsvp(config: RsvpConfig, token: string) {
  await withClient(config, async (client) => {
    await client.query("DELETE FROM wedding.guest_sessions WHERE token_hash = $1", [hashSession(token)]);
  });
}
