import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInvitationCode, normalizeLastName, validateRsvpSubmission } from "../src/lib/rsvp-contract.ts";

const guests = [
  { id: "a", name: "Avery Sample", allowsPlusOne: true },
  { id: "b", name: "Morgan Example", allowsPlusOne: false },
];
function valid() {
  return { revision: 0, responses: [
    { guestId: "a", attending: true, dietary: " Nuts ", plusOne: { attending: true, name: " Alex Demo ", dietary: " Vegetarian " } },
    { guestId: "b", attending: false, dietary: "", plusOne: null },
  ] };
}

test("normalizes human-entered codes and last names", () => {
  assert.equal(normalizeInvitationCode(" abcd-efgh jklm "), "ABCDEFGHJKLM");
  assert.equal(normalizeLastName("  De   Silva  "), "de silva");
});
test("canonicalizes valid responses without meal selection", () => {
  const result = validateRsvpSubmission(valid(), guests);
  assert.deepEqual(result.errors, []);
  assert.equal(result.value.responses[0].dietary, "Nuts");
  assert.equal(result.value.responses[0].plusOne.name, "Alex Demo");
});
test("rejects missing, duplicate, or foreign guests", () => {
  for (const ids of [["a"], ["a", "a"], ["a", "foreign"]]) {
    const value = valid();
    value.responses = ids.map((guestId) => ({ ...value.responses[0], guestId }));
    assert.equal(validateRsvpSubmission(value, guests).value, null);
  }
});
test("rejects string attendance and stale/unbounded revision formats", () => {
  const value = valid();
  value.responses[0].attending = "yes";
  assert.equal(validateRsvpSubmission(value, guests).value, null);
  for (const revision of [-1, 1.2, "0", Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validateRsvpSubmission({ ...valid(), revision }, guests).value, null);
  }
});
test("rejects unpermitted plus-ones and guests without an attending host", () => {
  const value = valid();
  value.responses[1].plusOne = value.responses[0].plusOne;
  assert.equal(validateRsvpSubmission(value, guests).value, null);
  const other = valid();
  other.responses[0].attending = false;
  assert.equal(validateRsvpSubmission(other, guests).value, null);
});
test("requires explicit plus-one attendance and a name when accepting", () => {
  for (const plusOne of [null, { attending: null, name: "", dietary: "" }, { attending: true, name: "   ", dietary: "" }]) {
    const value = valid();
    value.responses[0].plusOne = plusOne;
    assert.equal(validateRsvpSubmission(value, guests).value, null);
  }
});
test("bounds notes and plus-one names", () => {
  const value = valid();
  value.responses[0].dietary = "x".repeat(501);
  assert.equal(validateRsvpSubmission(value, guests).value, null);
  const other = valid();
  other.responses[0].plusOne.name = "x".repeat(151);
  assert.equal(validateRsvpSubmission(other, guests).value, null);
});
test("clears dietary and plus-one personal details when declining", () => {
  const value = valid();
  value.responses[0].attending = false;
  value.responses[0].plusOne = null;
  const result = validateRsvpSubmission(value, guests);
  assert.equal(result.value.responses[0].dietary, "");
  const other = valid();
  other.responses[0].plusOne.attending = false;
  const extra = validateRsvpSubmission(other, guests).value.responses[0].plusOne;
  assert.deepEqual(extra, { attending: false, name: "", dietary: "" });
});
