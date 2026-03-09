"use server";

import { parseExcel, processTaxData, processBackupAssignments } from "@/lib/excel-processor";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "./log-actions";

export async function uploadTaxData(formData: FormData, tahun: number) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("File tidak ditemukan");

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = await parseExcel(buffer);
    const result = await processTaxData(rows, tahun);

    await createAuditLog("UPLOAD_TAX", "TaxData", null, `Impor ${result} data pajak untuk tahun ${tahun} dari file ${file.name}`);

    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");

    return { success: true, count: result };
  } catch (error: any) {
    console.error("Upload Error: ", error);
    return { success: false, message: error.message };
  }
}

export async function restoreAssignments(formData: FormData, tahun: number) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("File tidak ditemukan");
    
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("Starting restore for year:", tahun);
    
    const count = await processBackupAssignments(buffer, tahun);
    console.log("Restore finished. Updated:", count);

    await createAuditLog("RESTORE_TAX", "TaxMapping", null, `Memulihkan alokasi penarik tahun ${tahun} sejumlah ${count} dari file ${file.name}`);
    
    revalidatePath("/settings");
    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    
    return { success: true, count };
  } catch (error: any) {
    console.error("Restore Error Action: ", error);
    return { success: false, message: error.message };
  }
}

export async function clearTaxData(tahun: number) {
  try {
    await prisma.taxData.deleteMany({
      where: { tahun }
    });

    await createAuditLog("CLEAR_TAX", "TaxData", null, `Menghapus seluruh data pajak untuk tahun ${tahun}`);
    
    revalidatePath("/data-pajak");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    
    return { success: true };
  } catch (error: any) {
    console.error("Clear Error Action: ", error);
    return { success: false, message: error.message };
  }
}
