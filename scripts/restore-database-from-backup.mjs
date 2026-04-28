import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

const MAX_RESTORE_ZIP_SIZE = 200 * 1024 * 1024;
const MAX_RESTORE_ENTRIES = 5000;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(message);
}

function resolveSqliteDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return path.join(process.cwd(), "dev.db");
  }

  if (!databaseUrl.startsWith("file:")) {
    fail("Script restore manual hanya mendukung DATABASE_URL SQLite (file:...).");
  }

  const rawPath = databaseUrl.slice("file:".length);
  return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
}

function isAllowedRestoreEntry(entryName) {
  return entryName === "dev.db" || entryName.startsWith("uploads/");
}

function movePath(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }

  fs.renameSync(src, dest);
  return true;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const zipFileArg = process.argv[2];
if (!zipFileArg) {
  fail("Gunakan: node scripts/restore-database-from-backup.mjs <path-to-backup.zip>");
}

const zipPath = path.resolve(process.cwd(), zipFileArg);
if (!fs.existsSync(zipPath)) {
  fail(`File backup tidak ditemukan: ${zipPath}`);
}

const zipStat = fs.statSync(zipPath);
if (zipStat.size <= 0) {
  fail("File backup kosong.");
}
if (zipStat.size > MAX_RESTORE_ZIP_SIZE) {
  fail("Ukuran file backup terlalu besar. Maksimal 200MB.");
}

let zip;
try {
  zip = new AdmZip(zipPath);
} catch {
  fail("Format ZIP tidak valid.");
}

const zipEntries = zip.getEntries();
if (zipEntries.length === 0) {
  fail("ZIP restore kosong.");
}
if (zipEntries.length > MAX_RESTORE_ENTRIES) {
  fail("ZIP restore berisi terlalu banyak file.");
}

const invalidEntry = zipEntries.find((entry) => !isAllowedRestoreEntry(entry.entryName));
if (invalidEntry) {
  fail(`ZIP restore mengandung file tidak diizinkan: ${invalidEntry.entryName}`);
}

const dbEntries = zipEntries.filter((entry) => !entry.isDirectory && entry.entryName === "dev.db");
const dbEntry = dbEntries[0];
if (dbEntries.length !== 1 || !dbEntry) {
  fail("Backup harus berisi tepat satu file database bernama dev.db di root ZIP.");
}

const timestamp = Date.now();
const stagingDir = path.join(process.cwd(), "tmp", `restore-staging-${timestamp}`);
const backupDir = path.join(process.cwd(), "backups");
const dbPath = resolveSqliteDatabasePath();
const uploadsPath = path.join(process.cwd(), "public", "uploads");
const stagedDbPath = path.join(stagingDir, "dev.db");
const stagedUploadsDir = path.join(stagingDir, "uploads");

ensureDir(stagingDir);
ensureDir(backupDir);

info(`Menyiapkan restore dari ${zipPath}`);
info(`Target database: ${dbPath}`);

const dbBuffer = dbEntry.getData();
if (dbBuffer.length === 0) {
  fail("File database pada backup kosong.");
}
fs.writeFileSync(stagedDbPath, dbBuffer);

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

if (fs.existsSync(dbPath)) {
  const backupPath = path.join(backupDir, `pre-restore-${timestamp}.db`);
  fs.copyFileSync(dbPath, backupPath);
  info(`Backup database saat ini dibuat: ${backupPath}`);
}

const oldDbPath = `${dbPath}.old-${timestamp}`;
const oldUploadsPath = `${uploadsPath}-old-${timestamp}`;

let dbMovedToOld = false;
let uploadsMovedToOld = false;

try {
  if (fs.existsSync(dbPath)) {
    movePath(dbPath, oldDbPath);
    dbMovedToOld = true;
    for (const suffix of ["-wal", "-shm", "-journal"]) {
      const sidecar = dbPath + suffix;
      if (fs.existsSync(sidecar)) {
        try {
          fs.unlinkSync(sidecar);
        } catch {}
      }
    }
  }

  movePath(stagedDbPath, dbPath);

  if (fs.existsSync(stagedUploadsDir)) {
    if (fs.existsSync(uploadsPath)) {
      movePath(uploadsPath, oldUploadsPath);
      uploadsMovedToOld = true;
    }
    movePath(stagedUploadsDir, uploadsPath);
  }

  if (dbMovedToOld && fs.existsSync(oldDbPath)) {
    fs.rmSync(oldDbPath, { force: true });
  }
  if (uploadsMovedToOld && fs.existsSync(oldUploadsPath)) {
    fs.rmSync(oldUploadsPath, { recursive: true, force: true });
  }

  info("Restore database selesai.");
  info("Sebelum menjalankan aplikasi lagi, pastikan tidak ada proses lain yang masih membuka file database lama.");
} catch (error) {
  console.error("Restore gagal, mencoba rollback...", error);

  try {
    if (uploadsMovedToOld && fs.existsSync(oldUploadsPath)) {
      if (fs.existsSync(uploadsPath)) {
        fs.rmSync(uploadsPath, { recursive: true, force: true });
      }
      movePath(oldUploadsPath, uploadsPath);
    }

    if (dbMovedToOld && fs.existsSync(oldDbPath)) {
      if (fs.existsSync(dbPath)) {
        fs.rmSync(dbPath, { force: true });
      }
      movePath(oldDbPath, dbPath);
    }
  } catch (rollbackError) {
    console.error("Rollback juga gagal:", rollbackError);
  }

  fail(error instanceof Error ? error.message : "Gagal memulihkan database.");
} finally {
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}
