import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { resolveSqliteDatabasePath } from "@/lib/database-path";
import { prisma } from "@/lib/prisma";

const MAX_RESTORE_ZIP_SIZE = 200 * 1024 * 1024;
const MAX_RESTORE_ENTRIES = 5000;

function isAllowedRestoreEntry(entryName: string) {
  return entryName === "dev.db" || entryName.startsWith("uploads/");
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function restoreDatabaseFromZip(zipBuffer: Buffer): Promise<{ success: boolean; message: string }> {
  const timestamp = Date.now();
  const stagingDir = path.join(/* turbopackIgnore: true */ process.cwd(), "tmp", `restore-staging-${timestamp}`);
  const backupDir = path.join(/* turbopackIgnore: true */ process.cwd(), "backups");
  const dbPath = resolveSqliteDatabasePath();
  const uploadsPath = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
  const stagedDbPath = path.join(stagingDir, "dev.db");
  const stagedUploadsDir = path.join(stagingDir, "uploads");

  try {
    if (zipBuffer.length > MAX_RESTORE_ZIP_SIZE) {
      throw new Error("Ukuran file backup terlalu besar. Maksimal 200MB.");
    }

    let zip: AdmZip;
    try {
      zip = new AdmZip(zipBuffer);
    } catch {
      throw new Error("Format ZIP tidak valid.");
    }

    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) {
      throw new Error("ZIP restore kosong.");
    }
    if (zipEntries.length > MAX_RESTORE_ENTRIES) {
      throw new Error("ZIP restore berisi terlalu banyak file.");
    }

    const invalidEntry = zipEntries.find((entry) => !isAllowedRestoreEntry(entry.entryName));
    if (invalidEntry) {
      throw new Error(`ZIP restore mengandung file tidak diizinkan: ${invalidEntry.entryName}`);
    }

    const dbEntries = zipEntries.filter((entry) => !entry.isDirectory && entry.entryName === "dev.db");
    if (dbEntries.length !== 1) {
      throw new Error("Backup harus berisi tepat satu file database bernama dev.db di root ZIP.");
    }

    ensureDir(stagingDir);
    ensureDir(backupDir);

    // Extract to staging
    const dbEntry = dbEntries[0];
    fs.writeFileSync(stagedDbPath, dbEntry.getData());

    const uploadEntries = zipEntries.filter((entry) => entry.entryName.startsWith("uploads/"));
    if (uploadEntries.length > 0) {
      ensureDir(stagedUploadsDir);
      for (const entry of uploadEntries) {
        if (entry.isDirectory) continue;
        const relPath = entry.entryName.replace(/^uploads\//, "");
        const target = path.join(stagedUploadsDir, relPath);
        const targetParent = path.dirname(target);
        ensureDir(targetParent);
        fs.writeFileSync(target, entry.getData());
      }
    }

    // Disconnect Prisma before file operations
    await prisma.$disconnect();

    // Backup current DB
    if (fs.existsSync(dbPath)) {
      const preRestoreBackup = path.join(backupDir, `pre-restore-${timestamp}.db`);
      fs.copyFileSync(dbPath, preRestoreBackup);
    }

    // Replace files
    // Note: On Windows, this might fail if the server still holds a handle
    // We use copy instead of rename to minimize EBUSY issues, though it's still risky
    
    // Replace DB
    fs.copyFileSync(stagedDbPath, dbPath);
    
    // Sidecar files cleanup
    for (const suffix of ["-wal", "-shm", "-journal"]) {
      const sidecar = dbPath + suffix;
      if (fs.existsSync(sidecar)) {
        try { fs.unlinkSync(sidecar); } catch {}
      }
    }

    // Replace Uploads
    if (fs.existsSync(stagedUploadsDir)) {
      // For simplicity, we just merge/overwrite uploads
      const extractUploads = (src: string, dest: string) => {
        const items = fs.readdirSync(src);
        for (const item of items) {
          const srcItem = path.join(src, item);
          const destItem = path.join(dest, item);
          if (fs.statSync(srcItem).isDirectory()) {
            ensureDir(destItem);
            extractUploads(srcItem, destItem);
          } else {
            fs.copyFileSync(srcItem, destItem);
          }
        }
      };
      ensureDir(uploadsPath);
      extractUploads(stagedUploadsDir, uploadsPath);
    }

    return { success: true, message: "Restore database dan arsip berhasil." };
  } catch (error: any) {
    console.error("Restore failed:", error);
    return { success: false, message: error.message || "Gagal memulihkan database." };
  } finally {
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
  }
}
