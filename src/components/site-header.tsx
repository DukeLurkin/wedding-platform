import {
  leftNavigation,
  rightNavigation,
} from "@/config/navigation";

import { MobileNavigation } from "@/components/mobile-navigation";

export function SiteHeader() {
  return (
    <header className="relative z-20 w-full border-b border-ivory/20">
      <MobileNavigation />
      <div className="mx-auto hidden max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-x-12 px-12 py-6 md:grid">
        <nav aria-label="Primary navigation" className="justify-self-end">
          <ul className="flex items-center gap-8">
            {leftNavigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="font-sans text-xs uppercase tracking-[0.2em] text-ivory/80 transition-colors hover:text-ivory"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href="#top"
          aria-label="Kelly and Luke home"
          className="font-display text-2xl font-medium text-ivory"
        >
          K <span className="text-champagne">|</span> L
        </a>

        <nav aria-label="Wedding navigation" className="justify-self-start">
          <ul className="flex items-center gap-8">
            {rightNavigation.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="font-sans text-xs uppercase tracking-[0.2em] text-ivory/80 transition-colors hover:text-ivory"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}