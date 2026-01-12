// tests/integration/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

describe("Database Integration", () => {
  let prisma: PrismaClient;
  let pool: pg.Pool;

  beforeAll(() => {
    const databaseUrl =
      process.env.DATABASE_URL ||
      "postgresql://mreuser:mrepassword@localhost:5432/mre_portal";
    pool = new pg.Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  describe("User Model", () => {
    it("should create and retrieve a user", async () => {
      const testUser = await prisma.user.create({
        data: {
          email: "integration-test@example.com",
          name: "Integration Test User",
          membershipTier: "tier1",
        },
      });

      expect(testUser).toHaveProperty("id");
      expect(testUser.email).toBe("integration-test@example.com");
      expect(testUser.name).toBe("Integration Test User");
      expect(testUser.membershipTier).toBe("tier1");

      const retrieved = await prisma.user.findUnique({
        where: { email: "integration-test@example.com" },
      });

      expect(retrieved).toMatchObject(testUser);

      // Cleanup
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    });

    it("should enforce unique email constraint", async () => {
      const email = "unique-test@example.com";

      const user1 = await prisma.user.create({
        data: {
          email,
          name: "User 1",
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email,
            name: "User 2",
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.user.delete({ where: { id: user1.id } });
    });

    it("should update user membershipTier", async () => {
      const user = await prisma.user.create({
        data: {
          email: "tier-test@example.com",
          name: "Tier Test",
          membershipTier: "tier1",
        },
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { membershipTier: "tier3" },
      });

      expect(updated.membershipTier).toBe("tier3");

      // Cleanup
      await prisma.user.delete({ where: { id: user.id } });
    });
  });

  describe("PortalConfigModel", () => {
    it("should retrieve seeded portal configs", async () => {
      const configs = await prisma.portalConfigModel.findMany();

      expect(configs.length).toBeGreaterThan(0);

      const genericConfig = configs.find(
        (c) => c.id === "generic-default"
      );
      expect(genericConfig).toBeDefined();
      expect(genericConfig?.preset).toBe("generic");
    });

    it("should have all expected preset configs", async () => {
      const expectedIds = [
        "generic-default",
        "campus-sound-united",
        "tech-startup-hub",
        "fitness-club",
      ];

      for (const id of expectedIds) {
        const config = await prisma.portalConfigModel.findUnique({
          where: { id },
        });

        expect(config).toBeDefined();
        expect(config?.data).toBeDefined();
      }
    });
  });

  describe("Demo Users", () => {
    it("should have seeded demo users", async () => {
      const demoEmails = [
        "alice@example.com",
        "bob@example.com",
        "carol@example.com",
        "david@example.com",
      ];

      for (const email of demoEmails) {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        expect(user).toBeDefined();
        expect(user?.membershipTier).toMatch(/^tier[1-4]$/);
      }
    });

    it("should have demo users with different tiers", async () => {
      const users = await prisma.user.findMany({
        where: {
          email: {
            in: [
              "alice@example.com",
              "bob@example.com",
              "carol@example.com",
              "david@example.com",
            ],
          },
        },
      });

      const tiers = users.map((u) => u.membershipTier);
      const uniqueTiers = new Set(tiers);

      expect(uniqueTiers.size).toBe(4);
      expect(uniqueTiers).toContain("tier1");
      expect(uniqueTiers).toContain("tier2");
      expect(uniqueTiers).toContain("tier3");
      expect(uniqueTiers).toContain("tier4");
    });
  });
});
