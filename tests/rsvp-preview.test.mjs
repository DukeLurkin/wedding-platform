import assert from "node:assert/strict";
import test from "node:test";

import {
  changeGuestAttendance,
  createPreviewDraft,
  findPreviewInvitation,
  previewInvitations,
  reviewPreviewDraft,
} from "../src/lib/rsvp-preview.ts";

const [single, pair] = previewInvitations;

test("lookup requires the code and matching last name, with forgiving spacing and case", () => {
  assert.equal(findPreviewInvitation(" demo 2027 ", " SAMPLE "), single);
  assert.equal(findPreviewInvitation("DEMO-2027", "Example"), undefined);
  assert.equal(findPreviewInvitation("INVALID", "Sample"), undefined);
  assert.equal(findPreviewInvitation("", ""), undefined);
});

test("every named guest needs an explicit attendance response", () => {
  const draft = createPreviewDraft(pair);
  draft.guests.morgan.attending = "yes";
  assert.deepEqual(reviewPreviewDraft(pair, draft).errors, [
    "Please choose attendance for Taylor Example.",
  ]);
});

test("an attending host must explicitly accept or decline their plus-one", () => {
  const draft = changeGuestAttendance(single, createPreviewDraft(single), "avery", "yes");
  assert.match(reviewPreviewDraft(single, draft).errors.join(" "), /bringing your invited plus-one/);
});

test("an attending plus-one needs a nonblank name", () => {
  const draft = changeGuestAttendance(single, createPreviewDraft(single), "avery", "yes");
  draft.plusOne = { attending: "yes", name: "   ", dietary: "" };
  assert.match(reviewPreviewDraft(single, draft).errors.join(" "), /full name/);
});

test("review trims attending guests' details and preserves optional dietary information", () => {
  const draft = changeGuestAttendance(single, createPreviewDraft(single), "avery", "yes");
  draft.guests.avery.dietary = "  Nut allergy  ";
  draft.plusOne = { attending: "yes", name: "  Alex Demo  ", dietary: " Vegetarian " };
  const result = reviewPreviewDraft(single, draft);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.entries.map(({ name, dietary }) => ({ name, dietary })), [
    { name: "Avery Sample", dietary: "Nut allergy" },
    { name: "Alex Demo", dietary: "Vegetarian" },
  ]);
});

test("declining a host clears their dietary notes and plus-one details without mutating the prior draft", () => {
  const draft = changeGuestAttendance(single, createPreviewDraft(single), "avery", "yes");
  draft.guests.avery.dietary = "Nut allergy";
  draft.plusOne = { attending: "yes", name: "Alex Demo", dietary: "Vegetarian" };
  const declined = changeGuestAttendance(single, draft, "avery", "no");
  assert.equal(declined.guests.avery.dietary, "");
  assert.deepEqual(declined.plusOne, { attending: "", name: "", dietary: "" });
  assert.equal(draft.plusOne.name, "Alex Demo");
  assert.deepEqual(reviewPreviewDraft(single, declined).entries, [
    { name: "Avery Sample", attending: false, dietary: "", isPlusOne: false },
  ]);
});

test("an invitation without plus-one permission cannot include an extra guest in review", () => {
  const draft = createPreviewDraft(pair);
  draft.guests.morgan.attending = "yes";
  draft.guests.taylor.attending = "no";
  draft.plusOne = { attending: "yes", name: "Uninvited Guest", dietary: "" };
  const result = reviewPreviewDraft(pair, draft);
  assert.equal(result.errors.length, 0);
  assert.equal(result.entries.length, 2);
  assert.equal(result.entries.some((entry) => entry.isPlusOne), false);
});

test("a fully declined party is valid and excludes dietary notes from review", () => {
  const draft = createPreviewDraft(pair);
  for (const guest of pair.guests) {
    draft.guests[guest.id] = { attending: "no", dietary: "Stale notes" };
  }
  const result = reviewPreviewDraft(pair, draft);
  assert.deepEqual(result.errors, []);
  assert.ok(result.entries.every((entry) => !entry.attending && entry.dietary === ""));
});
