"use client";

import { useEffect, useRef, useState } from "react";

import { leftNavigation, rightNavigation } from "@/config/navigation";

const sections = [
  { label: "Back to top", href: "#top" },
  ...leftNavigation.filter((item) => item.href !== "#our-story"),
  ...rightNavigation,
];

export function FloatingNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function dismissOutside(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function dismissWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissWithEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissWithEscape);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 sm:right-6"
    >
      {isOpen && (
        <nav
          id="floating-section-navigation"
          aria-label="Jump to a section"
          className="absolute bottom-full right-0 mb-3 max-h-[70dvh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto border border-limestone bg-ivory p-3 text-charcoal shadow-xl"
        >
          <p className="border-b border-limestone px-3 pb-3 pt-1 font-display text-2xl">
            Explore our day
          </p>
          <ul className="pt-2">
            {sections.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => {
                    setIsOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className="flex min-h-11 items-center px-3 font-sans text-xs uppercase tracking-[0.15em] transition-colors hover:bg-parchment hover:text-brass focus-visible:outline-2 focus-visible:outline-brass"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="floating-section-navigation"
        onClick={() => setIsOpen((current) => !current)}
        className="flex min-h-12 items-center gap-3 rounded-full border border-champagne bg-charcoal px-5 font-sans text-xs uppercase tracking-[0.15em] text-ivory shadow-lg transition-colors hover:bg-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass"
      >
        <span aria-hidden="true" className="text-lg">{isOpen ? "×" : "☰"}</span>
        {isOpen ? "Close" : "Sections"}
      </button>
    </div>
  );
}
