import Image from "next/image";

import { SiteHeader } from "@/components/site-header";

export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
      <Image
        src="/images/hero/hero-background.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-charcoal/20"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(40,36,31,0.12)_0%,rgba(40,36,31,0.06)_45%,rgba(40,36,31,0.35)_100%)]"
      />

      <SiteHeader />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-6 pb-20 pt-12 sm:px-8 lg:px-12">
        <div className="text-center text-ivory drop-shadow-lg">
          <p className="font-sans text-sm uppercase tracking-[0.3em] text-ivory/80">
            April 11, 2027
          </p>

          <h1 className="mt-6 font-display text-6xl font-medium sm:text-7xl lg:text-8xl">
            Kelly &amp; Luke
          </h1>

          <p className="mt-6 font-sans text-base text-ivory/80 sm:text-lg">
            The Water Works · Philadelphia, Pennsylvania
          </p>
        </div>
      </div>
    </section>
  );
}