// apps/portal/src/config/genericConfig.ts
import { PortalConfig } from "./types";

export const genericConfig: PortalConfig = {
  id: "generic-default",
  preset: "generic",
  platformName: "Mr.E Generic Membership Platform",
  organizationName: "Your Organization",
  heroTitle: "Welcome to Your Member Hub",
  heroSubtitle:
    "A flexible membership platform to power your business ventures, communities, and ideas.",
  authOptions: ["email-password", "github", "google"],
  membershipTiers: [
    {
      id: "tier1",
      name: "Starter",
      description: "Intro tier with core access for individuals.",
      features: ["Basic dashboard", "Standard support"]
    },
    {
      id: "tier2",
      name: "Growth",
      description: "For growing teams and early‑stage ventures.",
      features: ["Team spaces", "Priority support", "Basic analytics"]
    },
    {
      id: "tier3",
      name: "Pro",
      description: "Advanced tools for serious operators.",
      features: ["Advanced analytics", "Custom branding", "Extended limits"]
    },
    {
      id: "tier4",
      name: "Elite",
      description: "Top tier with white‑glove support.",
      features: ["Dedicated success manager", "Early feature access", "Enterprise SLAs"]
    }
  ],
  sections: [
    { type: "hero", enabled: true, order: 1 },
    { type: "login-card", enabled: true, order: 2 },
    { type: "features-grid", enabled: true, order: 3 },
    { type: "membership-tiers", enabled: true, order: 4 },
    { type: "programs", enabled: false, order: 5 },
    { type: "callout", enabled: true, order: 6 }
  ]
};
