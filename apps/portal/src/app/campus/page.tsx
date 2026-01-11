// apps/portal/src/app/campus/page.tsx
import { campusSoundConfig } from "@/config/campusSoundConfig";
import { HeroSection } from "@/components/sections/HeroSection";
import { LoginCardSection } from "@/components/sections/LoginCardSection";
import { FeaturesGridSection } from "@/components/sections/FeaturesGridSection";
import { MembershipTiersSection } from "@/components/sections/MembershipTiersSection";
import { ProgramsSection } from "@/components/sections/ProgramsSection";
import { CalloutSection } from "@/components/sections/CalloutSection";

export default function CampusPage() {
  const config = campusSoundConfig;

  // Sort sections by order and filter enabled ones
  const sections = config.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const renderSection = (type: string) => {
    switch (type) {
      case "hero":
        return <HeroSection key="hero" config={config} />;
      case "login-card":
        return <LoginCardSection key="login-card" config={config} />;
      case "features-grid":
        return <FeaturesGridSection key="features-grid" />;
      case "membership-tiers":
        return <MembershipTiersSection key="membership-tiers" config={config} />;
      case "programs":
        return <ProgramsSection key="programs" />;
      case "callout":
        return <CalloutSection key="callout" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.platformName}</h1>
            <p className="text-sm text-gray-600">{config.organizationName}</p>
          </div>
        </div>
      </header>
      <main>
        {sections.map((section) => renderSection(section.type))}
      </main>
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; 2026 {config.organizationName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
