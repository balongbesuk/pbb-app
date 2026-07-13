import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getNopVariations } from "@/lib/utils";
import { requireMobileAuth } from "@/lib/mobile-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const unpaidCache = new Map<string, { data: any; expiry: number }>();

function maskNop(nop: string): string {
  const cleanNop = nop.replace(/\D/g, "");
  if (cleanNop.length === 18) {
    const p1 = cleanNop.substring(0, 2);
    const p2 = cleanNop.substring(2, 4);
    const p3 = cleanNop.substring(4, 7);
    const p4 = cleanNop.substring(7, 10);
    const p5 = cleanNop.substring(10, 13);
    return `${p1}.${p2}.${p3}.${p4}.${p5}-XXXX.X`;
  }
  if (nop.includes("-")) {
    const parts = nop.split("-");
    return `${parts[0]}-XXXX.X`;
  }
  return nop.substring(0, Math.max(0, nop.length - 5)) + "XXXXX";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());

    const allStatus = searchParams.get("allStatus") === "true";
    if (allStatus) {
      const wps = await prisma.taxData.findMany({
        where: { tahun },
        select: {
          nop: true,
          paymentStatus: true,
        },
      });

      const statusMap: Record<string, string> = {};
      for (const wp of wps) {
        const cleanNop = wp.nop.replace(/\D/g, "");
        statusMap[cleanNop] = wp.paymentStatus;
      }

      return NextResponse.json(statusMap);
    }
    const type = searchParams.get("type"); // RT, RW, DUSUN, DESA
    const rt = searchParams.get("rt");
    const rw = searchParams.get("rw");
    const dusun = searchParams.get("dusun");
    const blok = searchParams.get("blok");

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;
    const source = searchParams.get("source");
    
    let isOfficer = false;
    try {
      if (source === "mobile") {
        await requireMobileAuth(req);
        isOfficer = true;
      } else {
        const session = await getServerSession(authOptions);
        if (session?.user) {
          isOfficer = true;
        } else {
          await requireMobileAuth(req);
          isOfficer = true;
        }
      }
    } catch (e) {
      isOfficer = false;
    }

    const cacheKey = `region-unpaid:${tahun}:${type}:${rt}:${rw}:${dusun}:${blok}:${page}:${limit}:${search}:${source}:${isOfficer}`;
    const cached = unpaidCache.get(cacheKey);
    const nowTime = Date.now();
    if (cached && cached.expiry > nowTime) {
      return NextResponse.json(cached.data);
    }

    const where: Prisma.TaxDataWhereInput = { tahun, paymentStatus: "BELUM_LUNAS" };

    if (type === "RT" && rt && rw) {
      where.rt = rt;
      where.rw = rw;
    } else if (type === "RW" && rw) {
      where.rw = rw;
    } else if (type === "DUSUN" && dusun) {
      where.dusun = { contains: dusun };
    } else if (type === "BLOK" && blok) {
      // Filter berdasarkan pola .blok- pada NOP
      where.nop = { contains: `.${blok}-` };
    }

    if (search) {
      const variations = getNopVariations(search);
      where.OR = [
        ...variations.map((v) => ({ nop: { startsWith: v } })),
        { namaWp: { contains: search } },
      ];
    }

    // Aggregate total sum and count for the whole region
    const [aggregate, config] = await Promise.all([
      prisma.taxData.aggregate({
        where,
        _sum: { ketetapan: true },
        _count: { id: true },
      }),
      prisma.villageConfig.findFirst({
        where: { id: 1 },
        select: { 
          enableBapendaSync: true,
          enableBapendaPayment: true,
          bapendaUrl: true,
          bapendaPaymentUrl: true,
          bapendaRegionName: true,
          isJombangBapenda: true,
        }
      })
    ]);

    const totalPiutang = aggregate._sum.ketetapan || 0;
    const totalCount = aggregate._count.id || 0;

    const unpaidWP = await prisma.taxData.findMany({
      where,
      select: {
        id: true,
        nop: true,
        namaWp: true,
        ketetapan: true,
        alamatObjek: true,
        rt: true,
        rw: true,
        dusun: true,
      },
      orderBy: { ketetapan: "desc" },
      take: limit,
      skip,
    });

    const mappedWP = unpaidWP.map(wp => ({
      ...wp,
      nop: isOfficer ? wp.nop : maskNop(wp.nop)
    }));

    const responsePayload = {
      data: mappedWP,
      totalPiutang,
      totalCount,
      hasMore: skip + unpaidWP.length < totalCount,
      villageConfig: {
        enableBapendaSync: config?.enableBapendaSync ?? false,
        enableBapendaPayment: config?.enableBapendaPayment ?? true,
        bapendaUrl: config?.bapendaUrl || null,
        bapendaPaymentUrl: config?.bapendaPaymentUrl || null,
        bapendaRegionName: config?.bapendaRegionName || "Bapenda",
        isJombangBapenda: config?.isJombangBapenda ?? false,
      }
    };

    unpaidCache.set(cacheKey, { data: responsePayload, expiry: Date.now() + 2 * 60 * 1000 });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Gagal mengambil data WP belum bayar:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
