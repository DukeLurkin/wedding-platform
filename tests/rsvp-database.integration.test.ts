import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { neon } from "@neondatabase/serverless";
import { hashCode, hashSession, loadRsvp, logoutRsvp, lookupRsvp, RsvpError, saveRsvp } from "../src/server/rsvp";
import type { RsvpConfig } from "../src/server/rsvp";

test("database RSVP access and persistence", { timeout: 120_000 }, async (t) => {
  process.loadEnvFile(".env.database.local");
  assert.ok(process.env.DATABASE_URL, "Save the local Neon credential first");
  const sql = neon(process.env.DATABASE_URL!);
  const config: RsvpConfig = {
    connectionString: process.env.DATABASE_URL!, hashSecret: randomBytes(32).toString("hex"),
    mode: "database-preview", eventSlug: `integration-${randomUUID()}`,
  };
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const guestIds = [randomUUID(), randomUUID(), randomUUID()];
  const eventId = randomUUID();
  const invitationIds = [randomUUID(), randomUUID(), randomUUID()];
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes = ids.map(() => Array.from(randomBytes(12), (byte) => alphabet[byte & 31]).join(""));
  const ip = `integration-${randomUUID()}`;
  const rateKeys = new Set<string>();
  const tokens: string[] = [];
  const digestLimit = (key: string) => createHmac("sha256", config.hashSecret).update(`limit:${key}`).digest("hex");
  async function login(index: number, mode = config.mode, name = "Verification") {
    rateKeys.add(`lookup-ip:${ip}`); rateKeys.add(`lookup-code:${codes[index]}`);
    const result = await lookupRsvp({ ...config, mode }, codes[index], name, ip);
    tokens.push(result.token); rateKeys.add(`save:${hashSession(result.token)}:${ip}`);
    return result;
  }
  const rejectsCode = (code: string) => (error: unknown) => error instanceof RsvpError && error.code === code;
  const response = (guestId: string, attending: boolean, extra: unknown = null) => ({
    guestId, attending, dietary: attending ? "Sample dietary note" : "", plusOne: extra,
  });
  let tokenA = "";
  let tokenB = "";
  try {
    await sql`INSERT INTO wedding.events(id, slug, name, event_date, venue_name, venue_address, rsvp_closes_at)
      VALUES (${eventId}, ${config.eventSlug}, 'Isolated integration fixture', '2027-04-11', 'Test venue', 'Test address', now() + interval '1 day')`;
    for (let i = 0; i < ids.length; i++) {
      await sql.transaction([
        sql`INSERT INTO wedding.invitation_parties(id, display_name, invitation_code_hash, is_test)
          VALUES (${ids[i]}, 'Integration fixture', ${hashCode(codes[i], config.hashSecret)}, ${i !== 2})`,
        sql`INSERT INTO wedding.guests(id, invitation_party_id, first_name, last_name)
          VALUES (${guestIds[i]}, ${ids[i]}, 'Fixture', 'Verification')`,
        sql`INSERT INTO wedding.event_invitations(id, guest_id, event_id, allows_plus_one)
          VALUES (${invitationIds[i]}, ${guestIds[i]}, ${eventId}, ${i === 0})`,
      ]);
    }

    await t.test("code and last name are both required; failures do not reveal guests", async () => {
      await assert.rejects(login(0, "database-preview", "Wrong"), rejectsCode("NOT_FOUND"));
      const found = await login(0);
      tokenA = found.token;
      assert.equal(found.party.guests.length, 1);
      assert.equal(found.party.hasResponse, false);
      assert.equal(found.party.guests[0].id, guestIds[0]);
      tokenB = (await login(1)).token;
    });

    await t.test("test and real invitations are isolated by mode", async () => {
      await assert.rejects(login(2), rejectsCode("NOT_FOUND"));
      await assert.rejects(login(0, "live"), rejectsCode("NOT_FOUND"));
      await assert.rejects(loadRsvp({ ...config, mode: "live" }, tokenA), rejectsCode("SESSION_EXPIRED"));
    });

    await t.test("save and reload persist attendance, plus-one, and dietary notes", async () => {
      const saved = await saveRsvp(config, tokenA, {
        revision: 0, responses: [response(guestIds[0], true, { attending: true, name: "Alex Demo", dietary: "Vegetarian" })],
      }, ip);
      assert.equal(saved.revision, 1);
      const loaded = await loadRsvp(config, tokenA);
      assert.equal(loaded.hasResponse, true);
      assert.equal(loaded.guests[0].response?.dietary, "Sample dietary note");
      assert.equal(loaded.guests[0].plusOne?.name, "Alex Demo");
    });

    await t.test("a session cannot write another invitation's guests", async () => {
      await assert.rejects(saveRsvp(config, tokenA, { revision: 1, responses: [response(guestIds[1], false)] }, ip), rejectsCode("VALIDATION"));
      assert.equal((await loadRsvp(config, tokenB)).hasResponse, false);
    });

    await t.test("plus-one permissions are checked on the server", async () => {
      await assert.rejects(saveRsvp(config, tokenB, {
        revision: 0, responses: [response(guestIds[1], true, { attending: true, name: "Uninvited Demo", dietary: "" })],
      }, ip), rejectsCode("VALIDATION"));
    });

    await t.test("all invited guests must appear exactly once", async () => {
      await assert.rejects(saveRsvp(config, tokenA, {
        revision: 1, responses: [response(guestIds[0], false), response(guestIds[0], false)],
      }, ip), rejectsCode("VALIDATION"));
    });

    await t.test("declining clears the saved plus-one and dietary notes", async () => {
      const saved = await saveRsvp(config, tokenA, { revision: 1, responses: [response(guestIds[0], false)] }, ip);
      assert.equal(saved.revision, 2);
      assert.deepEqual(saved.guests[0].response, { attending: false, dietary: "" });
      assert.equal(saved.guests[0].plusOne, null);
      const [count] = await sql`SELECT count(*)::int AS count FROM wedding.rsvp_responses WHERE event_invitation_id = ${invitationIds[0]}`;
      assert.equal(count.count, 1);
    });

    await t.test("stale revisions cannot overwrite newer saved responses", async () => {
      await assert.rejects(saveRsvp(config, tokenA, { revision: 1, responses: [response(guestIds[0], false)] }, ip), rejectsCode("CONFLICT"));
      assert.equal((await loadRsvp(config, tokenA)).revision, 2);
    });

    await t.test("deadline is enforced by the database-backed server", async () => {
      await sql`UPDATE wedding.events SET rsvp_closes_at = now() - interval '1 second' WHERE id = ${eventId}`;
      assert.equal((await loadRsvp(config, tokenA)).closed, true);
      await assert.rejects(saveRsvp(config, tokenA, { revision: 2, responses: [response(guestIds[0], false)] }, ip), rejectsCode("CLOSED"));
      await sql`UPDATE wedding.events SET rsvp_closes_at = now() + interval '1 day' WHERE id = ${eventId}`;
    });

    await t.test("simultaneous submissions serialize; only one can use a revision", async () => {
      const input = { revision: 2, responses: [response(guestIds[0], false)] };
      const results = await Promise.allSettled([saveRsvp(config, tokenA, input, ip), saveRsvp(config, tokenA, input, ip)]);
      assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
      const rejected = results.find((result) => result.status === "rejected");
      assert.ok(rejected?.status === "rejected" && rejectsCode("CONFLICT")(rejected.reason));
      assert.equal((await loadRsvp(config, tokenA)).revision, 3);
    });

    await t.test("session tokens are hashed and logout revokes access", async () => {
      const result = await login(1);
      const [stored] = await sql`SELECT token_hash FROM wedding.guest_sessions WHERE token_hash = ${hashSession(result.token)}`;
      assert.notEqual(stored.token_hash, result.token);
      await logoutRsvp(config, result.token);
      await assert.rejects(loadRsvp(config, result.token), rejectsCode("SESSION_EXPIRED"));
    });

    await t.test("expired sessions cannot load or save", async () => {
      const result = await login(1);
      await sql`UPDATE wedding.guest_sessions SET created_at = now() - interval '2 days', expires_at = now() - interval '1 day' WHERE token_hash = ${hashSession(result.token)}`;
      await assert.rejects(loadRsvp(config, result.token), rejectsCode("SESSION_EXPIRED"));
      await assert.rejects(saveRsvp(config, result.token, { revision: 0, responses: [response(guestIds[1], false)] }, ip), rejectsCode("SESSION_EXPIRED"));
    });

    await t.test("lookup rate limits persist across connections", async () => {
      const blockedIp = `integration-limit-${randomUUID()}`;
      rateKeys.add(`lookup-ip:${blockedIp}`); rateKeys.add(`lookup-code:${codes[1]}`);
      await sql`INSERT INTO wedding.rsvp_rate_limits(bucket_hash, attempts, resets_at)
        VALUES (${digestLimit(`lookup-ip:${blockedIp}`)}, 14, now() + interval '15 minutes')`;
      await assert.rejects(lookupRsvp(config, codes[1], "Wrong", blockedIp), rejectsCode("NOT_FOUND"));
      await assert.rejects(lookupRsvp(config, codes[1], "Verification", blockedIp), rejectsCode("RATE_LIMITED"));
    });
  } finally {
    // Delete only fixtures identified by the random IDs created in this test run.
    await sql.transaction([
      sql`DELETE FROM wedding.plus_one_responses WHERE event_invitation_id = ANY(${invitationIds}::uuid[])`,
      sql`DELETE FROM wedding.rsvp_responses WHERE event_invitation_id = ANY(${invitationIds}::uuid[])`,
      sql`DELETE FROM wedding.event_invitations WHERE id = ANY(${invitationIds}::uuid[])`,
      sql`DELETE FROM wedding.guest_sessions WHERE invitation_party_id = ANY(${ids}::uuid[])`,
      sql`DELETE FROM wedding.guests WHERE id = ANY(${guestIds}::uuid[])`,
      sql`DELETE FROM wedding.invitation_parties WHERE id = ANY(${ids}::uuid[])`,
      sql`DELETE FROM wedding.events WHERE id = ${eventId}`,
      sql`DELETE FROM wedding.rsvp_rate_limits WHERE bucket_hash = ANY(${[...rateKeys].map(digestLimit)}::text[])`,
    ]);
  }
});
