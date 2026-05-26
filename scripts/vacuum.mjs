import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

function getStorageRoot() {
  const customPath = process.env.STORAGE_PATH;
  if (customPath) {
    if (path.isAbsolute(customPath)) {
      return customPath;
    }
    return path.resolve(process.cwd(), customPath);
  }
  return path.join(process.cwd(), "uploads");
}

async function vacuumDatabase() {
  console.log("Starting SQLite Vacuum Maintenance...");
  
  // 1. Vacuum Main Database
  let mainDbPath = process.env.DATABASE_URL?.replace("file:", "");
  if (!mainDbPath) {
    mainDbPath = path.join(process.cwd(), "prisma", "dev.db");
  }
  
  if (fs.existsSync(mainDbPath)) {
    try {
      console.log(`Vacuuming main database at ${mainDbPath}`);
      const db = new Database(mainDbPath);
      // Run wal_checkpoint to truncate WAL file
      db.pragma("wal_checkpoint(TRUNCATE)");
      // Run VACUUM to reclaim space and defragment
      db.exec("VACUUM;");
      db.close();
      console.log("Main database vacuum completed.");
    } catch (error) {
      console.error("Failed to vacuum main database:", error);
    }
  } else {
    console.log(`Main database not found at ${mainDbPath}`);
  }

  // 2. Vacuum Rate Limit Database
  const rateLimitDbPath = path.join(getStorageRoot(), "rate-limit.db");
  if (fs.existsSync(rateLimitDbPath)) {
    try {
      console.log(`Vacuuming rate limit database at ${rateLimitDbPath}`);
      const rateDb = new Database(rateLimitDbPath);
      rateDb.pragma("wal_checkpoint(TRUNCATE)");
      rateDb.exec("VACUUM;");
      rateDb.close();
      console.log("Rate limit database vacuum completed.");
    } catch (error) {
      console.error("Failed to vacuum rate limit database:", error);
    }
  }
  
  console.log("SQLite Vacuum Maintenance Finished.");
}

vacuumDatabase();
