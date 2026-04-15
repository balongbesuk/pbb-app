import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { getArchivePath } from "@/lib/storage";

type SessionUserWithRole = {
  role?: string | null;
};

type RestoreStreamMessage =
  | { type: "info"; message: string }
  | {
      type: "progress";
      phase?: "extracting" | "moving";
      current?: number;
      total?: number;
      percent: number;
    }
  | { type: "done"; success: boolean; message?: string; error?: string };

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: RestoreStreamMessage) =>
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));

      try {
        const session = await getServerSession(authOptions);
        const sessionUser = session?.user as SessionUserWithRole | undefined;
        if (!session || sessionUser?.role !== "ADMIN") {
          send({ type: "done", success: false, error: "Unauthorized" });
          controller.close();
          return;
        }

        const formData = (await req.formData()) as any;
        const file = formData.get("file") as File | null;
        const year = formData.get("year") as string | null;

        if (!file || !year) {
          send({ type: "done", success: false, error: "File dan parameter tahun diperlukan" });
          controller.close();
          return;
        }

        const archiveDir = getArchivePath(year);
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        let zip: AdmZip;
        try {
          zip = new AdmZip(buffer);
        } catch {
          send({ type: "done", success: false, error: "Format ZIP tidak valid atau file rusak." });
          controller.close();
          return;
        }

        const zipEntries = zip.getEntries();
        const total = zipEntries.length;
        send({ type: "info", message: `Ditemukan ${total} file dalam backup.` });

        // --- STEP 1: Extract to staging ---
        const stagingDir = path.join(process.cwd(), "tmp", `restore-archive-${Date.now()}`);
        if (!fs.existsSync(stagingDir)) fs.mkdirSync(stagingDir, { recursive: true });

        send({ type: "info", message: "Mulai mengekstrak file..." });
        
        // Ekstrak satu per satu agar bisa kirim progress
        for (let i = 0; i < total; i++) {
           const entry = zipEntries[i];
           try {
             zip.extractEntryTo(entry, stagingDir, false, true);
             if (i % 10 === 0 || i === total - 1) {
                send({ 
                    type: "progress", 
                    phase: "extracting",
                    current: i + 1, 
                    total, 
                    percent: Math.round(((i + 1) / total) * 40) + 10 // 10-50% untuk ekstrak
                });
             }
           } catch {
             console.error("Gagal ekstrak entry:", entry.entryName);
           }
        }

        // --- STEP 2: Flatten & Move to Target ---
        send({ type: "info", message: "Membersihkan folder lama & menyusun file..." });
        
        // Bersihkan folder target
        try {
            const existingFiles = fs.readdirSync(archiveDir);
            for (const f of existingFiles) {
                const p = path.join(archiveDir, f);
                if (fs.statSync(p).isFile()) fs.unlinkSync(p);
                else fs.rmSync(p, { recursive: true, force: true });
            }
        } catch {}

        // Fungsi rekursif untuk kumpulkan semua file dari staging
        const allFiles: string[] = [];
        const collectFiles = (dir: string) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const ent of entries) {
                const full = path.join(dir, ent.name);
                if (ent.isDirectory()) collectFiles(full);
                else allFiles.push(full);
            }
        };
        collectFiles(stagingDir);
        
        const totalMove = allFiles.length;
        for (let i = 0; i < totalMove; i++) {
            const src = allFiles[i];
            const name = path.basename(src);
            const dest = path.join(archiveDir, name);
            fs.copyFileSync(src, dest);
            
            if (i % 20 === 0 || i === totalMove - 1) {
                send({ 
                    type: "progress", 
                    phase: "moving",
                    current: i + 1, 
                    total: totalMove, 
                    percent: Math.round(((i + 1) / totalMove) * 45) + 50 // 50-95% untuk pindahkan
                });
            }
        }

        // Cleanup
        fs.rmSync(stagingDir, { recursive: true, force: true });

        send({ type: "progress", percent: 100 });
        send({ type: "done", success: true, message: "Arsip berhasil dipulihkan total." });
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        send({ type: "done", success: false, error: message });
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
