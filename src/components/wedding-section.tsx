export function WeddingSection() {
  return (
    <section
      id="the-wedding"
      aria-labelledby="wedding-heading"
      className="scroll-mt-0 px-6 py-10 sm:px-10 sm:py-8 lg:px-16"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-brass">
            Together with our favorite people
          </p>
          <h2
            id="wedding-heading"
            className="mt-3 font-display text-5xl font-medium sm:text-6xl"
          >
            The Wedding
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-sans text-base leading-7 text-muted">
            Join us in Philadelphia for a day of love, celebration, and the
            beginning of our next chapter.
          </p>
          <div aria-hidden="true" className="my-4 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-limestone" />
            <span className="h-2 w-2 rotate-45 border border-brass" />
            <span className="h-px w-16 bg-limestone" />
          </div>
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-muted">
            Save the date
          </p>
          <p className="mt-2 font-display text-3xl sm:text-4xl">
            <time dateTime="2027-04-11">Sunday, April 11, 2027</time>
          </p>
        </div>

        <div className="mt-8 border-y border-limestone">
        <div className="py-8 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-brass">
            Our venue
          </p>
          <h3 className="mt-3 font-display text-3xl sm:text-4xl">Philadelphia Water Works</h3>
          <address className="mt-3 font-sans text-sm not-italic leading-7 tracking-wide text-muted">
            640 Waterworks Dr<br />
            Philadelphia, PA 19130
          </address>
          <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-7 text-muted">
            A beautiful setting for a day we will always remember. We can’t wait
            to celebrate with you.
          </p>
          <a
            href="https://share.google/Uzx9cpqx7Mg3UHQuv"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-3 border-b border-brass font-sans text-xs uppercase tracking-[0.2em] text-charcoal transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
          >
            View map <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>

        <div className="border-t border-limestone">
        <div className="grid grid-cols-2 gap-6 py-8 text-center">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-brass">The vows</p>
            <h3 className="mt-2 font-display text-3xl">Ceremony</h3>
            <p className="mt-2 font-sans text-sm leading-7 text-muted">
              <time dateTime="15:00">3:00 PM</time>
            </p>
            <p className="mt-2 font-sans text-sm leading-7 text-muted">
              Please arrive by <time dateTime="14:30">2:30 PM</time>.
            </p>
          </div>
          <div className="border-l border-limestone pl-4">
            <p className="font-sans text-xs uppercase tracking-[0.25em] text-brass">The celebration</p>
            <h3 className="mt-2 font-display text-3xl">Reception</h3>
            <p className="mt-2 font-sans text-sm leading-7 text-muted">
              <time dateTime="16:00">4:00 PM</time>
            </p>
          </div>
        </div>
        <div className="border-t border-limestone py-6 text-center">
          <h3 className="font-display text-3xl">Dress Code</h3>
          <p className="mt-2 font-sans text-sm leading-7 text-muted">
            Formal attire requested.
          </p>
          <p className="mx-auto mt-2 max-w-md font-sans text-sm leading-7 text-muted">
            We invite you to celebrate in a suit and tie, an evening gown, or an
            elegant cocktail dress.
          </p>
        </div>
        </div>
        </div>
        <p className="mt-5 text-center font-display text-2xl italic text-muted">
          We can’t wait to see you there!
        </p>
        <div className="mt-2 text-center">
          <a
            href="#travel"
            className="inline-flex min-h-11 items-center gap-3 border-b border-brass font-sans text-xs uppercase tracking-[0.2em] text-charcoal transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
          >
            Travel &amp; Accommodations <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
