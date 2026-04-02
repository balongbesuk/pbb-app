"use server";

import { parseExcel, processTaxData, processBackupAssignments } from "@/lib/excel-processor";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./log-actions";
import { requireAdmin } from "@/lib/server-auth";
import { formatZodError } from "@/lib/validations/schemas";
import { createDatabaseBackup } from "@/lib/backup";
import * as cheerio from "cheerio";

export async function previewTaxData(formData: FormData, tahun: number) {
  try {
    await requireAdmin();
    const file = formData.get("file") as File;
    if (!file) throw new Error("File tidak ditemukan");

    const buffer = Buffer.from(await file.arrayBuffer());
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const rows = await parseExcel(buffer, isCsv);
    
    // Simple summary
    let totalKetetapan = 0;
    const count = rows.length;
    
    // Map to find existing rows by NOP for update vs create count
    const nops = rows.map(r => r.nop ? String(r.nop).trim() : "").filter(Boolean);
    const existing = await prisma.taxData.count({
      where: {
        tahun,
        nop: { in: nops }
      }
    });

    rows.forEach((r: any) => {
      const val = parseFloat(String(r.ketetapan || 0).replace(/[^\d.-]/g, ''));
      if (!isNaN(val)) totalKetetapan += val;
    });

    return { 
      success: true, 
      total: count, 
      updates: existing, 
      newItems: count - existing,
      totalAmount: totalKetetapan,
      fileName: file.name
    };
  } catch (error) {
    console.error("Preview Error: ", error);
    return { success: false, message: formatZodError(error) };
  }
}


export async function uploadTaxData(formData: FormData, tahun: number) {
  try {
    await requireAdmin();
    // Automatic safety backup before import
    await createDatabaseBackup();
    
    const file = formData.get("file") as File;

    if (!file) throw new Error("File tidak ditemukan");

    const buffer = Buffer.from(await file.arrayBuffer());
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const rows = await parseExcel(buffer, isCsv);
    const result = await processTaxData(rows, tahun);

    await createAuditLog(
      "UPLOAD_TAX",
      "TaxData",
      null,
      `Impor ${result} data pajak untuk tahun ${tahun} dari file ${file.name}`
    );

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");

    return { success: true, count: result };
  } catch (error) {
    console.error("Action Error: ", error);
    return { success: false, message: formatZodError(error) };
  }
}

export async function restoreAssignments(formData: FormData, tahun: number) {
  try {
    await requireAdmin();
    const file = formData.get("file") as File;
    if (!file) throw new Error("File tidak ditemukan");

    // Batasi maksimum file 5MB
    if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran file terlalu besar. Maksimal 5MB.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    console.info("Starting restore for year:", tahun, "isCsv:", isCsv);
    const count = await processBackupAssignments(buffer, Number(tahun), isCsv);
    console.info("Restore finished. Updated:", count);

    await createAuditLog(
      "RESTORE_TAX",
      "TaxMapping",
      null,
      `Memulihkan alokasi penarik tahun ${tahun} sejumlah ${count} dari file ${file.name}`
    );

    revalidatePath("/settings");
    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");

    return { success: true, count };
  } catch (error) {
    console.error("Restore Error Action: ", error);
    return { success: false, message: formatZodError(error) };
  }
}

export async function clearTaxData(tahun: number) {
  try {
    await requireAdmin();
    // Automatic safety backup before clearing
    await createDatabaseBackup();

    // 1. Ambil ID pajak yang akan dihapus untuk membersihkan relasi TransferRequest

    const taxIds = await prisma.taxData.findMany({
      where: { tahun },
      select: { id: true }
    });
    
    const ids = taxIds.map(t => t.id);

    // 2. Hapus request transfer yang merujuk ke data tahun ini agar tidak melanggar Foreign Key
    if (ids.length > 0) {
      await prisma.transferRequest.deleteMany({
        where: { taxId: { in: ids } }
      });
    }

    // 3. Baru hapus data pajaknya
    await prisma.taxData.deleteMany({
      where: { tahun },
    });

    await createAuditLog(
      "CLEAR_TAX",
      "TaxData",
      null,
      `Menghapus seluruh data pajak untuk tahun ${tahun}`
    );

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");

    return { success: true };
  } catch (error) {
    console.error("Clear Error Action: ", error);
    return { success: false, message: formatZodError(error) };
  }
}

export async function createManualTaxData(data: {
  nop: string;
  namaWp: string;
  alamatObjek: string;
  luasTanah: number;
  luasBangunan: number;
  ketetapan: number;
  tahun: number;
  dusun?: string;
  rw?: string;
  rt?: string;
  paymentStatus?: "LUNAS" | "BELUM_LUNAS" | "SUSPEND" | "TIDAK_TERBIT";
}) {
  try {
    await requireAdmin();
    if (!data.nop || !data.namaWp || !data.alamatObjek || typeof data.ketetapan !== "number") {
      throw new Error("Data tidak lengkap (NOP, Nama WP, Alamat Objek, dan Nominal Pajak wajib diisi)");
    }

    const cleanedNop = String(data.nop).replace(/[^\w.-]/g, '');

    const exist = await prisma.taxData.findFirst({
      where: { nop: cleanedNop, tahun: data.tahun },
    });

    if (exist) {
      throw new Error(`Data dengan NOP ${cleanedNop} pada tahun ${data.tahun} sudah terdaftar.`);
    }

    const result = await prisma.taxData.create({
      data: {
        nop: cleanedNop,
        namaWp: String(data.namaWp).trim().substring(0, 255),
        alamatObjek: String(data.alamatObjek).trim().substring(0, 500),
        luasTanah: Number(data.luasTanah) || 0,
        luasBangunan: Number(data.luasBangunan) || 0,
        ketetapan: Number(data.ketetapan) || 0,
        tagihanDenda: 0,
        pembayaran: data.paymentStatus === "LUNAS" ? Number(data.ketetapan) || 0 : 0,
        pokok: Number(data.ketetapan) || 0,
        denda: 0,
        lebihBayar: 0,
        sisaTagihan: data.paymentStatus === "LUNAS" ? 0 : Number(data.ketetapan) || 0,
        dusun: data.dusun ? String(data.dusun).trim() : null,
        rw: data.rw ? String(data.rw).trim() : null,
        rt: data.rt ? String(data.rt).trim() : null,
        tahun: Number(data.tahun),
        paymentStatus: data.paymentStatus || "BELUM_LUNAS",
      },
    });

    await createAuditLog(
      "CREATE_TAX",
      "TaxData",
      result.id.toString(),
      `Menambahkan data pajak manual untuk NOP ${cleanedNop} (${result.namaWp})`
    );

    revalidatePath("/data-pajak");
    return { success: true, data: result };
  } catch (error) {
    console.error("Create manual tax error: ", error);
    return { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan sistem" };
  }
}

export async function fetchBapendaData(nop: string, tahun: number) {
  try {
    await requireAdmin();
    const config = await prisma.villageConfig.findFirst({ where: { id: 1 } });
    if (!config?.enableBapendaSync) {
      throw new Error("Sistem Cek Pajak Jombang sedang dinonaktifkan di Pengaturan.");
    }

    const cleanNop = nop.replace(/\D/g, "");
    if (cleanNop.length !== 18) throw new Error(`NOP harus 18 digit angka (Diterima ${cleanNop.length} digit).`);

    const p1 = cleanNop.substring(0, 2);
    const p2 = cleanNop.substring(2, 4);
    const p3 = cleanNop.substring(4, 7);
    const p4 = cleanNop.substring(7, 10);
    const p5 = cleanNop.substring(10, 13);
    const p6 = cleanNop.substring(13, 17);
    const p7 = cleanNop.substring(17, 18);

    const url = `https://bapenda.jombangkab.go.id/cek-bayar/ceknopbayar-jmb.kab?module=pbb&kata=${p1}&kata1=${p2}&kata2=${p3}&kata3=${p4}&kata4=${p5}&kata5=${p6}&kata6=${p7}&viewpbb=`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
      }
    });

    if (!res.ok) throw new Error("Gagal terhubung ke web Bapenda.");

    const htmlText = await res.text();
    const $ = cheerio.load(htmlText);

    let namaWp = "";
    let alamatObjek = "";
    let luasTanah = "0";
    let luasBangunan = "0";

    $("td").each((i, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (text === "nama wajib pajak") {
        namaWp = $(el).next().next().text().trim();
      }
      else if (text.includes("letak obj") || text.includes("letak oby") || text.includes("alamat obj") || text.includes("alamat oby")) {
        let rawAlamat = $(el).next().next().text().trim();
        /* 
           Batasi alamat objek pajak sampai sebelum teks DESA atau KELURAHAN 
           agar data tidak terlalu panjang namun tetap memuat info RT/RW.
        */
        const desaIndex = rawAlamat.search(/\bDESA\b/i);
        const kelIndex = rawAlamat.search(/\bKEL\b/i);
        const kelurahanIndex = rawAlamat.search(/\bKELURAHAN\b/i);

        const indices = [desaIndex, kelIndex, kelurahanIndex].filter(idx => idx > -1);
        if (indices.length > 0) {
          const cutoff = Math.min(...indices);
          rawAlamat = rawAlamat.substring(0, cutoff).trim();
          // Hilangkan koma nyangkut di akhir
          if (rawAlamat.endsWith(",")) {
            rawAlamat = rawAlamat.slice(0, -1).trim();
          }
        }
        alamatObjek = rawAlamat;
      }
      else if (text === "luas tanah") {
        luasTanah = $(el).next().next().text().trim();
      }
      else if (text === "luas bangunan") {
        luasBangunan = $(el).next().next().text().trim();
      }
    });

    if (!namaWp) throw new Error("Data NOP tidak ditemukan di server Bapenda.");

    let tagihan = 0;
    $("tr").each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length >= 10) {
        const yearStr = $(tds[0]).text().trim();
        if (yearStr === tahun.toString() || tahun === 0) {
           const rawTagihan = $(tds[1]).text().trim();
           // Menghapus format Rp Indonesia (pisahkan desimal koma, buang semua titik/karakter non-angka)
           const withoutDecimals = rawTagihan.split(',')[0];
           const cleanNumbersOnly = withoutDecimals.replace(/\D/g, '');
           
           if (cleanNumbersOnly && tagihan === 0) {
             tagihan = parseInt(cleanNumbersOnly, 10);
           }
        }
      }
    });

    return {
      success: true,
      data: {
        namaWp,
        alamatObjek,
        luasTanah,
        luasBangunan,
        ketetapan: tagihan || 0
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal sinkronisasi data Bapenda" };
  }
}
