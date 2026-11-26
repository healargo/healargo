import { PrismaClient } from "@prisma/client";
import { ensureDatabaseEnv } from "@/lib/db/supabase-database-url";

ensureDatabaseEnv();

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Optional explicit connect helper for scripts / legacy call sites. */
export async function connectDb(): Promise<PrismaClient> {
  ensureDatabaseEnv();
  return prisma;
}
