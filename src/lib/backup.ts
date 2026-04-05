import fs from "fs";
import path from "path";

/**
 * Creates a backup of the SQLite database file in the backups directory.
 * Returns the path to the backup file.
 */
export async function createDatabaseBackup(): Promise<string | null> {
  try {
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    
    // Check if DB exists (SQLite mode)
    if (!fs.existsSync(dbPath)) {
      console.warn("Database file not found at", dbPath);
      return null;
    }

    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    fs.copyFileSync(dbPath, backupPath);
    
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

    console.warn(`Database backup created at ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error("Failed to create database backup:", error);
    return null;
  }
}
