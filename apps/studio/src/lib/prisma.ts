// apps/studio/src/lib/prisma.ts
// Reference the portal's generated Prisma client
import { PrismaClient } from "../../../portal/node_modules/@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
