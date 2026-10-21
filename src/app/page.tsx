import { ArchitecturalFrame } from "@/components/architectural-frame";
import { HeroSection } from "@/components/hero-section";
import { WeddingSection } from "@/components/wedding-section";
import { TravelSection } from "@/components/travel-section";
import { FaqSection } from "@/components/faq-section";
import { RegistrySection } from "@/components/registry-section";
import { FloatingNavigation } from "@/components/floating-navigation";
import { RsvpSection } from "@/components/rsvp-section";

export default function Home() {
  return (
    <ArchitecturalFrame>
      <main id="top" className="min-h-screen bg-ivory pb-24 text-charcoal">
        <HeroSection />
        <WeddingSection />
        <TravelSection />
        <FaqSection />
        <RegistrySection />
        <RsvpSection />
      </main>
      <FloatingNavigation />
    </ArchitecturalFrame>
  );
}
