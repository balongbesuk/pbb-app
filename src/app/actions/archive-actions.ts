"use server";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireAuth } from "@/lib/server-auth";
import { assertSafeFilename, resolveSafeChildPath } from "@/lib/file-security";
import { prisma } from "@/lib/prisma";
import {
  ensureArchiveDir,
  getArchiveDir as resolveArchiveDir,
} from "@/lib/archive-utils";

function getArchiveDir(year: number) {
  return resolveArchiveDir(year);
}

/** Get archive connection statistics */
export async function getArchiveStats(year: number) {
  try {
    await requireAdmin();
    const archiveDir = getArchiveDir(year);
    if (!fs.existsSync(archiveDir)) return { connected: 0, disconnected: 0, total: 0 };
    
    const files = fs.readdirSync(archiveDir).filter(f => !f.startsWith("."));
    
    // Ambil semua NOP di database untuk tahun tersebut
    const allTaxes = await prisma.taxData.findMany({
      where: { tahun: year },
      select: { nop: true }
    });
    
    const dbNops = new Set(allTaxes.map(t => t.nop.replace(/\D/g, "")));
    
    let connected = 0;
    let disconnected = 0;
    
    files.forEach(f => {
      const cleanFileName = f.replace(/\D/g, "");
      // Jika NOP pada nama file ada di database
      if (dbNops.has(cleanFileName)) {
        connected++;
      } else {
        disconnected++;
      }
    });
    
    return { 
      connected, 
      disconnected, 
      total: files.length 
    };
  } catch (error) {
    console.error(error);
    return { connected: 0, disconnected: 0, total: 0 };
  }
}

/** Get list of all archive filenames, sizes, and connection status by year */
export async function getArchiveList(year: number): Promise<{ name: string; size: number; isConnected: boolean }[]> {
  try {
    await requireAuth();
    const archiveDir = getArchiveDir(year);
    if (!fs.existsSync(archiveDir)) return [];
    const files = fs.readdirSync(archiveDir).filter(f => !f.startsWith("."));

    const allTaxes = await prisma.taxData.findMany({
      where: { tahun: year },
      select: { nop: true }
    });
    const dbNops = new Set(allTaxes.map(t => t.nop.replace(/\D/g, "")));

    return files.map(f => {
      const filePath = path.join(archiveDir, f);
      const stat = fs.statSync(filePath);
      const cleanFileName = f.replace(/\D/g, "");
      const isConnected = dbNops.has(cleanFileName);
      return { name: f, size: stat.size, isConnected };
    }).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Check if an archive exists for a specific NOP and year */
export async function checkArchiveByNop(nop: string, year: number) {
  try {
    await requireAuth();
    const cleanNop = nop.replace(/\D/g, "");
    const archiveDir = getArchiveDir(year);
    if (!fs.existsSync(archiveDir)) return null;
    
    const files = fs.readdirSync(archiveDir);
    const matched = files.find(f => f.replace(/\D/g, "").startsWith(cleanNop));
    
    return matched || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/** Action to upload archives */
export async function uploadArchives(formData: FormData) {
  try {
    await requireAdmin();
    const files = formData.getAll("files") as File[];
    const yearRaw = formData.get("year");
    const year = yearRaw ? parseInt(yearRaw.toString()) : new Date().getFullYear();
    const archiveDir = getArchiveDir(year);
    
    ensureArchiveDir(year);

    let successCount = 0;
    for (const file of files) {
      if (!file.name || file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = assertSafeFilename(file.name);
      const filePath = resolveSafeChildPath(archiveDir, filename);
      fs.writeFileSync(filePath, buffer);
      successCount++;
    }

    revalidatePath("/kelola-arsip");
    revalidatePath("/settings");
    return { success: true, message: `${successCount} file arsip berhasil diunggah.` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal mengunggah arsip." };
  }
}

/** Action to delete an archive file by year */
export async function deleteArchive(filename: string, year: number) {
  try {
    await requireAdmin();
    const archiveDir = getArchiveDir(year);
    const safeFilename = assertSafeFilename(filename);
    const filePath = resolveSafeChildPath(archiveDir, safeFilename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    revalidatePath("/admin/settings");
    revalidatePath("/kelola-arsip");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal menghapus file arsip" };
  }
}
export async function clearAllArchives(year: number) {
  try {
    await requireAdmin();
    const archiveDir = getArchiveDir(year);
    if (fs.existsSync(archiveDir)) {
      const files = fs.readdirSync(archiveDir);
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const filePath = path.join(archiveDir, file);
        if (fs.statSync(filePath).isFile()) {
           fs.unlinkSync(filePath);
        }
      }
    }
    revalidatePath("/kelola-arsip");
    revalidatePath("/settings");
    return { success: true, message: "Seluruh arsip berhasil dikosongkan." };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal mengosongkan arsip." };
  }
}
