"use client";

import { useState } from "react";
import { mobileNavigation } from "@/config/navigation";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between px-6 py-5">
        <a
          href="#top"
          aria-label="Kelly and Luke home"
          className="font-display text-2xl font-medium text-charcoal"
        >
          K <span className="text-champagne">|</span> L
        </a>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation-menu"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center"
        >
          <span className="sr-only">
            {isOpen ? "Close menu" : "Open menu"}
          </span>

          <span className="flex w-6 flex-col gap-1.5">
            <span
              className={`h-px w-full bg-charcoal transition-transform ${
                isOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-full bg-charcoal transition-transform ${
                isOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {isOpen && (
        <nav
          id="mobile-navigation-menu"
          aria-label="Mobile navigation"
          className="border-t border-limestone/40 px-6 py-8"
        >
          <ul className="flex flex-col items-center gap-6">
            {mobileNavigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="font-sans text-sm uppercase tracking-[0.2em] text-muted transition-colors hover:text-charcoal"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}