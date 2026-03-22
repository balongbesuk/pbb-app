"use server";
import fs from "fs";
import path from "path";

// Comprehensive Browser Polyfills for Server-side PDF Parsing
const noopClass = class {};
if (typeof (global as any).DOMMatrix === "undefined") (global as any).DOMMatrix = noopClass;
if (typeof (global as any).DOMPoint === "undefined") (global as any).DOMPoint = noopClass;
if (typeof (global as any).DOMRect === "undefined") (global as any).DOMRect = noopClass;
if (typeof (global as any).HTMLElement === "undefined") (global as any).HTMLElement = noopClass;
if (typeof (global as any).HTMLCanvasElement === "undefined") (global as any).HTMLCanvasElement = noopClass;
if (typeof (global as any).Navigator === "undefined") (global as any).Navigator = noopClass;
if (typeof (global as any).Image === "undefined") (global as any).Image = noopClass;
if (typeof (global as any).ReadableStream === "undefined") (global as any).ReadableStream = noopClass;

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { VillageConfigSchema, formatZodError } from "@/lib/validations/schemas";
import { assertSafeFilename, resolveSafeChildPath } from "@/lib/file-security";

export async function deleteAllTaxData() {
  try {
    await requireAdmin();

    // Delete related transactional records
    await prisma.transferRequest.deleteMany();
    await prisma.taxData.deleteMany();

    // Delete configuration and settings records based on user request
    await prisma.dusunReference.deleteMany();
    await prisma.regionOtomation.deleteMany();
    await prisma.taxMapping.deleteMany();
    await prisma.villageRegion.deleteMany();
    await prisma.addressLearning.deleteMany();
    await prisma.notification.deleteMany();

    // Reset Village Config / Profile to empty defaults
    await prisma.villageConfig.deleteMany();
    await prisma.villageConfig.create({
      data: {
        id: 1,
        namaDesa: "",
        kecamatan: "",
        kabupaten: "",
        tahunPajak: 2026,
        jatuhTempo: "31 Agustus",
        bapendaUrl: null,
        isJombangBapenda: true,
        logoUrl: null,
      },
    });

    // 1. Reset all users avatarUrl
    await prisma.user.updateMany({
      data: { avatarUrl: null }
    });

    // 2. Physical file deletion (Cleaning public/uploads)
    try {
      const uploadsPath = path.join(process.cwd(), "public", "uploads");
      if (fs.existsSync(uploadsPath)) {
        const rootFiles = fs.readdirSync(uploadsPath);
        for (const entry of rootFiles) {
          const entryPath = path.join(uploadsPath, entry);
          if (fs.statSync(entryPath).isFile()) {
            fs.unlinkSync(entryPath);
          }
        }

        // We delete subfolders content but keep the folders structure
        const subfolders = ["avatars", "logos"];
        for (const sub of subfolders) {
          const subPath = path.join(uploadsPath, sub);
          if (fs.existsSync(subPath)) {
            const files = fs.readdirSync(subPath);
            for (const file of files) {
              const filePath = path.join(subPath, file);
              if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to delete physical upload files:", e);
    }

    revalidatePath("/data-pajak");
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/laporan");
    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export const getVillageConfig = cache(async () => {
  try {
    const config = await prisma.villageConfig.findFirst({
      where: { id: 1 },
    });

    if (config) return config;

    // If empty, create empty default and return it
    return await prisma.villageConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        namaDesa: "",
        kecamatan: "",
        kabupaten: "",
        tahunPajak: 2026,
        jatuhTempo: "31 Agustus",
        bapendaUrl: null,
        isJombangBapenda: true,
        enableBapendaSync: true,
        showNominalPajak: false,
        enableDigitalArchive: true,
        archiveOnlyLunas: true,
      },
    });
  } catch (e) {
    console.error(e);
    return { 
      id: 1, 
      namaDesa: "", 
      kecamatan: "", 
      kabupaten: "", 
      tahunPajak: 2026, 
      jatuhTempo: "31 Agustus", 
      bapendaUrl: null, 
      isJombangBapenda: true, 
      enableBapendaSync: true,
      logoUrl: null, 
      showNominalPajak: false, 
      enableDigitalArchive: true,
      archiveOnlyLunas: true,
      updatedAt: new Date() 
    };
  }
});

export async function updateVillageConfig(raw: any) {
  try {
    await requireAdmin();
    const data = VillageConfigSchema.parse(raw);

    const updateData: any = {};
    if (data.namaDesa) updateData.namaDesa = data.namaDesa.toUpperCase();
    if (data.kecamatan) updateData.kecamatan = data.kecamatan.toUpperCase();
    if (data.kabupaten) updateData.kabupaten = data.kabupaten.toUpperCase();

    if (data.tahunPajak) {
      updateData.tahunPajak = data.tahunPajak;
    }

    if (data.jatuhTempo) {
      updateData.jatuhTempo = data.jatuhTempo;
    }

    if (data.bapendaUrl !== undefined) {
      updateData.bapendaUrl = data.bapendaUrl;
    }

    if (data.isJombangBapenda !== undefined) {
      updateData.isJombangBapenda = data.isJombangBapenda;
    }
    
    if (data.enableBapendaSync !== undefined) {
      updateData.enableBapendaSync = data.enableBapendaSync;
    }

    if (data.showNominalPajak !== undefined) {
      updateData.showNominalPajak = data.showNominalPajak;
    }

    if (data.enableDigitalArchive !== undefined) {
      updateData.enableDigitalArchive = data.enableDigitalArchive;
    }

    if (data.archiveOnlyLunas !== undefined) {
      updateData.archiveOnlyLunas = data.archiveOnlyLunas;
    }

    await prisma.villageConfig.update({
      where: { id: 1 },
      data: updateData,
    });

    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function getDusuns() {
  return await prisma.dusunReference.findMany({
    orderBy: { name: "asc" },
  });
}

export async function addDusun(name: string) {
  try {
    await requireAdmin();
    const normalized = name.trim().toUpperCase();
    if (!normalized) throw new Error("Nama dusun tidak boleh kosong");

    await prisma.dusunReference.create({
      data: { name: normalized },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    const err = error as any;
    if (err?.code === "P2002") return { success: false, message: "Nama dusun sudah ada" };
    return { success: false, message: formatZodError(error) };
  }
}

export async function deleteDusun(id: string) {
  try {
    await requireAdmin();
    await prisma.dusunReference.delete({
      where: { id },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { success: false, message: formatZodError(error) };
  }
}

export async function getRegionOtomations(): Promise<
  { id: string; code: string; dusun: string; type: string }[]
> {
  try {
    const rows = await prisma.regionOtomation.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }],
    });
    return rows;
  } catch (e) {
    console.error("Region Otomation Query Error:", e);
    return [];
  }
}

export async function addRegionOtomation(type: "RT" | "RW", code: string, dusun: string) {
  try {
    await requireAdmin();
    const normCode = parseInt(code.trim(), 10).toString().padStart(2, "0");
    if (!normCode || !dusun) throw new Error("Kode dan Dusun harus diisi");

    await prisma.regionOtomation.upsert({
      where: { code: normCode },
      update: { dusun, type },
      create: { type, code: normCode, dusun },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Add Region Otomation Error:", error);
    return { success: false, message: formatZodError(error) };
  }
}

export async function deleteRegionOtomation(id: string) {
  try {
    await requireAdmin();
    await prisma.regionOtomation.delete({
      where: { id },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Delete Region Otomation Error:", error);
    return { success: false, message: formatZodError(error) };
  }
}

export async function checkImportRequirements(tahun: number) {
  try {
    const dusunCount = await prisma.dusunReference.count();
    const otomationCount = await prisma.regionOtomation.count();

    const taxCount = await prisma.taxData.count({
      where: { tahun },
    });

    return {
      success: true,
      dusunCount,
      otomationCount,
      taxCount,
    };
  } catch (error) {
    console.error("Check Requirements Error:", error);
    return { success: false, message: "Gagal mengecek persyaratan import" };
  }
}

// --- Arsip Digital PBB ---
import { PDFDocument } from "pdf-lib";
const pdf = require("pdf-parse/lib/pdf-parse.js");

const BASE_ARCHIVE_DIR = path.join(process.cwd(), "public", "arsip-pbb");

function getArchiveDir(year: number) {
  return path.join(BASE_ARCHIVE_DIR, year.toString());
}

/** Smart Action to Split Large PDF by NOP */
export async function processSmartArchive(formData: FormData) {
  const logDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logPath = path.join(logDir, "pbb_process_log.txt");
  fs.writeFileSync(logPath, `--- STARTING SMART SCAN --- ${new Date().toISOString()}\n`);
  
  try {
    await requireAdmin();
    const file = formData.get("file") as File;
    const yearRaw = formData.get("year");
    const year = yearRaw ? parseInt(yearRaw.toString()) : new Date().getFullYear();
    const archiveDir = getArchiveDir(year);

    if (!file || file.size === 0) {
       fs.appendFileSync(logPath, "ERROR: File is empty or not found\n");
       return { success: false, message: "File kosong" };
    }

    fs.appendFileSync(logPath, `Processing file: ${file.name} (${file.size} bytes)\n`);

    const arrayBuffer = await file.arrayBuffer();
    let buffer: Buffer | null = Buffer.from(arrayBuffer);
    const mainPdfDoc = await PDFDocument.load(buffer);
    
    // Clear buffer to free memory
    buffer = null;

    const totalPages = mainPdfDoc.getPageCount();

    fs.appendFileSync(logPath, `Total Pages: ${totalPages}\n`);

    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    let detectedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < totalPages; i++) {
        try {
          const subPdfDoc = await PDFDocument.create();
          const [copiedPage] = await subPdfDoc.copyPages(mainPdfDoc, [i]);
          subPdfDoc.addPage(copiedPage);
          const subPdfBytes = await subPdfDoc.save();

          // Extract text
          let rawText = "";
          try {
            const data = await pdf(Buffer.from(subPdfBytes));
            rawText = data.text || "";
          } catch (e) {
            fs.appendFileSync(logPath, `PAGE ${i+1}: Extraction library error -> ${e}\n`);
          }

          const cleanText = rawText.replace(/\D/g, "");
          
          fs.appendFileSync(logPath, `PAGE ${i+1}: Extracted text length ${rawText.length}\n`);

          // Cari NOP
          let nop = "";
          const matches = cleanText.match(/3517\d{14}/g);
          
          if (matches && matches[0]) {
            nop = matches[0];
          } else {
            const any18 = cleanText.match(/\d{18}/g);
            if (any18 && any18[0]) nop = any18[0];
          }

          if (nop) {
            const filename = `${nop}.pdf`;
            fs.writeFileSync(path.join(archiveDir, filename), subPdfBytes);
            detectedCount++;
            fs.appendFileSync(logPath, `PAGE ${i+1}: NOP FOUND -> ${nop}\n`);
          } else {
            fs.appendFileSync(logPath, `PAGE ${i+1}: NO NOP DETECTED IN CLEAN TEXT\n`);
            skippedCount++;
          }
        } catch (pageError) {
          fs.appendFileSync(logPath, `PAGE ${i+1}: FATAL ERROR -> ${pageError}\n`);
          skippedCount++;
        }
    }

    revalidatePath("/admin/settings");
    return { 
      success: true, 
      message: `Pemindaian selesai! Berhasil: ${detectedCount}, Terlewati: ${skippedCount}.` 
    };
  } catch (error) {
    fs.appendFileSync(logPath, `FATAL CRASH: ${error}\n`);
    return { success: false, message: "Gagal fatal. Cek log pbb_process_log.txt" };
  }
}

/** Get list of all archive filenames and sizes by year */
export async function getArchiveList(year: number): Promise<{ name: string; size: number }[]> {
  try {
    const archiveDir = getArchiveDir(year);
    if (!fs.existsSync(archiveDir)) return [];
    const files = fs.readdirSync(archiveDir).filter(f => !f.startsWith("."));
    return files.map(f => {
      const filePath = path.join(archiveDir, f);
      const stat = fs.statSync(filePath);
      return { name: f, size: stat.size };
    }).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error(error);
    return [];
  }
}

/** Check if an archive exists for a specific NOP and year */
export async function checkArchiveByNop(nop: string, year: number) {
  try {
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
    
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    let successCount = 0;
    for (const file of files) {
      if (!file.name || file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = assertSafeFilename(file.name);
      const filePath = resolveSafeChildPath(archiveDir, filename);
      fs.writeFileSync(filePath, buffer);
      successCount++;
    }

    revalidatePath("/admin/settings");
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
    revalidatePath("/arsip-pbb");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal menghapus file arsip" };
  }
}
