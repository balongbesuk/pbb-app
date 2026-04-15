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
        alamatKantor: true,
        email: true,
        kodePos: true,
        namaKades: true,
        mapCenterLat: true,
        mapCenterLng: true,
        mapDefaultZoom: true,
        tahunPajak: true,
        showUnpaidDetailsGis: true,
        enablePbbMobile: true,
        updatedAt: true,
      },
    });

    if (config) {
      return NextResponse.json(config);
    }

    return NextResponse.json({ namaDesa: "", kecamatan: "", kabupaten: "", logoUrl: null });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { namaDesa: "", kecamatan: "", kabupaten: "", logoUrl: null, alamatKantor: "", email: "", kodePos: "", namaKades: "" },
      { status: 500 }
    );
  }
}
