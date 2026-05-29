import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch 10 recent successful payments
    const recentPayments = await prisma.taxData.findMany({
      where: {
        paymentStatus: "LUNAS",
      },
      select: {
        id: true,
        namaWp: true,
        rt: true,
        rw: true,
        dusun: true,
        tanggalBayar: true,
        updatedAt: true,
      },
      orderBy: {
        tanggalBayar: 'desc',
      },
      take: 10,
    });

    // We don't censor the name based on user feedback.
    // If tanggalBayar is null, fallback to updatedAt.
    const formattedPayments = recentPayments.map(p => ({
      id: p.id,
      namaWp: p.namaWp,
      rt: p.rt,
      rw: p.rw,
      dusun: p.dusun,
      timestamp: p.tanggalBayar || p.updatedAt,
    }));

    return NextResponse.json({ success: true, data: formattedPayments });
  } catch (error) {
    console.error("Error fetching recent payments:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data." },
      { status: 500 }
    );
  }
}
