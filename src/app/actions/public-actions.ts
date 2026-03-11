"use server";

import { prisma } from "@/lib/prisma";

export async function searchPublicTaxData(query: string, tahunPajak: number) {
  try {
    if (!query || query.trim().length < 3) {
      return { success: false, message: "Ketik minimal 3 karakter untuk mencari." };
    }

    const searchQuery = query.trim();
    
    // Cari berdasarkan NOP (exact/partial) atau Nama WP (partial)
    const results = await prisma.taxData.findMany({
      where: {
        tahun: tahunPajak,
        OR: [
          { nop: { contains: searchQuery } },
          { namaWp: { contains: searchQuery } }
        ]
      },
      include: {
        penarik: {
          select: {
            name: true,
            phoneNumber: true,
            dusun: true,
            rt: true,
            rw: true,
          }
        }
      },
      take: 10, // batasi max 10 hasil agar tidak berat/spam
    });

    if (results.length === 0) {
      return { success: false, message: "Data tidak ditemukan." };
    }

    // Map data to hide sensitive info if any, and structure for public view
    const mapped = results.map(r => ({
      id: r.id,
      nop: r.nop,
      namaWp: r.namaWp,
      alamat: r.alamatObjek,
      tagihan: r.sisaTagihan,
      status: r.paymentStatus,
      petugas: r.penarik ? {
        nama: r.penarik.name,
        kontak: r.penarik.phoneNumber || "Tidak ada nomor",
        wilayah: `${r.penarik.dusun || ""} RT ${r.penarik.rt || "-"} RW ${r.penarik.rw || "-"}`,
      } : null
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error("Public Search Error:", error);
    return { success: false, message: "Terjadi kesalahan pada sistem pencarian." };
  }
}
