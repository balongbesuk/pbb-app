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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as SessionUserWithRole | undefined;
    if (!session || sessionUser?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const year = formData.get("year") as string | null;

    if (!file || !year) {
      return NextResponse.json({ error: "File dan parameter tahun diperlukan" }, { status: 400 });
    }

    const archiveDir = getArchivePath(year);

    // Ensure directory exists
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch (error) {
      console.error("[Restore] ZIP tidak valid:", error);
      return NextResponse.json({ error: "Format ZIP tidak valid atau file rusak." }, { status: 400 });
    }

    // --- STEP 1: Extract to staging ---
    const stagingDir = path.join(process.cwd(), "tmp", `restore-archive-${Date.now()}`);
    if (!fs.existsSync(stagingDir)) fs.mkdirSync(stagingDir, { recursive: true });

    try {
      zip.extractAllTo(stagingDir, true);
    } catch (error) {
      console.error("[Restore] Gagal ekstrak:", error);
      fs.rmSync(stagingDir, { recursive: true, force: true });
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: `Gagal mengekstrak file ZIP: ${message}` }, { status: 500 });
    }

    // --- STEP 2: Flatten & Move to Target ---

    // Fungsi untuk memindahkan file secara rekursif ke root target
    const moveRecursive = (currentDir: string) => {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                moveRecursive(fullPath);
            } else {
                // Pindahkan file ke archiveDir (flat)
                // Pastikan nama file unik atau timpa yang ada
                const destPath = path.join(archiveDir, entry.name);
                fs.copyFileSync(fullPath, destPath);
            }
        }
    };

    // Bersihkan folder target sebelum memindahkan
    try {
        const existingFiles = fs.readdirSync(archiveDir);
        for (const f of existingFiles) {
            const p = path.join(archiveDir, f);
            if (fs.statSync(p).isFile()) fs.unlinkSync(p);
            else fs.rmSync(p, { recursive: true, force: true });
        }
    } catch {}

    try {
        moveRecursive(stagingDir);
    } catch (error) {
        console.error("[Restore] Gagal memindahkan file:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: `Gagal menyusun file arsip: ${message}` }, { status: 500 });
    } finally {
        // --- STEP 3: Cleanup staging ---
        fs.rmSync(stagingDir, { recursive: true, force: true });
    }

    return NextResponse.json({
      success: true,
      message: "Arsip digital berhasil dipulihkan dengan struktur yang benar.",
    });
  } catch (error) {
    console.error("Archive Restore Error: ", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
