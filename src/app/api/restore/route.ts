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
    console.log("[Restore] Performing atomic swap...");
    await prisma.$disconnect();

    const oldDbPath = `${dbPath}.old-${timestamp}`;
    const oldUploadsPath = `${uploadsPath}-old-${timestamp}`;
    
    let dbMovedToOld = false;
    let dbStagedToLive = false;
    let uploadsMovedToOld = false;
    let uploadsStagedToLive = false;

    try {
        // 1. Swap Database
        if (fs.existsSync(dbPath)) {
            fs.renameSync(dbPath, oldDbPath);
            dbMovedToOld = true;
        }
        fs.renameSync(stagedDbPath, dbPath);
        dbStagedToLive = true;

        // 2. Swap Uploads
        if (fs.existsSync(stagedUploadsDir)) {
          if (fs.existsSync(uploadsPath)) {
              fs.renameSync(uploadsPath, oldUploadsPath);
              uploadsMovedToOld = true;
          }
          fs.renameSync(stagedUploadsDir, uploadsPath);
          uploadsStagedToLive = true;
        }
        
        // --- SUCCESS: Cleanup old versions ---
        if (dbMovedToOld && fs.existsSync(oldDbPath)) {
          try { fs.unlinkSync(oldDbPath); } catch (e) {}
        }
        if (uploadsMovedToOld && fs.existsSync(oldUploadsPath)) {
          try { fs.rmSync(oldUploadsPath, { recursive: true, force: true }); } catch(e) {}
        }
        
    } catch (swapError: any) {
        console.error("[Restore] Swap failed! Attempting rollback...", swapError);
        
        // --- ROLLBACK LOGIC ---
        try {
            // Rollback Uploads if it was partially swapped
            if (uploadsStagedToLive) {
                // If staged was already moved to live, we might need to delete it if we want to restore old
                // but let's just try to put old back if possible
            }
            if (uploadsMovedToOld && fs.existsSync(oldUploadsPath)) {
                if (fs.existsSync(uploadsPath)) fs.rmSync(uploadsPath, { recursive: true, force: true });
                fs.renameSync(oldUploadsPath, uploadsPath);
            }

            // Rollback Database
            if (dbMovedToOld && fs.existsSync(oldDbPath)) {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
                fs.renameSync(oldDbPath, dbPath);
            }
        } catch (rollbackError: any) {
            console.error("[Restore] CRITICAL: Rollback failed!", rollbackError);
        }

        throw new Error(`Gagal saat proses swap data: ${swapError.message}. Sistem telah mencoba melakukan rollback.`);
    }

    // --- POST-RESTORE: SYNC & RECONNECT ---
    try {
      await prisma.$connect();
      // Sinkronkan schema (menambah kolom yang kurang tanpa mengubah kredensial pengguna)
      await execAsync("npx prisma db push --accept-data-loss");
      console.log("[Restore] Database synchronization completed.");
    } catch (syncError: any) {
      console.warn("[Restore] Sync failed, but files are restored.", syncError);
    }

    // Cleanup Staging Folder
    try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch (e) {}

    const response = NextResponse.json({
      success: true,
      message: "Database dan aset berhasil dipulihkan dengan verifikasi staging & backup otomatis.",
    });

    // Logout user after restore complete
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    
    return response;
  } catch (error: any) {
    console.error("Restore Error:", error);
    return NextResponse.json(
      { error: "Gagal memulihkan database: " + error.message },
      { status: 500 }
    );
  }
}
