"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { findRsvpAction, leaveRsvpAction, loadRsvpAction, saveRsvpAction } from "@/app/rsvp-actions";
import { wedding } from "@/config/wedding";
import { validateRsvpSubmission } from "@/lib/rsvp-contract";
import type { RsvpParty, RsvpResult, RsvpSubmission } from "@/lib/rsvp-contract";

type Choice = "yes" | "no" | "";
type Draft = Record<string, { attending: Choice; dietary: string; plusAttending: Choice; plusName: string; plusDietary: string }>;
type Step = "lookup" | "response" | "review" | "complete";
const inputClass = "mt-2 w-full min-w-0 border border-limestone bg-ivory px-3 py-3 font-sans text-base text-charcoal focus-visible:outline-2 focus-visible:outline-brass";
const buttonClass = "inline-flex min-h-12 items-center justify-center border border-charcoal bg-charcoal px-6 py-3 font-sans text-xs uppercase tracking-[0.15em] text-ivory transition-colors hover:bg-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass disabled:cursor-wait disabled:opacity-60";
const secondaryClass = "inline-flex min-h-12 items-center justify-center border border-limestone px-5 py-3 font-sans text-xs uppercase tracking-[0.1em] text-charcoal hover:bg-parchment focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass disabled:opacity-60";
const choice = (value?: boolean | null): Choice => value == null ? "" : value ? "yes" : "no";

function makeDraft(party: RsvpParty): Draft {
  return Object.fromEntries(party.guests.map((guest) => [guest.id, {
    attending: choice(guest.response?.attending), dietary: guest.response?.dietary ?? "",
    plusAttending: choice(guest.plusOne?.attending), plusName: guest.plusOne?.name ?? "", plusDietary: guest.plusOne?.dietary ?? "",
  }]));
}

function payload(party: RsvpParty, draft: Draft) {
  return {
    revision: party.revision,
    responses: party.guests.map((guest) => {
      const response = draft[guest.id];
      return {
        guestId: guest.id,
        attending: response.attending === "" ? null : response.attending === "yes",
        dietary: response.attending === "yes" ? response.dietary : "",
        plusOne: guest.allowsPlusOne && response.attending === "yes" ? {
          attending: response.plusAttending === "" ? null : response.plusAttending === "yes",
          name: response.plusName, dietary: response.plusDietary,
        } : null,
      };
    }),
  };
}

function Attendance({ name, title, value, change }: { name: string; title: string; value: Choice; change: (value: Choice) => void }) {
  return <fieldset>
    <legend className="font-sans text-sm leading-6">{title}</legend>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {(["yes", "no"] as const).map((item) => <label key={item} className={`flex min-h-12 cursor-pointer items-center gap-3 border p-3 font-sans text-sm ${value === item ? "border-brass bg-parchment" : "border-limestone"}`}>
        <input type="radio" name={name} value={item} checked={value === item} onChange={() => change(item)} required className="h-4 w-4 shrink-0 accent-brass" />
        {item === "yes" ? "Joyfully accepts" : "Regretfully declines"}
      </label>)}
    </div>
  </fieldset>;
}

function Summary({ party, submission }: { party: RsvpParty; submission: RsvpSubmission }) {
  return <ul className="divide-y divide-limestone border-y border-limestone">
    {submission.responses.map((response) => <li key={response.guestId} className="py-4">
      <p className="break-words font-display text-2xl">{party.guests.find((guest) => guest.id === response.guestId)?.name}</p>
      <p className="mt-1 font-sans text-sm leading-6 text-muted">{response.attending ? "Attending" : "Not attending"}</p>
      {response.attending && <p className="mt-1 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-muted">Dietary restrictions: {response.dietary || "None provided"}</p>}
      {response.plusOne && <div className="mt-3 border-l border-limestone pl-4">
        <p className="break-words font-display text-xl">{response.plusOne.attending ? response.plusOne.name : "Invited plus-one"}</p>
        <p className="font-sans text-sm leading-6 text-muted">{response.plusOne.attending ? "Attending as a plus-one" : "Not attending"}</p>
        {response.plusOne.attending && <p className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-muted">Dietary restrictions: {response.plusOne.dietary || "None provided"}</p>}
      </div>}
    </li>)}
  </ul>;
}

export function DatabaseRsvpSection({ sampleOnly }: { sampleOnly: boolean }) {
  const [step, setStep] = useState<Step>("lookup");
  const [party, setParty] = useState<RsvpParty | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [submission, setSubmission] = useState<RsvpSubmission | null>(null);
  const [code, setCode] = useState("");
  const [lastName, setLastName] = useState("");
  const [pending, setPending] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [errorCode, setErrorCode] = useState("");
  const [restored, setRestored] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef<Step>("lookup");

  function accept(result: RsvpResult<RsvpParty | null>, resumed = false) {
    if (!result.ok) { setErrors(result.errors); setErrorCode(result.code); return false; }
    setErrors([]); setErrorCode("");
    if (result.value) {
      setParty(result.value); setDraft(makeDraft(result.value)); setRestored(resumed && result.value.hasResponse);
      setStep("response");
    } else { setParty(null); setDraft({}); setSubmission(null); setStep("lookup"); }
    return true;
  }

  useEffect(() => {
    let active = true;
    loadRsvpAction().then((result) => { if (active) accept(result, true); })
      .catch(() => { if (active) setErrors(["Unable to load your invitation. Please try again."]); })
      .finally(() => { if (active) setPending(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (step !== previousStep.current) {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "start" });
      previousStep.current = step;
    }
  }, [step]);

  async function request(operation: () => Promise<void>) {
    if (pending) return;
    setPending(true); setErrors([]); setErrorCode("");
    try { await operation(); } catch { setErrors(["The request could not be completed. Please try again; a response is only confirmed after it is saved."]); }
    finally { setPending(false); }
  }

  async function lookup(event: FormEvent) {
    event.preventDefault();
    await request(async () => {
      if (accept(await findRsvpAction(code, lastName))) { setCode(""); setLastName(""); setRestored(false); }
    });
  }

  function review(event: FormEvent) {
    event.preventDefault();
    if (!party) return;
    const result = validateRsvpSubmission(payload(party, draft), party.guests);
    setErrors(result.errors); setErrorCode("");
    if (result.value) { setSubmission(result.value); setStep("review"); }
  }

  async function save() {
    if (!submission) return;
    await request(async () => {
      const result = await saveRsvpAction(submission);
      if (!result.ok) { setErrors(result.errors); setErrorCode(result.code); return; }
      setParty(result.value); setDraft(makeDraft(result.value));
      setSubmission(validateRsvpSubmission(payload(result.value, makeDraft(result.value)), result.value.guests).value);
      setStep("complete"); setRestored(false);
    });
  }

  async function leave() {
    await request(async () => {
      const result = await leaveRsvpAction();
      if (!result.ok) { setErrors(result.errors); return; }
      accept({ ok: true, value: null }); setRestored(false);
    });
  }

  function update(id: string, values: Partial<Draft[string]>) {
    setDraft((current) => ({ ...current, [id]: { ...current[id], ...values } }));
  }

  return <section id="rsvp" aria-labelledby="rsvp-heading" className="scroll-mt-0 border-t border-limestone px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-brass">A seat at our celebration</p>
        <h2 id="rsvp-heading" className="mt-4 font-display text-5xl font-medium sm:text-6xl">Kindly Reply</h2>
        <p className="mt-4 font-sans text-base leading-7 text-muted">Please respond by {party?.deadline ?? wedding.rsvpDeadlineLabel}.</p>
        <p className="mt-2 font-sans text-sm leading-7 text-muted">Meal selections will be made at the event.</p>
      </div>
      {sampleOnly && <div className="mt-8 border border-limestone bg-parchment/60 p-5 font-sans text-sm leading-6">
        <p className="font-semibold">Database preview · Sample invitations only</p>
        <p className="mt-1">Sample responses now save and can be reopened. This is not a real wedding RSVP. Use the private sample codes provided to you; please don’t enter personal information.</p>
      </div>}
      <div aria-busy={pending} className="mt-6 border border-limestone bg-ivory p-5 sm:p-8">
        <ol aria-label="RSVP progress" className="mb-6 flex flex-wrap gap-x-5 gap-y-2 font-sans text-[11px] uppercase tracking-[0.1em] text-muted">
          {(["lookup", "response", "review", "complete"] as const).map((item, index) => <li key={item} aria-current={step === item ? "step" : undefined} className={step === item ? "font-semibold text-brass" : ""}>{index + 1}. {item === "lookup" ? "Invitation" : item === "response" ? "Response" : item === "review" ? "Review" : "Confirmation"}</li>)}
        </ol>
        <h3 ref={headingRef} tabIndex={-1} className="mb-5 scroll-mt-6 font-display text-3xl focus:outline-none">
          {step === "lookup" ? "Find your invitation" : step === "response" ? "Your party’s response" : step === "review" ? "Review your response" : sampleOnly ? "Your sample response is saved" : "Thank you! Your RSVP has been received."}
        </h3>
        {pending && <p role="status" className="mb-4 font-sans text-sm text-muted">{step === "review" ? "Saving your response…" : "Please wait…"}</p>}
        {errors.length > 0 && <div role="alert" className="mb-5 border border-[#924030] bg-[#fff5ef] p-4 font-sans text-sm leading-6 text-[#793525]">
          <ul className="list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          {["CONFLICT", "CLOSED", "EXPIRED"].includes(errorCode) && <button type="button" disabled={pending} onClick={() => request(async () => { accept(await loadRsvpAction(), true); setSubmission(null); })} className={`${secondaryClass} mt-3`}>Reload saved response</button>}
          {errorCode === "SESSION_EXPIRED" && <button type="button" disabled={pending} onClick={leave} className={`${secondaryClass} mt-3`}>Enter invitation code again</button>}
        </div>}

        {step === "lookup" && <form onSubmit={lookup}>
          <fieldset disabled={pending}>
            <p className="mb-5 font-sans text-sm leading-7 text-muted">Enter the unique code from your invitation and the last name of an invited guest.</p>
            <label htmlFor="db-invitation-code" className="font-sans text-sm">Invitation code</label>
            <input id="db-invitation-code" value={code} onChange={(event) => setCode(event.target.value)} required maxLength={40} autoComplete="off" autoCapitalize="characters" spellCheck={false} className={inputClass} />
            <label htmlFor="db-invitation-last-name" className="mt-5 block font-sans text-sm">Last name</label>
            <input id="db-invitation-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} required maxLength={100} autoComplete="off" className={inputClass} />
            <button type="submit" disabled={pending} className={`${buttonClass} mt-6 w-full sm:w-auto`}>Find invitation</button>
          </fieldset>
        </form>}

        {step === "response" && party && <form onSubmit={review} noValidate>
          {restored && !party.closed && <p role="status" className="mb-5 font-sans text-sm leading-7 text-brass">Your saved response has been loaded. You can update it before the deadline.</p>}
          {party.closed && <p className="mb-5 border border-limestone bg-parchment p-4 font-sans text-sm leading-7">The RSVP deadline has passed. You can view your saved response, but please contact us to make changes.</p>}
          <fieldset disabled={pending || party.closed} className="space-y-6">
            {party.guests.map((guest) => {
              const response = draft[guest.id];
              return <div key={guest.id} className="border-t border-limestone pt-5">
                <h4 className="mb-3 break-words font-display text-2xl">{guest.name}</h4>
                <Attendance name={`db-attendance-${guest.id}`} title="Will you be joining us?" value={response.attending} change={(value) => update(guest.id, value === "yes" ? { attending: value } : { attending: value, dietary: "", plusAttending: "", plusName: "", plusDietary: "" })} />
                {response.attending === "yes" && <div className="mt-4">
                  <label htmlFor={`db-dietary-${guest.id}`} className="font-sans text-sm">Dietary restrictions or food allergies (optional)</label>
                  <textarea id={`db-dietary-${guest.id}`} value={response.dietary} onChange={(event) => update(guest.id, { dietary: event.target.value })} rows={2} maxLength={500} className={inputClass} />
                </div>}
                {guest.allowsPlusOne && response.attending === "yes" && <div className="mt-5 border-l border-limestone pl-4">
                  <h5 className="mb-3 font-display text-2xl">Your invited plus-one</h5>
                  <Attendance name={`db-plus-attendance-${guest.id}`} title="Will your plus-one join you?" value={response.plusAttending} change={(value) => update(guest.id, value === "yes" ? { plusAttending: value } : { plusAttending: value, plusName: "", plusDietary: "" })} />
                  {response.plusAttending === "yes" && <>
                    <label htmlFor={`db-plus-name-${guest.id}`} className="mt-4 block font-sans text-sm">Plus-one’s full name</label>
                    <input id={`db-plus-name-${guest.id}`} value={response.plusName} onChange={(event) => update(guest.id, { plusName: event.target.value })} required maxLength={150} autoComplete="off" className={inputClass} />
                    <label htmlFor={`db-plus-dietary-${guest.id}`} className="mt-4 block font-sans text-sm">Plus-one’s dietary restrictions or food allergies (optional)</label>
                    <textarea id={`db-plus-dietary-${guest.id}`} value={response.plusDietary} onChange={(event) => update(guest.id, { plusDietary: event.target.value })} rows={2} maxLength={500} className={inputClass} />
                  </>}
                </div>}
              </div>;
            })}
            {!party.closed && <button type="submit" disabled={pending} className={buttonClass}>Review response</button>}
          </fieldset>
          <button type="button" disabled={pending} onClick={leave} className={`${secondaryClass} mt-4`}>Use another invitation</button>
        </form>}

        {(step === "review" || step === "complete") && party && submission && <>
          <p className="mb-5 font-sans text-sm leading-7 text-muted">{step === "review" ? "Check each guest’s details, then submit to save your response." : sampleOnly ? "This sample response was saved to the database. Refresh or return with your code to try updating it." : "Your response has been saved. Return with your invitation code to make changes before the deadline."}</p>
          <Summary party={party} submission={submission} />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
            {step === "review" && <button type="button" disabled={pending} onClick={save} className={buttonClass}>{pending ? "Saving…" : sampleOnly ? "Save sample response" : "Submit RSVP"}</button>}
            <button type="button" disabled={pending} onClick={() => { setErrors([]); setStep("response"); }} className={secondaryClass}>Edit {sampleOnly ? "sample response" : "RSVP"}</button>
            {step === "complete" && <button type="button" disabled={pending} onClick={leave} className={secondaryClass}>Finish and sign out</button>}
          </div>
        </>}
      </div>
    </div>
  </section>;
}
