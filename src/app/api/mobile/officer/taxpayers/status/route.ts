import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/app/actions/log-actions";

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { taxId, status, userId } = await req.json();

    if (!taxId || !status || !userId) {
      return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400, headers });
    }

    // Validate status against Prisma Enum (though we'll use string here for flexibility if needed, but best to match)
    const validStatuses = ["LUNAS", "BELUM_LUNAS", "TIDAK_TERBIT", "SUSPEND"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400, headers });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current taxpayer data
      const taxData = await tx.taxData.findUnique({
        where: { id: parseInt(taxId) },
        include: { penarik: true }
      });

      if (!taxData) {
        throw new Error("Data Wajib Pajak tidak ditemukan");
      }

      // 2. Update status
      const updatedTax = await tx.taxData.update({
        where: { id: parseInt(taxId) },
        data: { 
          paymentStatus: status,
          // If marking as lunas, maybe update tanggalBayar if not set? 
          // But web version doesn't seem to force it, so we'll leave it as is.
        }
      });

      return { taxData, updatedTax };
    });

    // 3. Log the activity
    const statusLabels: Record<string, string> = {
      "LUNAS": "LUNAS",
      "BELUM_LUNAS": "BELUM LUNAS (DIBATALKAN)",
      "SUSPEND": "SENGKETA",
      "TIDAK_TERBIT": "TIDAK TERBIT"
    };

    await createAuditLog(
      "UPDATE_STATUS_MOBILE",
      "TaxData",
      result.taxData.namaWp,
      `Petugas mengubah status pembayaran WP ${result.taxData.namaWp} menjadi ${statusLabels[status] || status}`,
      userId
    );

    return NextResponse.json({ 
      success: true, 
      message: `Status berhasil diubah menjadi ${statusLabels[status] || status}`,
      data: result.updatedTax
    }, { headers });

  } catch (error: any) {
    console.error("Taxpayer Status API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500, headers });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
