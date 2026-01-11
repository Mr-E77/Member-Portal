// apps/portal/src/config/types.ts
export type MembershipTier = {
  id: string;
  name: string;
  description: string;
  features: string[];
};

export type AuthProviderOption = "email-password" | "github" | "google";

export type PortalSectionType =
  | "hero"
  | "login-card"
  | "features-grid"
  | "programs"
  | "membership-tiers"
  | "callout";

export type PortalSectionConfig = {
  type: PortalSectionType;
  enabled: boolean;
  order: number;
};

export type PortalConfig = {
  id: string;
  preset: "generic" | "campus-sound";
  platformName: string;
  organizationName: string;
  heroTitle: string;
  heroSubtitle: string;
  membershipTiers: MembershipTier[];
  authOptions: AuthProviderOption[];
  sections: PortalSectionConfig[];
};
