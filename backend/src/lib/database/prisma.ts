import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "./config";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

/** Production-ready Prisma client with SSL, connection pooling, singleton reuse */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    errorFormat: "pretty",
  });

// Handle Prisma connection errors gracefully (never log credentials)
prisma.$on("error" as never, (e: unknown) => {
  const msg = e instanceof Error ? e.message : "Unknown database error";
  console.error("[Prisma] Database error:", msg);
});

// Reuse single instance in serverless (prevents connection exhaustion)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
