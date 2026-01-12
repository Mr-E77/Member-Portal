// tests/lib/prisma.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock the PrismaClient to avoid instantiation errors in tests
vi.mock("@prisma/client", () => {
  const mockPrismaClient = vi.fn(function() {
    return {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      user: {},
      account: {},
      session: {},
      verificationToken: {},
      portalConfigModel: {},
    };
  });
  
  return {
    PrismaClient: mockPrismaClient,
  };
});

describe("Prisma Client", () => {
  it("should export a prisma instance", async () => {
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
  });

  it("should have expected database models", async () => {
    const { prisma } = await import("@/lib/prisma");
    expect(prisma).toHaveProperty("user");
    expect(prisma).toHaveProperty("account");
    expect(prisma).toHaveProperty("session");
    expect(prisma).toHaveProperty("verificationToken");
    expect(prisma).toHaveProperty("portalConfigModel");
  });
});
