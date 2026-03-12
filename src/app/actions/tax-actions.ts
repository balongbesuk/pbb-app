"use server";

import { parseExcel, processTaxData, processBackupAssignments } from "@/lib/excel-processor";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./log-actions";
import { requireAdmin } from "@/lib/server-auth";
import { formatZodError } from "@/lib/validations/schemas";

export async function uploadTaxData(formData: FormData, tahun: number) {
  try {
    await requireAdmin();
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
