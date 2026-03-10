import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

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

    // Putuskan koneksi Prisma agar file dev.db tidak terkunci (khususnya untuk Windows)
    await prisma.$disconnect();

    const dbBuffer = dbEntry.getData();
    fs.writeFileSync(dbPath, dbBuffer);

    // Buka kembali koneksinya (opsional, karena prisma otomatis reconncet pada pemanggilan berikutnya)
    await prisma.$connect();

    return NextResponse.json({
      success: true,
      message: "Database berhasil dipulihkan dari cadangan. Silakan login kembali.",
    });
  } catch (error: any) {
    console.error("Restore Error:", error);
    return NextResponse.json(
      { error: "Gagal memulihkan database: " + error.message },
      { status: 500 }
    );
  }
}
