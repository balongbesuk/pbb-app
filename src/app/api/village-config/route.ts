import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API — tidak perlu auth karena hanya info publik (nama desa & logo)
export async function GET() {
  try {
    const config = (await prisma.$queryRawUnsafe(
      `SELECT namaDesa, kecamatan, kabupaten, logoUrl FROM "VillageConfig" LIMIT 1`
    )) as any[];

    if (config.length > 0) {
      return NextResponse.json(config[0]);
    }

    return NextResponse.json({ namaDesa: "", kecamatan: "", kabupaten: "", logoUrl: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { namaDesa: "", kecamatan: "", kabupaten: "", logoUrl: null },
      { status: 500 }
    );
  }
}
