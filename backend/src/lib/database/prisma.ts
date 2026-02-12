import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    errorFormat: "pretty",
  });

// Handle Prisma connection errors gracefully
prisma.$on("error" as never, (e: any) => {
  console.error("[Prisma] Database error:", e);
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
