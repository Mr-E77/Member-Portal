import { getStaticConfig } from "@/config";
import { HeroSection } from "@/components/sections/HeroSection";
import { LoginCardSection } from "@/components/sections/LoginCardSection";
import { FeaturesGridSection } from "@/components/sections/FeaturesGridSection";
import { MembershipTiersSection } from "@/components/sections/MembershipTiersSection";
import { ProgramsSection } from "@/components/sections/ProgramsSection";
import { CalloutSection } from "@/components/sections/CalloutSection";

export default function Home() {
  const config = getStaticConfig(
    (process.env.NEXT_PUBLIC_PRESET as "generic" | "campus-sound") || "generic"
  );

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
          <h1 className="text-2xl font-bold text-gray-900">{config.platformName}</h1>
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
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
