import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { revalidatePath } from "next/cache";
import type { AppUser } from "@/types/app";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as AppUser | undefined;
    if (!session || user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File backup peta diperlukan" }, { status: 400 });
    }

    const mapDir = path.join(process.cwd(), "public", "maps");

    // Ensure directory exists
    if (!fs.existsSync(mapDir)) {
      fs.mkdirSync(mapDir, { recursive: true });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let zip: AdmZip;
    try {
      zip = new AdmZip(buffer);
    } catch {
      return NextResponse.json({ error: "Format ZIP tidak valid atau file rusak." }, { status: 400 });
    }

    // --- STEP 1: Extract to staging ---
    const stagingDir = path.join(process.cwd(), "tmp", `restore-map-${Date.now()}`);
    if (!fs.existsSync(stagingDir)) fs.mkdirSync(stagingDir, { recursive: true });

    try {
      zip.extractAllTo(stagingDir, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengekstrak arsip.";
      console.error(`[Restore Peta] Gagal ekstrak:`, error);
      fs.rmSync(stagingDir, { recursive: true, force: true });
      return NextResponse.json({ error: `Gagal mengekstrak: ${message}` }, { status: 500 });
    }

    // --- STEP 2: Clear and Move ---
    // Clean old map data
    try {
        const existing = fs.readdirSync(mapDir);
        for (const f of existing) {
            const p = path.join(mapDir, f);
            if (fs.statSync(p).isFile()) fs.unlinkSync(p);
            else fs.rmSync(p, { recursive: true, force: true });
        }
    } catch {}

    // Move from staging to mapDir
    const moveRecursive = (curr: string) => {
        const items = fs.readdirSync(curr, { withFileTypes: true });
        for (const item of items) {
            const fpath = path.join(curr, item.name);
            if (item.isDirectory()) {
                moveRecursive(fpath);
            } else {
                // Filter only .gpx to be safe? 
                // Or allow everything inside backup. 
                // Since this is a specialized map backup, we allow everything.
                fs.copyFileSync(fpath, path.join(mapDir, item.name));
            }
        }
    };

    try {
        moveRecursive(stagingDir);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memulihkan file.";
        return NextResponse.json({ error: `Gagal memulihkan file: ${message}` }, { status: 500 });
    } finally {
        fs.rmSync(stagingDir, { recursive: true, force: true });
    }

    revalidatePath("/settings");
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      message: "Data peta berhasil dipulihkan dari cadangan.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Map Restore Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
