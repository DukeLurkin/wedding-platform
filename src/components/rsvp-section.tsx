"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { wedding } from "@/config/wedding";
import {
  changeGuestAttendance,
  createPreviewDraft,
  findPreviewInvitation,
  previewInvitations,
  reviewPreviewDraft,
} from "@/lib/rsvp-preview";
import type { Attendance, PreviewDraft, PreviewInvitation, ReviewEntry } from "@/lib/rsvp-preview";

const inputClass = "mt-2 w-full min-w-0 border border-limestone bg-ivory px-3 py-3 font-sans text-base text-charcoal focus-visible:outline-2 focus-visible:outline-brass";
const primaryClass = "inline-flex min-h-12 items-center justify-center border border-charcoal bg-charcoal px-6 py-3 font-sans text-xs uppercase tracking-[0.15em] text-ivory transition-colors hover:bg-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass";
const secondaryClass = "inline-flex min-h-12 items-center justify-center border border-limestone px-5 py-3 font-sans text-xs uppercase tracking-[0.1em] text-charcoal transition-colors hover:bg-parchment focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass";
type Step = "lookup" | "response" | "review" | "complete";
const stepTitles: Record<Step, string> = {
  lookup: "Find your invitation",
  response: "Your party’s response",
  review: "Review your response",
  complete: "Your preview is complete",
};

function AttendanceChoice({ name, legend, value, onChange }: {
  name: string;
  legend: string;
  value: Attendance;
  onChange: (value: Attendance) => void;
}) {
  return (
    <fieldset>
      <legend className="font-sans text-sm leading-6 text-charcoal">{legend}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {(["yes", "no"] as const).map((choice) => (
          <label key={choice} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-3 py-3 font-sans text-sm ${value === choice ? "border-brass bg-parchment" : "border-limestone bg-ivory"}`}>
            <input
              type="radio"
              name={name}
              value={choice}
              checked={value === choice}
              onChange={() => onChange(choice)}
              required
              className="h-4 w-4 shrink-0 accent-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
            />
            {choice === "yes" ? "Joyfully accepts" : "Regretfully declines"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ResponseSummary({ entries }: { entries: ReviewEntry[] }) {
  return (
    <ul className="divide-y divide-limestone border-y border-limestone">
      {entries.map((entry, index) => (
        <li key={index} className="py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="break-words font-display text-2xl">{entry.name}{entry.isPlusOne ? " (plus-one)" : ""}</p>
            <p className="font-sans text-sm text-muted">{entry.attending ? "Attending" : "Not attending"}</p>
          </div>
          {entry.attending && (
            <p className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-muted">
              Dietary restrictions: {entry.dietary || "None provided"}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function RsvpSection() {
  const [step, setStep] = useState<Step>("lookup");
  const [code, setCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [invitation, setInvitation] = useState<PreviewInvitation | null>(null);
  const [draft, setDraft] = useState<PreviewDraft | null>(null);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef<Step>("lookup");

  useEffect(() => {
    if (previousStep.current !== step) {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "start" });
      previousStep.current = step;
    }
  }, [step]);

  function goTo(next: Step) {
    setErrors([]);
    setStep(next);
  }

  function findInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = findPreviewInvitation(code, lastName);
    if (!found) {
      setErrors(["We couldn’t find that sample invitation. Use one of the sample codes and matching last names below."]);
      return;
    }
    setInvitation(found);
    setDraft(createPreviewDraft(found));
    setEntries([]);
    goTo("response");
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invitation || !draft) return;
    const result = reviewPreviewDraft(invitation, draft);
    setErrors(result.errors);
    if (!result.errors.length) {
      setEntries(result.entries);
      goTo("review");
    }
  }

  function reset() {
    setCode("");
    setLastName("");
    setInvitation(null);
    setDraft(null);
    setEntries([]);
    goTo("lookup");
  }

  const hostAttending = invitation?.plusOneHostId && draft?.guests[invitation.plusOneHostId]?.attending === "yes";

  return (
    <section id="rsvp" aria-labelledby="rsvp-heading" className="scroll-mt-0 border-t border-limestone px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-brass">A seat at our celebration</p>
          <h2 id="rsvp-heading" className="mt-4 font-display text-5xl font-medium sm:text-6xl">Kindly Reply</h2>
          <p className="mt-4 font-sans text-base leading-7 text-muted">
            Please respond by <time dateTime={wedding.rsvpDeadline}>{wedding.rsvpDeadlineLabel}</time>.
          </p>
          <p className="mt-2 font-sans text-sm leading-7 text-muted">Meal selections will be made at the event.</p>
        </div>

        <div className="mt-8 border border-limestone bg-parchment/60 px-5 py-4 font-sans text-sm leading-6 text-charcoal">
          <p className="font-semibold">RSVP preview · Sample invitations only</p>
          <p className="mt-1">Try the flow with fictional guests. No real RSVP is sent or saved, and refreshing clears the preview. Please don’t enter personal information yet.</p>
        </div>

        <div className="mt-6 border border-limestone bg-ivory p-5 sm:p-8">
          <ol aria-label="RSVP progress" className="mb-6 flex flex-wrap gap-x-5 gap-y-2 font-sans text-[11px] uppercase tracking-[0.1em] text-muted">
            {(["lookup", "response", "review", "complete"] as const).map((item, index) => (
              <li key={item} aria-current={step === item ? "step" : undefined} className={step === item ? "font-semibold text-brass" : ""}>
                {index + 1}. {item === "lookup" ? "Invitation" : item === "response" ? "Response" : item === "review" ? "Review" : "Confirmation"}
              </li>
            ))}
          </ol>
          <h3 ref={headingRef} tabIndex={-1} className="mb-5 scroll-mt-6 font-display text-3xl focus:outline-none">{stepTitles[step]}</h3>

          {errors.length > 0 && (
            <div role="alert" className="mb-5 border border-[#924030] bg-[#fff5ef] p-4 font-sans text-sm leading-6 text-[#793525]">
              <p className="font-semibold">Please check your response:</p>
              <ul className="mt-1 list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          )}

          {step === "lookup" && (
            <>
              <form onSubmit={findInvitation}>
                <p className="mb-5 font-sans text-sm leading-7 text-muted">Enter the unique code from your invitation and the last name of an invited guest.</p>
                <label className="block font-sans text-sm" htmlFor="invitation-code">Invitation code</label>
                <input id="invitation-code" value={code} onChange={(event) => setCode(event.target.value)} maxLength={40} required autoCapitalize="characters" autoComplete="off" spellCheck={false} className={inputClass} aria-describedby="sample-invitations" />
                <label className="mt-5 block font-sans text-sm" htmlFor="invitation-last-name">Last name</label>
                <input id="invitation-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} maxLength={100} required autoComplete="off" className={inputClass} aria-describedby="sample-invitations" />
                <button type="submit" className={`${primaryClass} mt-6 w-full sm:w-auto`}>Find invitation</button>
              </form>
              <div id="sample-invitations" className="mt-6 border-t border-limestone pt-5">
                <p className="font-sans text-sm text-muted">Choose a sample to fill in the fields:</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {previewInvitations.map((sample) => (
                    <button key={sample.code} type="button" onClick={() => { setCode(sample.code); setLastName(sample.guests[0].lastName); setErrors([]); }} className="border border-limestone p-3 text-left font-sans text-sm leading-6 transition-colors hover:bg-parchment focus-visible:outline-2 focus-visible:outline-brass">
                      <span className="block font-semibold">{sample.label}</span>
                      <span className="block text-muted">{sample.code} / {sample.guests[0].lastName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "response" && invitation && draft && (
            <form onSubmit={review} noValidate>
              <p className="font-sans text-sm leading-7 text-muted">Please respond for everyone listed on this invitation. Dietary restrictions are optional.</p>
              <div className="mt-6 space-y-6">
                {invitation.guests.map((guest) => (
                  <div key={guest.id} className="border-t border-limestone pt-5">
                    <h4 className="mb-3 font-display text-2xl">{guest.firstName} {guest.lastName}</h4>
                    <AttendanceChoice name={`attendance-${guest.id}`} legend="Will you be joining us?" value={draft.guests[guest.id].attending} onChange={(value) => setDraft(changeGuestAttendance(invitation, draft, guest.id, value))} />
                    {draft.guests[guest.id].attending === "yes" && (
                      <div className="mt-4">
                        <label htmlFor={`dietary-${guest.id}`} className="font-sans text-sm">Dietary restrictions or food allergies (optional)</label>
                        <textarea id={`dietary-${guest.id}`} value={draft.guests[guest.id].dietary} onChange={(event) => setDraft({ ...draft, guests: { ...draft.guests, [guest.id]: { ...draft.guests[guest.id], dietary: event.target.value } } })} maxLength={500} rows={2} className={inputClass} />
                      </div>
                    )}
                  </div>
                ))}

                {invitation.plusOneHostId && (
                  <div className="border-t border-limestone pt-5">
                    <h4 className="mb-3 font-display text-2xl">Your invited plus-one</h4>
                    {hostAttending ? (
                      <>
                        <AttendanceChoice name="plus-one-attendance" legend="Will your plus-one be joining you?" value={draft.plusOne.attending} onChange={(value) => setDraft({ ...draft, plusOne: value === "yes" ? { ...draft.plusOne, attending: value } : { attending: value, name: "", dietary: "" } })} />
                        {draft.plusOne.attending === "yes" && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <label htmlFor="plus-one-name" className="font-sans text-sm">Plus-one’s full name</label>
                              <input id="plus-one-name" value={draft.plusOne.name} onChange={(event) => setDraft({ ...draft, plusOne: { ...draft.plusOne, name: event.target.value } })} required maxLength={150} autoComplete="off" className={inputClass} />
                            </div>
                            <div>
                              <label htmlFor="plus-one-dietary" className="font-sans text-sm">Plus-one’s dietary restrictions or food allergies (optional)</label>
                              <textarea id="plus-one-dietary" value={draft.plusOne.dietary} onChange={(event) => setDraft({ ...draft, plusOne: { ...draft.plusOne, dietary: event.target.value } })} rows={2} maxLength={500} className={inputClass} />
                            </div>
                          </div>
                        )}
                      </>
                    ) : <p className="font-sans text-sm leading-7 text-muted">A plus-one is included with this sample invitation. Select “Joyfully accepts” for the invited guest to add their response.</p>}
                  </div>
                )}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
                <button type="submit" className={primaryClass}>Review response</button>
                <button type="button" onClick={reset} className={secondaryClass}>Use another invitation</button>
              </div>
            </form>
          )}

          {step === "review" && (
            <>
              <p className="mb-5 font-sans text-sm leading-7 text-muted">Check each guest’s details before completing this preview. Nothing will be sent or saved.</p>
              <ResponseSummary entries={entries} />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
                <button type="button" onClick={() => goTo("complete")} className={primaryClass}>Complete preview</button>
                <button type="button" onClick={() => goTo("response")} className={secondaryClass}>Edit response</button>
              </div>
            </>
          )}

          {step === "complete" && (
            <>
              <p className="mb-5 font-sans text-sm leading-7 text-muted">This is how your confirmation will look. No real RSVP has been submitted. You can edit this sample response below, or try another invitation.</p>
              <ResponseSummary entries={entries} />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => goTo("response")} className={primaryClass}>Edit sample response</button>
                <button type="button" onClick={reset} className={secondaryClass}>Start over</button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
