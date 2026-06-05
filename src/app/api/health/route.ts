import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Periksa konektivitas basis data (Prisma + SQLite)
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // 2. Periksa ruang penyimpanan server (Disk Space)
    let diskSpace = null;
    try {
      if (typeof fs.promises.statfs === "function") {
        const stats = await fs.promises.statfs(process.cwd());
        const free = stats.bfree * stats.bsize;
        const total = stats.blocks * stats.bsize;
        diskSpace = {
          freeBytes: free,
          totalBytes: total,
          freePercentage: Math.round((free / total) * 100),
        };
      }
    } catch (fsErr) {
      console.warn("[Health Check] Gagal membaca kapasitas penyimpanan disk:", fsErr);
    }

    // 3. Periksa koneksi eksternal ke Bapenda (jika diaktifkan)
    let bapendaStatus = "UNKNOWN";
    try {
      const config = await prisma.villageConfig.findFirst({ where: { id: 1 } });
      if (config?.enableBapendaSync && config.bapendaUrl) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Batas ping 2 detik
        
        try {
          const res = await fetch(config.bapendaUrl, {
            method: "HEAD",
            signal: controller.signal,
          });
          bapendaStatus = res.status === 200 ? "ONLINE" : `HTTP_${res.status}`;
        } catch {
          bapendaStatus = "OFFLINE";
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        bapendaStatus = "DISABLED";
      }
    } catch (bapendaErr) {
      bapendaStatus = "ERROR";
    }

    return NextResponse.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: {
        status: "CONNECTED",
        latencyMs: dbLatency,
      },
      diskSpace,
      bapendaService: {
        status: bapendaStatus,
      },
    });
  } catch (error) {
    console.error("[Health Check Error]:", error);
    return NextResponse.json(
      {
        status: "ERROR",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
