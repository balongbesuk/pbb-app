import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { exec } from "child_process";
import { promisify } from "util";
import { resolveSafeChildPath } from "@/lib/file-security";

const execAsync = promisify(exec);
const MAX_RESTORE_ZIP_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_RESTORE_ENTRIES = 5000;

function isAllowedRestoreEntry(entryName: string): boolean {
  return entryName === "dev.db" || entryName.startsWith("uploads/");
}

export async function POST(req: NextRequest) {
  try {
    // --- AUTH CHECK ---
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    if (file.size <= 0) {
      return NextResponse.json({ error: "File restore kosong." }, { status: 400 });
    }
    if (file.size > MAX_RESTORE_ZIP_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file restore terlalu besar. Maksimal 200MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch (e) {
      return NextResponse.json({ error: "Format ZIP tidak valid" }, { status: 400 });
    }

    // --- STEP 1: VALIDASI ISI ZIP ---
    const zipEntries = zip.getEntries();
    if (zipEntries.length === 0) {
      return NextResponse.json({ error: "ZIP restore kosong." }, { status: 400 });
    }
    if (zipEntries.length > MAX_RESTORE_ENTRIES) {
      return NextResponse.json(
        { error: "ZIP restore berisi terlalu banyak file." },
        { status: 400 }
      );
    }

    const invalidEntry = zipEntries.find((entry) => !isAllowedRestoreEntry(entry.entryName));
    if (invalidEntry) {
      return NextResponse.json(
        { error: `ZIP restore mengandung file tidak diizinkan: ${invalidEntry.entryName}` },
        { status: 400 }
      );
    }

    const dbEntries = zipEntries.filter((entry) => !entry.isDirectory && entry.entryName === "dev.db");
    const dbEntry = dbEntries[0];

    if (dbEntries.length !== 1 || !dbEntry) {
      return NextResponse.json(
        { error: "Backup harus berisi tepat satu file database bernama dev.db di root ZIP." },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const stagingDir = path.join(process.cwd(), "tmp", `restore-staging-${timestamp}`);
    const backupDir = path.join(process.cwd(), "backups");
    
    if (!fs.existsSync(stagingDir)) fs.mkdirSync(stagingDir, { recursive: true });
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const uploadsPath = path.join(process.cwd(), "public", "uploads");

    // --- STEP 2: EKSTRAK KE STAGING DIRECTORY ---
    console.log("[Restore] Staging files...");
    const stagedDbPath = path.join(stagingDir, "dev.db");
    const stagedUploadsDir = path.join(stagingDir, "uploads");

    // 1. Ekstrak data DB ke staging
    const dbBuffer = dbEntry.getData();
    if (dbBuffer.length === 0) {
      return NextResponse.json({ error: "File database pada backup kosong." }, { status: 400 });
    }
    fs.writeFileSync(stagedDbPath, dbBuffer);

    // 2. Ekstrak folder uploads ke staging
    const uploadEntries = zipEntries.filter(entry => entry.entryName.startsWith("uploads/"));
    if (uploadEntries.length > 0) {
      if (!fs.existsSync(stagedUploadsDir)) fs.mkdirSync(stagedUploadsDir, { recursive: true });
      for (const entry of uploadEntries) {
        if (entry.isDirectory) continue;

        const relPath = entry.entryName.replace(/^uploads\//, "");
        const target = resolveSafeChildPath(stagedUploadsDir, relPath);
        const targetParent = path.dirname(target);

        if (!fs.existsSync(targetParent)) fs.mkdirSync(targetParent, { recursive: true });
        fs.writeFileSync(target, entry.getData());
      }
    }

    // --- STEP 3: BACKUP DATABASE SAAT INI ---
    if (fs.existsSync(dbPath)) {
        console.log("[Restore] Backing up current DB...");
        const backupPath = path.join(backupDir, `pre-restore-${timestamp}.db`);
        fs.copyFileSync(dbPath, backupPath);
    }

    // --- STEP 4: ATOMIC SWAP (RENAME & REPLACE) WITH ROLLBACK ---
    console.log("[Restore] Preparing atomic swap (Strong Mode for Windows)...");
    
    // 1. Matikan mode WAL (Write-Ahead Logging) agar file -wal dan -shm bersih
    try {
      await prisma.$executeRawUnsafe('PRAGMA journal_mode = DELETE;');
      console.log("[Restore] Database journal mode set to DELETE.");
    } catch (e) {
      console.warn("[Restore] Warning: Gagal menonaktifkan WAL mode:", e);
    }

    // 2. Matikan koneksi Prisma secara total
    try {
      await prisma.$disconnect();
      console.log("[Restore] Prisma connection closed.");
    } catch (e) {
      console.warn("[Restore] Error during disconnect:", e);
    }

    // 3. FORCE KILL Query Engine (Windows Specific) untuk membebaskan lock
    if (process.platform === "win32") {
        try {
            console.log("[Restore] Force killing query engine to release handles...");
            await execAsync('taskkill /F /IM query-engine-windows.exe /T').catch(() => {});
            // Beri jeda ekstra agar proses benar-benar mati
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {}
    }

    // 4. Beri jeda 3 detik
    await new Promise(resolve => setTimeout(resolve, 3000));

    const oldDbPath = `${dbPath}.old-${timestamp}`;
    const oldUploadsPath = `${uploadsPath}-old-${timestamp}`;
    
    let dbMovedToOld = false;
    let dbStagedToLive = false;
    let uploadsMovedToOld = false;
    let uploadsStagedToLive = false;

    // Fungsi pembantu menggunakan CMD MOVE (Terkadang lebih sakti di Windows)
    const moveTask = async (src: string, dest: string, retries = 20, initialDelay = 1000) => {
        if (!fs.existsSync(src)) return false;
        
        for (let i = 0; i < retries; i++) {
            try {
                // Taktik 1: Pakai fs.renameSync (Standar)
                fs.renameSync(src, dest);
                return true;
            } catch (err: any) {
                if (err.code === 'EBUSY' || err.code === 'EPERM') {
                    console.log(`[Restore] [Attempt ${i+1}/${retries}] File busy (${err.code}), trying OS move command...`);
                    try {
                        // Taktik 2: Pakai CMD MOVE (Seringkali lebih agresif)
                        await execAsync(`cmd /c move /Y "${src}" "${dest}"`);
                        return true;
                    } catch (cmdErr) {
                        // Taktik 3: Jika ini file (bukan folder) dan masih gagal, coba COPY + OVERWRITE (Fallback terakhir)
                        if (i > retries / 2 && !fs.lstatSync(src).isDirectory()) {
                            try {
                                console.log(`[Restore] [Attempt ${i+1}/${retries}] Move still blocked, trying copy-overwrite...`);
                                fs.copyFileSync(src, dest);
                                return true;
                            } catch (copyErr) {}
                        }

                        if (i < retries - 1) {
                            const waitTime = initialDelay + (i * 200); 
                            await new Promise(r => setTimeout(r, waitTime));
                            continue;
                        }
                    }
                }
                if (i < retries - 1) {
                   await new Promise(r => setTimeout(r, initialDelay));
                   continue;
                }
                throw err;
            }
        }
        return false;
    };

    let schemaSyncWarning: string | null = null;

    try {
        console.log("[Restore] Swapping database file (Resilient Mode)...");
        // 1. Swap Database
        if (fs.existsSync(dbPath)) {
            try {
                await moveTask(dbPath, oldDbPath);
                dbMovedToOld = true;
            } catch (e) {
                console.warn("[Restore] Gagal memindahkan database lama ke backup, mencoba langsung timpa...");
            }
            
            // Sidecars Cleanup
            for (const suffix of ['-wal', '-shm', '-journal']) {
                const sidecar = dbPath + suffix;
                if (fs.existsSync(sidecar)) {
                    try { fs.unlinkSync(sidecar); } catch (e) {}
                }
            }
        }
        
        // Pindahkan dari staging ke live
        try {
            await moveTask(stagedDbPath, dbPath);
            dbStagedToLive = true;
        } catch (e: any) {
            console.log("[Restore] Swap-in gagal via MOVE, mencoba FORCE-COPY...");
            fs.copyFileSync(stagedDbPath, dbPath);
            dbStagedToLive = true;
        }

        console.log("[Restore] Swapping uploads folder...");
        // 2. Swap Uploads
        if (fs.existsSync(stagedUploadsDir)) {
          if (fs.existsSync(uploadsPath)) {
              await moveTask(uploadsPath, oldUploadsPath);
              uploadsMovedToOld = true;
          }
          await moveTask(stagedUploadsDir, uploadsPath);
          uploadsStagedToLive = true;
        }
        
        // Success cleanup
        if (dbMovedToOld && dbStagedToLive && fs.existsSync(oldDbPath)) {
          try { fs.unlinkSync(oldDbPath); } catch (e) {}
        }
        if (uploadsMovedToOld && uploadsStagedToLive && fs.existsSync(oldUploadsPath)) {
          try { fs.rmSync(oldUploadsPath, { recursive: true, force: true }); } catch(e) {}
        }
        
    } catch (swapError: any) {
        console.error("[Restore] SWAP FAILED!", swapError);
        // Rollback...
        try {
            if (uploadsMovedToOld && fs.existsSync(oldUploadsPath)) {
                if (fs.existsSync(uploadsPath)) fs.rmSync(uploadsPath, { recursive: true, force: true });
                await execAsync(`cmd /c move /Y "${oldUploadsPath}" "${uploadsPath}"`).catch(() => {});
            }
            if (dbMovedToOld && fs.existsSync(oldDbPath)) {
                await execAsync(`cmd /c move /Y "${oldDbPath}" "${dbPath}"`).catch(() => {
                    try { fs.copyFileSync(oldDbPath, dbPath); } catch(ecp) {}
                });
            }
        } catch (rErr) {}
        throw new Error(`Gagal memulihkan database: ${swapError.message}. Pastikan tidak ada aplikasi (Prisma Studio, DB Browser, atau Terminal lain) yang sedang mengakses file 'prisma/dev.db'. Windows seringkali mengunci file ini jika aplikasi masih berjalan.`);
    }

    // --- POST-RESTORE: SYNC & RECONNECT ---
    try {
      console.log("[Restore] Finalizing reconnection...");
      await prisma.$connect();
      await new Promise(r => setTimeout(r, 1000));
      await execAsync("npx prisma db push --accept-data-loss");
      console.log("[Restore] Schema synced successfully.");
    } catch (syncError: any) {
      console.warn("[Restore] Sync failed or timeout, check manually.", syncError);
      schemaSyncWarning =
        " Restore selesai, tetapi sinkronisasi skema otomatis gagal. Periksa log server sebelum melanjutkan penggunaan.";
    }

    try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch (e) {}

    const response = NextResponse.json({
      success: true,
      message: `Database dan aset berhasil dipulihkan. Sesi Anda akan direset untuk memuat data baru.${schemaSyncWarning || ""}`,
    });

    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    
    return response;
  } catch (error: any) {
    console.error("Restore Error Global:", error);
    try {
      await prisma.$connect();
    } catch (reconnectError) {
      console.error("[Restore] Gagal reconnect Prisma setelah error:", reconnectError);
    }
    return NextResponse.json(
      { error: "Gagal memulihkan: " + error.message + ". Silakan tutup semua aplikasi yang membuka database dan coba lagi." },
      { status: 500 }
    );
  }
}
