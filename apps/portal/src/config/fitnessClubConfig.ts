// apps/portal/src/config/fitnessClubConfig.ts
import { PortalConfig } from "./types";

export const fitnessClubConfig: PortalConfig = {
  id: "fitness-club-v1",
  preset: "generic",
  platformName: "Peak Performance Hub",
  organizationName: "Peak Performance",
  heroTitle: "Transform Your Fitness Journey",
  heroSubtitle:
    "Join a community of athletes and fitness enthusiasts committed to reaching their peak.",
  authOptions: ["email-password", "google"],
  membershipTiers: [
    {
      id: "tier1",
      name: "Starter",
      description: "Get started with the basics.",
      features: ["Gym access (off-peak)", "Locker rental", "Basic fitness assessment"]
    },
    {
      id: "tier2",
      name: "Pro",
      description: "For serious fitness enthusiasts.",
      features: ["24/7 gym access", "Group classes", "Nutrition consultation", "Guest passes"]
    },
    {
      id: "tier3",
      name: "Elite",
      description: "Premium training experience.",
      features: ["Personal training sessions", "Recovery suite access", "Priority class booking", "Custom meal plans"]
    },
    {
      id: "tier4",
      name: "Champion",
      description: "All-inclusive athletic excellence.",
      features: ["Unlimited personal training", "Sports massage therapy", "Competition prep", "VIP lounge access"]
    }
  ],
  sections: [
    { type: "hero", enabled: true, order: 1 },
    { type: "login-card", enabled: true, order: 2 },
    { type: "membership-tiers", enabled: true, order: 3 },
    { type: "features-grid", enabled: true, order: 4 },
    { type: "programs", enabled: true, order: 5 },
    { type: "callout", enabled: true, order: 6 }
  ]
};
