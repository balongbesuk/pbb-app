import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API — tidak perlu auth karena hanya info publik (nama desa & logo)
export async function GET() {
  try {
    const config = await prisma.villageConfig.findFirst({
      where: { id: 1 },
      select: {
        namaDesa: true,
        kecamatan: true,
        kabupaten: true,
        logoUrl: true,
      },
    });

    if (config) {
      return NextResponse.json(config);
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
