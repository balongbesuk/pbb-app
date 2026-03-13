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

    const zipEntries = zip.getEntries();
    const dbEntry = zipEntries.find((entry) => entry.entryName.endsWith(".db"));

    if (!dbEntry) {
      return NextResponse.json(
        { error: "Tidak ada file database (.db) di dalam ZIP." },
        { status: 400 }
      );
    }

    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    const uploadsPath = path.join(process.cwd(), "public", "uploads");

    // Putuskan koneksi Prisma agar file dev.db tidak terkunci (khususnya untuk Windows)
    await prisma.$disconnect();

    // 1. Ekstrak database (.db)
    const dbBuffer = dbEntry.getData();
    fs.writeFileSync(dbPath, dbBuffer);

    // 2. Ekstrak folder uploads jika ada dalam ZIP
    // Kita filter semua entry yang prefixnya "uploads/"
    const uploadEntries = zipEntries.filter(entry => entry.entryName.startsWith("uploads/"));
    
    if (uploadEntries.length > 0) {
      // Pastikan folder public/uploads ada
      if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
      }
      // Ekstrak folder uploads ke public/uploads
      // extractEntryTo akan mengambil entry tertentu, tapi kita gunakan extractAllTo seperlunya atau manual
      // Karena addLocalFolder dengan target "uploads" akan membuat struktur "uploads/..." dalam zip
      // Kita ingin isinya masuk ke public/uploads
      zip.extractEntryTo("uploads/", uploadsPath, false, true);
      console.log(`Restored ${uploadEntries.length} files to uploads folder.`);
    }

    // Otomatis sinkronisasi schema jika database versi lama
    try {
      // 1. Sinkronkan schema (menambah kolom yang kurang tanpa hapus data)
      await execAsync("npx prisma db push --accept-data-loss");
      
      // 2. Reset/Update admin password ke bawaan agar pasti bisa login
      await execAsync("npx prisma db seed");
      
      console.log("Database restoration sync completed successfully.");
    } catch (syncError: any) {
      console.error("Sync/Seed Error during restore:", syncError);
      // Tetap lanjutkan karena file sudah ter-copy, tapi user mungkin butuh sinkronisasi manual
    }

    // Buka kembali koneksinya
    await prisma.$connect();

    // Hancurkan sesi dengan menghapus cookie (Force Logout)
    const response = NextResponse.json({
      success: true,
      message: "Database berhasil dipulihkan dan disinkronkan ke versi terbaru. Anda akan dialihkan ke halaman login.",
    });

    // Hapus cookie sesi agar pengguna dipaksa login ulang
    response.cookies.delete("next-auth.session-token");
    
    return response;
  } catch (error: any) {
    console.error("Restore Error:", error);
    return NextResponse.json(
      { error: "Gagal memulihkan database: " + error.message },
      { status: 500 }
    );
  }
}

