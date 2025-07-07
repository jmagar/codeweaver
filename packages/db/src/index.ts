// Basic database client export
// This would typically export a Prisma client instance

import { PrismaClient } from "@prisma/client";

// Ensure the Prisma client is not recreated during HMR/dev reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
} 