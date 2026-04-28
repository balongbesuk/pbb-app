import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth, unauthorizedMobileResponse } from "@/lib/mobile-auth";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let auth;
    try {
      auth = await requireMobileAuth(req);
    } catch {
      return unauthorizedMobileResponse(headers);
    }

    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    const isAdmin = auth.role === "ADMIN";
    const whereClause: Prisma.TaxDataWhereInput = { tahun };
    if (!isAdmin) {
      whereClause.penarikId = auth.userId;
    }

    const [all, lunas, sengketa, tdkTerbit, logs, villageConfig, unreadCount] = await Promise.all([
      prisma.taxData.aggregate({
        where: whereClause,
        _sum: { ketetapan: true },
        _count: true,
      }),
      prisma.taxData.aggregate({
        where: { ...whereClause, paymentStatus: "LUNAS" },
        _sum: { pembayaran: true },
        _count: true,
      }),
      prisma.taxData.count({
        where: { ...whereClause, paymentStatus: "SUSPEND" }
      }),
      prisma.taxData.count({
        where: { ...whereClause, paymentStatus: "TIDAK_TERBIT" }
      }),
      prisma.auditLog.findMany({
        where: isAdmin ? {} : { userId: auth.userId },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.villageConfig.findFirst({ where: { id: 1 } }),
      prisma.notification.count({
        where: { userId: auth.userId, isRead: false }
      })
    ]);

    const stats = {
      totalTarget: all._sum.ketetapan || 0,
      totalWp: all._count || 0,
      totalLunas: lunas._sum.pembayaran || 0,
      wpLunas: lunas._count || 0,
      wpSengketa: sengketa,
      wpTdkTerbit: tdkTerbit,
    };

    return NextResponse.json({
      success: true,
      stats,
      logs,
      unreadNotificationsCount: unreadCount,
      tahunPajak: villageConfig?.tahunPajak || tahun,
      villageConfig: {
        bapendaUrl: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaUrl,
        bapendaPaymentUrl: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaPaymentUrl,
        enableBapendaPayment: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.enableBapendaPayment ?? true,
        bapendaRegionName: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.bapendaRegionName || "Bapenda",
        isJombangBapenda: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.isJombangBapenda ?? false,
        enableBapendaSync: (await prisma.villageConfig.findUnique({ where: { id: 1 } }))?.enableBapendaSync ?? false,
      }
    }, { headers });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
