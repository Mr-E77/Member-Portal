// apps/portal/src/components/sections/HeroSection.tsx
"use client";

import { PortalConfig } from "@/config/types";
import { Button } from "@mre/ui";
import { signIn } from "next-auth/react";

interface HeroSectionProps {
  config: PortalConfig;
}

export function HeroSection({ config }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-24 px-4 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in">
          {config.heroTitle}
        </h1>
        <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed opacity-95">
          {config.heroSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="primary"
            onClick={() => signIn()}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            onClick={() => signIn()}
            className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold transition-all"
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}
