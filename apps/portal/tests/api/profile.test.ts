// tests/api/profile.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/profile/route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Mock dependencies
vi.mock("next-auth/next");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("Profile API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/profile", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return user profile when authenticated", async () => {
      const mockSession = {
        user: { email: "test@example.com" },
      };
      const mockUser = {
        name: "Test User",
        email: "test@example.com",
        membershipTier: "tier1",
        image: null,
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        select: {
          name: true,
          email: true,
          membershipTier: true,
          image: true,
        },
      });
    });

    it("should return 404 if user not found", async () => {
      const mockSession = {
        user: { email: "test@example.com" },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("PATCH /api/profile", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: "New Name" }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should update user profile when authenticated", async () => {
      const mockSession = {
        user: { email: "test@example.com" },
      };
      const updatedUser = {
        name: "Updated Name",
        email: "test@example.com",
        membershipTier: "tier1",
        image: null,
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const request = new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ 
          name: "Updated Name"
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe("Updated Name");
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it("should only update allowed fields", async () => {
      const mockSession = {
        user: { email: "test@example.com" },
      };
      const updatedUser = {
        name: "New Name",
        email: "test@example.com",
        membershipTier: "tier1",
        image: null,
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any);

      const request = new Request("http://localhost:3000/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ 
          name: "New Name",
          email: "hacker@evil.com", // Should be ignored
          id: "new-id", // Should be ignored
        }),
      });

      await PATCH(request);

      const updateCall = vi.mocked(prisma.user.update).mock.calls[0][0];
      expect(updateCall.data).toEqual({ name: "New Name" });
      expect(updateCall.data).not.toHaveProperty("email");
      expect(updateCall.data).not.toHaveProperty("id");
    });
  });
});
