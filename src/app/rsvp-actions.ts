"use server";

import { cookies, headers } from "next/headers";
import { getRsvpConfig, loadRsvp, logoutRsvp, lookupRsvp, RsvpError, saveRsvp } from "@/server/rsvp";
import type { RsvpParty, RsvpResult } from "@/lib/rsvp-contract";

const sessionCookie = "wedding_rsvp";

function failure<T>(error: unknown): RsvpResult<T> {
  if (error instanceof RsvpError) return { ok: false, code: error.code, errors: error.errors };
  // Do not log provider errors, request payloads, credentials, or dietary data.
  console.error("Database RSVP request failed; private error details omitted.");
  return { ok: false, code: "UNAVAILABLE", errors: ["We couldn’t complete that request. Please try again. Your response is only confirmed after a successful save."] };
}

async function requestIp() {
  // Vercel overwrites its forwarding header. Ignore user-supplied headers locally.
  if (process.env.VERCEL !== "1") return "local-development";
  const values = await headers();
  return (values.get("x-forwarded-for") ?? "unknown").split(",")[0].trim().slice(0, 100);
}

export async function findRsvpAction(code: unknown, lastName: unknown): Promise<RsvpResult<RsvpParty>> {
  try {
    if (typeof code !== "string" || typeof lastName !== "string") {
      throw new RsvpError("VALIDATION", ["Please enter your invitation code and last name."]);
    }
    const config = getRsvpConfig();
    const jar = await cookies();
    const result = await lookupRsvp(config, code, lastName, await requestIp());
    const previous = jar.get(sessionCookie)?.value;
    if (previous) await logoutRsvp(config, previous);
    jar.set(sessionCookie, result.token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: 86400,
    });
    return { ok: true, value: result.party };
  } catch (error) { return failure(error); }
}

export async function loadRsvpAction(): Promise<RsvpResult<RsvpParty | null>> {
  try {
    const jar = await cookies();
    const token = jar.get(sessionCookie)?.value;
    if (!token) return { ok: true, value: null };
    return { ok: true, value: await loadRsvp(getRsvpConfig(), token) };
  } catch (error) {
    if (error instanceof RsvpError && error.code === "SESSION_EXPIRED") {
      (await cookies()).delete(sessionCookie);
      return { ok: true, value: null };
    }
    return failure(error);
  }
}

export async function saveRsvpAction(input: unknown): Promise<RsvpResult<RsvpParty>> {
  try {
    const token = (await cookies()).get(sessionCookie)?.value;
    if (!token) throw new RsvpError("SESSION_EXPIRED", ["Please enter your invitation code again before saving."]);
    const result = await saveRsvp(getRsvpConfig(), token, input, await requestIp());
    return { ok: true, value: result };
  } catch (error) { return failure(error); }
}

export async function leaveRsvpAction(): Promise<RsvpResult<null>> {
  try {
    const jar = await cookies();
    const token = jar.get(sessionCookie)?.value;
    if (token) await logoutRsvp(getRsvpConfig(), token);
    jar.delete(sessionCookie);
    return { ok: true, value: null };
  } catch (error) { return failure(error); }
}
