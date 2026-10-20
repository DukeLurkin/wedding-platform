import { ArchitecturalFrame } from "@/components/architectural-frame";
import { HeroSection } from "@/components/hero-section";
import { WeddingSection } from "@/components/wedding-section";
import { TravelSection } from "@/components/travel-section";

export default function Home() {
  return (
    <ArchitecturalFrame>
      <main id="top" className="min-h-screen bg-ivory text-charcoal">
        <HeroSection />
        <WeddingSection />
        <TravelSection />
      </main>
    </ArchitecturalFrame>
  );
}
