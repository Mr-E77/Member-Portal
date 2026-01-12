// apps/portal/src/config/techStartupConfig.ts
import { PortalConfig } from "./types";

export const techStartupConfig: PortalConfig = {
  id: "tech-startup-v1",
  preset: "generic",
  platformName: "TechHub Member Portal",
  organizationName: "TechHub",
  heroTitle: "Join the Future of Innovation",
  heroSubtitle:
    "Connect with founders, investors, and innovators building tomorrow's technology.",
  authOptions: ["email-password", "github", "google"],
  membershipTiers: [
    {
      id: "tier1",
      name: "Explorer",
      description: "Perfect for aspiring entrepreneurs.",
      features: ["Access to events", "Community forums", "Monthly newsletter"]
    },
    {
      id: "tier2",
      name: "Builder",
      description: "For active founders and makers.",
      features: ["Coworking space access", "Mentor matching", "Pitch practice sessions", "Startup toolkit"]
    },
    {
      id: "tier3",
      name: "Innovator",
      description: "For scaling startups.",
      features: ["Priority event access", "Investor intros", "Legal & accounting office hours", "Premium coworking"]
    },
    {
      id: "tier4",
      name: "Visionary",
      description: "For established tech leaders.",
      features: ["Board advisor matching", "LP network access", "Speaking opportunities", "Private events"]
    }
  ],
  sections: [
    { type: "hero", enabled: true, order: 1 },
    { type: "features-grid", enabled: true, order: 2 },
    { type: "membership-tiers", enabled: true, order: 3 },
    { type: "login-card", enabled: true, order: 4 },
    { type: "callout", enabled: true, order: 5 },
    { type: "programs", enabled: false, order: 6 }
  ]
};
