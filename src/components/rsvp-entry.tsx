import { getRsvpMode } from "@/server/rsvp";
import { DatabaseRsvpSection } from "@/components/rsvp-database-section";
import { RsvpSection as BrowserPreview } from "@/components/rsvp-section";

export function RsvpSection() {
  const mode = getRsvpMode();
  return mode === "preview" ? <BrowserPreview /> : <DatabaseRsvpSection sampleOnly={mode === "database-preview"} />;
}
