export type SavedResponse = { attending: boolean; dietary: string };
export type SavedPlusOne = SavedResponse & { name: string };
export type RsvpGuest = {
  id: string;
  name: string;
  allowsPlusOne: boolean;
  response: SavedResponse | null;
  plusOne: SavedPlusOne | null;
};
export type RsvpParty = {
  revision: number;
  deadline: string;
  closed: boolean;
  hasResponse: boolean;
  guests: RsvpGuest[];
};
export type RsvpSubmission = {
  revision: number;
  responses: { guestId: string; attending: boolean; dietary: string; plusOne: SavedPlusOne | null }[];
};
export type RsvpResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; errors: string[] };

export function normalizeInvitationCode(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export function normalizeLastName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validateRsvpSubmission(
  input: unknown,
  guests: Pick<RsvpGuest, "id" | "name" | "allowsPlusOne">[],
): { errors: string[]; value: RsvpSubmission | null } {
  if (!record(input) || !Number.isSafeInteger(input.revision) || Number(input.revision) < 0 ||
    !Array.isArray(input.responses) || input.responses.length !== guests.length || guests.length > 100) {
    return { errors: ["Please respond once for every guest on your invitation."], value: null };
  }
  const errors: string[] = [];
  const responses: RsvpSubmission["responses"] = [];
  const seen = new Set<string>();
  for (const response of input.responses) {
    if (!record(response) || typeof response.guestId !== "string" || seen.has(response.guestId)) {
      errors.push("Each invited guest must have exactly one response.");
      continue;
    }
    seen.add(response.guestId);
    const guest = guests.find((item) => item.id === response.guestId);
    if (!guest) {
      errors.push("A response does not belong to this invitation.");
      continue;
    }
    if (typeof response.attending !== "boolean") errors.push(`Please choose attendance for ${guest.name}.`);
    if (typeof response.dietary !== "string" || response.dietary.length > 500) {
      errors.push(`Please keep dietary notes for ${guest.name} within 500 characters.`);
    }
    let plusOne: SavedPlusOne | null = null;
    const extra = response.plusOne;
    if (!guest.allowsPlusOne && extra != null) {
      errors.push("This invitation does not permit that plus-one.");
    } else if (response.attending === false && extra != null) {
      errors.push("A plus-one can only attend with their invited guest.");
    } else if (guest.allowsPlusOne && response.attending === true) {
      if (!record(extra) || typeof extra.attending !== "boolean") {
        errors.push(`Please choose whether ${guest.name}’s invited plus-one will attend.`);
      } else if (typeof extra.name !== "string" || typeof extra.dietary !== "string" || extra.dietary.length > 500 || extra.name.length > 150) {
        errors.push("Please check your plus-one’s name and dietary notes.");
      } else if (extra.attending && !extra.name.trim()) {
        errors.push("Please enter your plus-one’s full name.");
      } else {
        plusOne = {
          attending: extra.attending,
          name: extra.attending ? extra.name.trim() : "",
          dietary: extra.attending ? extra.dietary.trim() : "",
        };
      }
    }
    responses.push({
      guestId: guest.id,
      attending: response.attending === true,
      dietary: response.attending === true && typeof response.dietary === "string" ? response.dietary.trim() : "",
      plusOne,
    });
  }
  return {
    errors,
    value: errors.length ? null : { revision: Number(input.revision), responses },
  };
}
