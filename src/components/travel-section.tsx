export function TravelSection() {
  return (
    <section
      id="travel"
      aria-labelledby="travel-heading"
      className="scroll-mt-8 border-t border-limestone bg-parchment/50 px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-brass">
            Make your way to Philadelphia
          </p>
          <h2 id="travel-heading" className="mt-5 font-display text-5xl font-medium sm:text-6xl">
            Travel &amp; Accommodations
          </h2>
          <p className="mx-auto mt-5 max-w-lg font-sans text-base leading-8 text-muted">
            Whether you’re coming from nearby or making a weekend of it, we’re
            so happy you’ll be joining us.
          </p>
        </div>

        <div className="mt-14 border-y border-limestone py-10 sm:mt-16 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-12">
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.25em] text-brass">
                Your destination
              </p>
              <h3 className="mt-4 font-display text-3xl">Getting There</h3>
              <p className="mt-4 font-sans text-sm leading-7 text-muted">
                Join us at Philadelphia Water Works. Please plan to arrive by
                2:30 PM for the ceremony.
              </p>
            </div>
            <div>
              <p className="font-display text-2xl">Philadelphia Water Works</p>
              <address className="mt-3 font-sans text-sm not-italic leading-7 text-muted">
                640 Waterworks Dr<br />
                Philadelphia, PA 19130
              </address>
              <a
                href="https://share.google/Uzx9cpqx7Mg3UHQuv"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center gap-3 border-b border-brass font-sans text-xs uppercase tracking-[0.2em] text-charcoal transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
              >
                Get directions <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-10 pt-12 sm:grid-cols-2 sm:gap-12">
          <div>
            <h3 className="font-display text-3xl">Where to Stay</h3>
            <p className="mt-4 font-sans text-sm leading-7 text-muted">
              Hotel and room block details will be shared here soon. Check back
              for accommodation options and booking information.
            </p>
          </div>
          <div>
            <h3 className="font-display text-3xl">Parking &amp; Transportation</h3>
            <p className="mt-4 font-sans text-sm leading-7 text-muted">
              Parking information and any shuttle arrangements will be shared
              here as plans are finalized.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
