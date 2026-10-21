import Image from "next/image";

const contributionOptions = [
  {
    name: "Venmo",
    href: "https://venmo.com/u/Lukas-Durkin",
    qr: {
      src: "/images/registry/venmo-qr.png",
      alt: "Venmo QR code for Lukas Durkin, @Lukas-Durkin",
      width: 775,
      height: 830,
    },
  },
  {
    name: "Cash App",
    href: "https://cash.app/$LukasDurkin",
    qr: {
      src: "/images/registry/cash-app-qr.png",
      alt: "Cash App QR code for Lukas Durkin, $LukasDurkin",
      width: 1058,
      height: 1063,
    },
  },
  {
    name: "PayPal",
    href: "https://www.paypal.me/lukasdurkin",
    qr: {
      src: "/images/registry/paypal-qr.png",
      alt: "PayPal QR code for wedding gifts",
      width: 810,
      height: 831,
    },
  },
  {
    name: "Bitcoin",
    address: "3MFhRzzzZDpkcDnrYhVssYfchwBt8kfxap",
    qr: {
      src: "/images/registry/bitcoin-qr.png",
      alt: "Bitcoin receiving QR code for wedding gifts",
      width: 500,
      height: 508,
    },
  },
];

export function RegistrySection() {
  return (
    <section
      id="registry"
      aria-labelledby="registry-heading"
      className="scroll-mt-0 border-t border-limestone bg-parchment/50 px-6 py-10 sm:px-10 lg:px-10 lg:py-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-brass">
            For our next chapter
          </p>
          <h2
            id="registry-heading"
            className="mt-3 font-display text-5xl font-medium"
          >
            Registry
          </h2>
          <p className="mt-4 font-display text-3xl">
            Your presence at our wedding is the greatest gift!
          </p>
          <p className="mx-auto mt-3 max-w-3xl font-sans text-sm leading-6 text-muted">
            We love our cozy Philadelphia apartment, but as we prepare to move
            back home to be closer to the people we love, we’re keeping extra
            belongings to a minimum. If you’d like to give a gift, a contribution
            toward our next chapter would be deeply appreciated and help make
            our move a little easier. Most of all, we’re grateful to celebrate
            with you!
          </p>
          <div aria-hidden="true" className="my-4 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-limestone" />
            <span className="h-2 w-2 rotate-45 border border-brass" />
            <span className="h-px w-16 bg-limestone" />
          </div>
        </div>

        <h3 className="text-center font-display text-3xl">Ways to Give</h3>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
          {contributionOptions.map(({ name, href, qr, address }) => (
            <li
              key={name}
              className="grid min-w-0 justify-items-center gap-3 border border-limestone bg-ivory p-4 text-center"
            >
              <h4 className="font-display text-3xl">{name}</h4>
                  <Image
                    src={qr.src}
                    alt={qr.alt}
                    width={qr.width}
                    height={qr.height}
                    unoptimized
                    className="h-60 w-full max-w-60 object-contain"
                  />
                  <div className="w-full min-w-0">
                  {address && (
                    <div className="w-full min-w-0">
                      <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted">
                        Bitcoin (BTC) address
                      </p>
                      <code className="mt-1 block select-all break-all text-xs leading-5 text-charcoal">
                        {address}
                      </code>
                    </div>
                  )}
                  {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-3 border-b border-brass font-sans text-xs uppercase tracking-[0.2em] text-charcoal transition-colors hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
                  >
                    Open {name} <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  )}
                  </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 border border-limestone bg-ivory px-4 py-4 text-center">
          <p className="font-sans text-xs uppercase tracking-[0.25em] text-brass">
            A few things for our future home
          </p>
          <h3 className="mt-2 font-display text-4xl font-semibold italic sm:text-5xl">
            <a
              href="https://www.amazon.com/wedding/guest-view/2E35SEC0SJK23"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[#947023] decoration-1 underline-offset-8 transition-colors duration-200 hover:text-charcoal hover:underline focus-visible:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass motion-reduce:transition-none"
            >
              Amazon Registry
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </h3>
          <p className="mt-1 font-sans text-sm leading-6 text-muted">
            We’ve put together a small registry for our next chapter.
          </p>
        </div>
      </div>
    </section>
  );
}
