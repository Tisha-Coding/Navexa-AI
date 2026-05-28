import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Models that have a `deletedAt` column (soft-delete enabled).
// Keep this in sync with schema.prisma.
const SOFT_DELETE_MODELS = new Set([
  "User",
  "Resume",
  "JobDescription",
  "Analysis",
  "Application",
]);

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({ adapter }).$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SOFT_DELETE_MODELS.has(model)) {
            return query(args);
          }

          // Auto-filter out soft-deleted rows on read operations.
          // (findUnique skipped — `where` must match a unique constraint;
          //  use findFirst when you need the deletedAt filter.)
          const readOps = [
            "findFirst",
            "findFirstOrThrow",
            "findMany",
            "count",
            "aggregate",
            "groupBy",
          ];
          if (readOps.includes(operation)) {
            const a = args as { where?: Record<string, unknown> };
            a.where = { deletedAt: null, ...(a.where ?? {}) };
          }

          return query(args);
        },
      },
    },
  });
}

// Singleton pattern — prevents multiple PrismaClient instances during
// Next.js dev hot-reload (which otherwise exhausts DB connections).
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
