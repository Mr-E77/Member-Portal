// apps/portal/src/config/campusSoundConfig.ts
import { PortalConfig } from "./types";

export const campusSoundConfig: PortalConfig = {
  id: "campus-sound-v1",
  preset: "campus-sound",
  platformName: "Campus Sound United Portal",
  organizationName: "Campus Sound United",
  heroTitle: "Build a campus-to-campus music movement.",
  heroSubtitle:
    "Connect students, bands, and organizers across campuses with a shared member hub.",
  authOptions: ["email-password", "github", "google"],
  membershipTiers: [
    {
      id: "tier1",
      name: "Member",
      description: "Basic access for students and artists.",
      features: ["Campus events access", "Basic community tools"]
    },
    {
      id: "tier2",
      name: "Chapter Builder",
      description: "For leaders launching campus chapters.",
      features: ["Chapter tooling", "Recruitment templates", "Campus guide"]
    },
    {
      id: "tier3",
      name: "Campus Leader",
      description: "For fully‑registered campus orgs.",
      features: ["Multi‑campus coordination", "Priority support", "Fest tools"]
    },
    {
      id: "tier4",
      name: "Alliance Council",
      description: "For alliance‑wide leadership.",
      features: ["Network‑wide controls", "Policy tooling", "Sponsor access"]
    }
  ],
  sections: [
    { type: "hero", enabled: true, order: 1 },
    { type: "login-card", enabled: true, order: 2 },
    { type: "features-grid", enabled: true, order: 3 },
    { type: "programs", enabled: true, order: 4 },
    { type: "membership-tiers", enabled: true, order: 5 },
    { type: "callout", enabled: true, order: 6 }
  ]
};
