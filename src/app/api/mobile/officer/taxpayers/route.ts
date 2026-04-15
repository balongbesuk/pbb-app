import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // LUNAS or BELUM_LUNAS
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400, headers });
    }

    const where: any = {
      penarikId: userId,
      tahun: tahun
    };

    if (search) {
      where.OR = [
        { nop: { contains: search } },
        { namaWp: { contains: search } }
      ];
    }

    if (status) {
      where.paymentStatus = status;
    }

    const [taxpayers, total] = await Promise.all([
      prisma.taxData.findMany({
        where,
        orderBy: { namaWp: 'asc' },
        take: limit,
        skip: skip,
        select: {
          id: true,
          nop: true,
          namaWp: true,
          alamatObjek: true,
          ketetapan: true,
          paymentStatus: true,
          rt: true,
          rw: true,
          dusun: true
        }
      }),
      prisma.taxData.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: taxpayers,
      total,
      hasMore: skip + taxpayers.length < total
    }, { headers });

  } catch (error) {
    console.error("Officer Taxpayers API Error:", error);
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
