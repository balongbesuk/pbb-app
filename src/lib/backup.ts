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

    // Pembersihan file sampah dan folder staging di folder tmp
    cleanupTempDirectory();

    console.warn(`Database backup created at ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("Failed to create database backup:", error);
    return null;
  }
}

/**
 * Cleans up temporary files and staging directories in the tmp/ directory
 * that are older than 24 hours.
 */
function cleanupTempDirectory() {
  try {
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) return;

    const items = fs.readdirSync(tmpDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 jam

    for (const item of items) {
      const fullPath = path.join(tmpDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Bersihkan file di dalam folder status job persisten
        if (
          item === "archive-smart-scan-jobs" ||
          item === "archive-restore-jobs" ||
          item === "map-restore-jobs"
        ) {
          const subItems = fs.readdirSync(fullPath);
          for (const subItem of subItems) {
            const subPath = path.join(fullPath, subItem);
            const subStat = fs.statSync(subPath);
            if (now - subStat.mtime.getTime() > maxAge) {
              fs.rmSync(subPath, { recursive: true, force: true });
            }
          }
        } else if (item.startsWith("restore-archive-") || item.startsWith("restore-map-")) {
          // Folder staging ekstraksi bisa dihapus seutuhnya jika sudah usang
          if (now - stat.mtime.getTime() > maxAge) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
        }
      } else {
        // File biasa di folder tmp dihapus jika sudah usang
        if (now - stat.mtime.getTime() > maxAge) {
          fs.rmSync(fullPath, { force: true });
        }
      }
    }
    console.warn("[Temp Cleanup] Cleaned up temporary files and staging directories older than 24 hours.");
  } catch (error) {
    console.error("[Temp Cleanup] Failed to cleanup temp directory:", error);
  }
}
