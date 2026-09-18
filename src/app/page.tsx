import { SiteHeader } from "@/components/site-header";
import { ArchitecturalFrame } from "@/components/architectural-frame";

export default function Home() {
  return (
    <ArchitecturalFrame>
      <main id="top" className="min-h-screen bg-ivory text-charcoal">
        <SiteHeader />

        <div className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
          <section className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
              <p className="font-sans text-sm uppercase tracking-[0.3em] text-muted">
                April 11, 2027
              </p>

              <h1 className="mt-6 font-display text-6xl font-medium sm:text-7xl lg:text-8xl">
                Kelly &amp; Luke
              </h1>

              <p className="mt-6 font-sans text-base text-muted sm:text-lg">
                The Water Works · Philadelphia, Pennsylvania
              </p>
            </div>
          </section>
        </div>
      </main>
    </ArchitecturalFrame>
  );
}
