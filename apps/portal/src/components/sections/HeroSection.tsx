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
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">{config.heroTitle}</h1>
        <p className="text-xl mb-8 max-w-3xl mx-auto">{config.heroSubtitle}</p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="primary"
            onClick={() => signIn()}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            onClick={() => signIn()}
            className="border-white text-white hover:bg-white hover:text-blue-600"
          >
            Create Account
          </Button>
        </div>
      </div>
    </section>
  );
}
