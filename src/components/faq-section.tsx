import { wedding } from "@/config/wedding";
import { getRsvpMode } from "@/server/rsvp";

const questions = [
  {
    question: "What time should I arrive?",
    answer:
      "Please arrive by 2:30 PM so you have time to get settled before our 3:00 PM ceremony. The reception begins at 4:00 PM.",
  },
  {
    question: "What should I wear?",
    answer:
      "Formal attire requested. We invite you to celebrate in a suit and tie, an evening gown, or an elegant cocktail dress.",
  },
  {
    question: "Are children invited?",
    answer:
      "Our wedding will be primarily an adults-only celebration. Please refer to your invitation for the guests included in your party. Thank you for understanding!",
  },
  {
    question: "Can I bring a plus-one?",
    answer:
      "Plus-ones are welcome only when included on your invitation. Please RSVP only for the guests listed or the plus-one indicated on your invitation.",
  },
  {
    question: "How do I RSVP?",
    answer:
      `Please RSVP here on our website by ${wedding.rsvpDeadlineLabel}, using the unique code included with your invitation.${getRsvpMode() === "live" ? " You can return with your code to update your response before the deadline." : " The form is currently a preview with sample invitations; real RSVPs will open once it’s ready."}`,
  },
  {
    question: "How can I share dietary restrictions?",
    answer:
      "Please include any dietary restrictions or food allergies when you RSVP on our website.",
  },
];

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-0 border-t border-limestone px-6 py-16 sm:px-10 sm:py-20 lg:px-16"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-brass">
            A few helpful details
          </p>
          <h2
            id="faq-heading"
            className="mt-4 font-display text-5xl font-medium sm:text-6xl"
          >
            Questions &amp; Answers
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-sans text-base leading-7 text-muted">
            Everything you need to know before celebrating with us.
          </p>
        </div>

        <div className="mt-10 border-t border-limestone">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group border-b border-limestone">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-2xl transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass [&::-webkit-details-marker]:hidden">
                <span>{question}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-4 w-4 shrink-0 text-brass transition-transform group-open:rotate-180 motion-reduce:transition-none"
                >
                  <path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </summary>
              <p className="max-w-2xl pb-6 font-sans text-sm leading-7 text-muted">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
