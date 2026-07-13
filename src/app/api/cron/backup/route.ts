import { NextRequest, NextResponse } from "next/server";
import { createDatabaseBackup } from "@/lib/backup";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function runBackup(req: NextRequest, clientToken: string | null) {
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

  if (!cronSecret || !clientToken || clientToken !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backupPath = await createDatabaseBackup();

  if (!backupPath) {
    return NextResponse.json({ error: "Gagal membuat backup basis data." }, { status: 500 });
  }

  // Pemicu asinkron SQLite VACUUM di latar belakang untuk merapikan fragmentasi berkas DB
  prisma.$executeRawUnsafe("VACUUM;").catch((err) => {
    console.error("[Cron Backup] Gagal menjalankan VACUUM database:", err);
  });

  return NextResponse.json({
    success: true,
    message: "Backup database berhasil dibuat.",
    file: backupPath.split(/[/\\]/).pop(),
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const clientToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    return await runBackup(req, clientToken);
  } catch (error) {
    console.error("[Cron Backup API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryToken = searchParams.get("secret");

    const authHeader = req.headers.get("Authorization");
    const clientToken = queryToken || (authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader);

    return await runBackup(req, clientToken);
  } catch (error) {
    console.error("[Cron Backup API Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
