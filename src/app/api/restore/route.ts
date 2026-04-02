import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

    const buffer = Buffer.from(await file.arrayBuffer());
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch (e) {
      return NextResponse.json({ error: "Format ZIP tidak valid" }, { status: 400 });
    }

    // --- STEP 1: VALIDASI ISI ZIP ---
    const zipEntries = zip.getEntries();
    const dbEntry = zipEntries.find((entry) => entry.entryName.endsWith(".db"));

    if (!dbEntry) {
      return NextResponse.json(
        { error: "Tidak ada file database (.db) di dalam ZIP." },
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
    fs.writeFileSync(stagedDbPath, dbBuffer);

    // 2. Ekstrak folder uploads ke staging
    const uploadEntries = zipEntries.filter(entry => entry.entryName.startsWith("uploads/"));
    if (uploadEntries.length > 0) {
      if (!fs.existsSync(stagedUploadsDir)) fs.mkdirSync(stagedUploadsDir, { recursive: true });
      uploadEntries.forEach(entry => {
          if (!entry.isDirectory) {
              const relPath = entry.entryName.replace(/^uploads\//, "");
              const target = path.join(stagedUploadsDir, relPath);
              const targetParent = path.dirname(target);
              if (!fs.existsSync(targetParent)) fs.mkdirSync(targetParent, { recursive: true });
              fs.writeFileSync(target, entry.getData());
          }
      });
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
        if (dbMovedToOld && fs.existsSync(oldDbPath)) {
          try { fs.unlinkSync(oldDbPath); } catch (e) {}
        }
        if (uploadsMovedToOld && fs.existsSync(oldUploadsPath)) {
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
    }

    try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch (e) {}

    const response = NextResponse.json({
      success: true,
      message: "Database dan aset berhasil dipulihkan. Sesi Anda akan direset untuk memuat data baru.",
    });

    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    
    return response;
  } catch (error: any) {
    console.error("Restore Error Global:", error);
    return NextResponse.json(
      { error: "Gagal memulihkan: " + error.message + ". Silakan tutup semua aplikasi yang membuka database dan coba lagi." },
      { status: 500 }
    );
  }
}
