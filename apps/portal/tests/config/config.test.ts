// tests/config/config.test.ts
import { describe, it, expect } from "vitest";
import { getStaticConfig } from "@/config";
import { genericConfig } from "@/config/genericConfig";
import { campusSoundConfig } from "@/config/campusSoundConfig";
import { techStartupConfig } from "@/config/techStartupConfig";
import { fitnessClubConfig } from "@/config/fitnessClubConfig";

describe("Configuration System", () => {
  describe("getStaticConfig", () => {
    it("should return generic config by default", () => {
      const config = getStaticConfig("generic");
      expect(config).toEqual(genericConfig);
      expect(config.platformName).toBe("Mr.E Generic Membership Platform");
      expect(config.preset).toBe("generic");
    });

    it("should return campus sound config when requested", () => {
      const config = getStaticConfig("campus-sound");
      expect(config).toEqual(campusSoundConfig);
      expect(config.platformName).toBe("Campus Sound United Portal");
      expect(config.preset).toBe("campus-sound");
    });

    it("should return tech startup config when requested", () => {
      const config = getStaticConfig("tech-startup");
      expect(config).toEqual(techStartupConfig);
      expect(config.platformName).toBe("TechHub Member Portal");
      expect(config.preset).toBe("generic");
    });

    it("should return fitness club config when requested", () => {
      const config = getStaticConfig("fitness-club");
      expect(config).toEqual(fitnessClubConfig);
      expect(config.platformName).toBe("Peak Performance Hub");
      expect(config.preset).toBe("generic");
    });

    it("should fall back to generic config for invalid preset", () => {
      const config = getStaticConfig("invalid" as any);
      expect(config).toEqual(genericConfig);
    });
  });

  describe("Config Structure Validation", () => {
    const configs = [
      { name: "generic", config: genericConfig },
      { name: "campus-sound", config: campusSoundConfig },
      { name: "tech-startup", config: techStartupConfig },
      { name: "fitness-club", config: fitnessClubConfig },
    ];

    configs.forEach(({ name, config }) => {
      describe(`${name} config`, () => {
        it("should have required fields", () => {
          expect(config).toHaveProperty("id");
          expect(config).toHaveProperty("preset");
          expect(config).toHaveProperty("platformName");
          expect(config).toHaveProperty("organizationName");
          expect(config).toHaveProperty("heroTitle");
          expect(config).toHaveProperty("heroSubtitle");
          expect(config).toHaveProperty("authOptions");
          expect(config).toHaveProperty("membershipTiers");
        });

        it("should have valid membership tiers", () => {
          expect(config.membershipTiers).toBeInstanceOf(Array);
          expect(config.membershipTiers.length).toBeGreaterThan(0);
          
          config.membershipTiers.forEach((tier) => {
            expect(tier).toHaveProperty("id");
            expect(tier).toHaveProperty("name");
            expect(tier).toHaveProperty("description");
            expect(tier).toHaveProperty("features");
            expect(tier.features).toBeInstanceOf(Array);
            expect(tier.features.length).toBeGreaterThan(0);
          });
        });

        it("should have at least one auth option", () => {
          expect(config.authOptions).toBeInstanceOf(Array);
          expect(config.authOptions.length).toBeGreaterThan(0);
        });

        it("should have non-empty strings for text fields", () => {
          expect(config.platformName.length).toBeGreaterThan(0);
          expect(config.organizationName.length).toBeGreaterThan(0);
          expect(config.heroTitle.length).toBeGreaterThan(0);
          expect(config.heroSubtitle.length).toBeGreaterThan(0);
        });

        it("should have exactly 4 membership tiers", () => {
          expect(config.membershipTiers).toHaveLength(4);
        });

        it("should have unique tier IDs", () => {
          const tierIds = config.membershipTiers.map((t) => t.id);
          const uniqueIds = new Set(tierIds);
          expect(uniqueIds.size).toBe(tierIds.length);
        });
      });
    });
  });
});
