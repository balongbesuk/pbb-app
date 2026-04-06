import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getNopVariations } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
    const type = searchParams.get("type"); // RT, RW, DUSUN, DESA
    const rt = searchParams.get("rt");
    const rw = searchParams.get("rw");
    const dusun = searchParams.get("dusun");

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.TaxDataWhereInput = { tahun, paymentStatus: "BELUM_LUNAS" };

    if (type === "RT" && rt && rw) {
      where.rt = rt;
      where.rw = rw;
    } else if (type === "RW" && rw) {
      where.rw = rw;
    } else if (type === "DUSUN" && dusun) {
      where.dusun = { contains: dusun };
    }

    if (search) {
      const variations = getNopVariations(search);
      where.OR = [
        ...variations.map((v) => ({ nop: { contains: v } })),
        { namaWp: { contains: search } },
      ];
    }

    // Aggregate total sum and count for the whole region
    const aggregate = await prisma.taxData.aggregate({
      where,
      _sum: { ketetapan: true },
      _count: { id: true },
    });

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

    return NextResponse.json({
      data: unpaidWP,
      totalPiutang,
      totalCount,
      hasMore: skip + unpaidWP.length < totalCount,
    });
  } catch (error) {
    console.error("Gagal mengambil data WP belum bayar:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
