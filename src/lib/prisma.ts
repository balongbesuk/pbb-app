import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.PRISMA_LOG === "true" ? ["query"] : ["error"],
  });

// Run SQLite WAL mode and optimizations on database initialization
if (!globalForPrisma.prisma) {
  (async () => {
    try {
      await prisma.$executeRawUnsafe("PRAGMA journal_mode = WAL;");
      await prisma.$executeRawUnsafe("PRAGMA synchronous = NORMAL;");
      await prisma.$executeRawUnsafe("PRAGMA busy_timeout = 5000;");
      console.warn("✅ SQLite WAL Mode and synchronous=NORMAL successfully enabled.");
    } catch (err) {
      console.error("❌ Failed to configure SQLite WAL PRAGMAs:", err);
    }
  })();
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
