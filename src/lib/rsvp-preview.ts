// Synthetic fixtures for the browser-only preview. Never put real invitation
// credentials or the guest list in this client-imported module.
export type Attendance = "yes" | "no" | "";
export type PreviewInvitation = {
  code: string;
  label: string;
  guests: { id: string; firstName: string; lastName: string }[];
  plusOneHostId?: string;
};

export const previewInvitations: PreviewInvitation[] = [
  {
    code: "DEMO-2027",
    label: "One guest with a plus-one",
    guests: [{ id: "avery", firstName: "Avery", lastName: "Sample" }],
    plusOneHostId: "avery",
  },
  {
    code: "PAIR-2027",
    label: "Two named guests, no plus-one",
    guests: [
      { id: "morgan", firstName: "Morgan", lastName: "Example" },
      { id: "taylor", firstName: "Taylor", lastName: "Example" },
    ],
  },
];

type GuestResponse = { attending: Attendance; dietary: string };
export type PreviewDraft = {
  guests: Record<string, GuestResponse>;
  plusOne: GuestResponse & { name: string };
};
export type ReviewEntry = {
  name: string;
  attending: boolean;
  dietary: string;
  isPlusOne: boolean;
};

export function findPreviewInvitation(code: string, lastName: string) {
  const normalizedCode = code.replace(/[\s-]/g, "").toUpperCase();
  return previewInvitations.find(
    (invitation) =>
      invitation.code.replace(/-/g, "") === normalizedCode &&
      invitation.guests.some(
        (guest) => guest.lastName.toLowerCase() === lastName.trim().toLowerCase(),
      ),
  );
}

export function createPreviewDraft(invitation: PreviewInvitation): PreviewDraft {
  return {
    guests: Object.fromEntries(
      invitation.guests.map((guest) => [guest.id, { attending: "", dietary: "" }]),
    ),
    plusOne: { attending: "", name: "", dietary: "" },
  };
}

export function changeGuestAttendance(
  invitation: PreviewInvitation,
  draft: PreviewDraft,
  guestId: string,
  attending: Attendance,
): PreviewDraft {
  return {
    ...draft,
    guests: {
      ...draft.guests,
      [guestId]: {
        attending,
        dietary: attending === "yes" ? draft.guests[guestId].dietary : "",
      },
    },
    plusOne:
      invitation.plusOneHostId === guestId && attending !== "yes"
        ? { attending: "", name: "", dietary: "" }
        : draft.plusOne,
  };
}

export function reviewPreviewDraft(
  invitation: PreviewInvitation,
  draft: PreviewDraft,
): { errors: string[]; entries: ReviewEntry[] } {
  const errors: string[] = [];
  const entries: ReviewEntry[] = invitation.guests.map((guest) => {
    const response = draft.guests[guest.id];
    const name = `${guest.firstName} ${guest.lastName}`;
    if (!response || !["yes", "no"].includes(response.attending)) {
      errors.push(`Please choose attendance for ${name}.`);
    }
    return {
      name,
      attending: response?.attending === "yes",
      dietary: response?.attending === "yes" ? response.dietary.trim() : "",
      isPlusOne: false,
    };
  });

  const hostAttending = invitation.plusOneHostId &&
    draft.guests[invitation.plusOneHostId]?.attending === "yes";
  if (hostAttending) {
    if (!["yes", "no"].includes(draft.plusOne.attending)) {
      errors.push("Please choose whether you are bringing your invited plus-one.");
    }
    if (draft.plusOne.attending === "yes" && !draft.plusOne.name.trim()) {
      errors.push("Please enter your plus-one’s full name.");
    }
    entries.push({
      name: draft.plusOne.attending === "yes" ? draft.plusOne.name.trim() : "Invited plus-one",
      attending: draft.plusOne.attending === "yes",
      dietary: draft.plusOne.attending === "yes" ? draft.plusOne.dietary.trim() : "",
      isPlusOne: true,
    });
  }
  return { errors, entries };
}
