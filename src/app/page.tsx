import { ArchitecturalFrame } from "@/components/architectural-frame";
import { HeroSection } from "@/components/hero-section";

export default function Home() {
  return (
    <ArchitecturalFrame>
      <main id="top" className="min-h-screen bg-ivory text-charcoal">
        <HeroSection />
      </main>
    </ArchitecturalFrame>
  );
}
