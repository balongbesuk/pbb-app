import fs from "fs";
import path from "path";
import { resolveSqliteDatabasePath } from "@/lib/database-path";
import { prisma } from "@/lib/prisma";

/**
 * Creates a backup of the SQLite database file in the backups directory.
 * Returns the path to the backup file.
 */
export async function createDatabaseBackup(): Promise<string | null> {
  try {
    const dbPath = resolveSqliteDatabasePath();
    
    // Check if DB exists (SQLite mode)
    if (!fs.existsSync(dbPath)) {
      console.warn("Database file not found at", dbPath);
      return null;
    }

    const backupDir = path.join(/* turbopackIgnore: true */ process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
    }

    // Use raw SQLite VACUUM INTO for a safe, non-blocking backup of a live DB in WAL mode
    await prisma.$executeRawUnsafe(`VACUUM INTO '${backupPath.replace(/'/g, "''")}';`);
    
    // Cleanup old backups (keep only last 10)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith(".db"))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 10) {
      files.slice(10).forEach(f => {
        fs.unlinkSync(path.join(backupDir, f.name));
      });
    }

    // Auto-prune audit logs older than 180 days (approx. 6 months)
    try {
      const cutOffDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const deleteResult = await prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: cutOffDate }
        }
      });
      if (deleteResult.count > 0) {
        console.warn(`[Backup Cleanup] Automatically pruned ${deleteResult.count} audit logs older than 180 days.`);
      }
    } catch (pruneError) {
      console.error("[Backup Cleanup] Failed to prune old audit logs:", pruneError);
    }

    console.warn(`Database backup created at ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("Failed to create database backup:", error);
    return null;
  }
}
