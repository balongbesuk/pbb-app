"use server";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
const pdf = require("pdf-parse/lib/pdf-parse.js");
const { getArchivePath } = require("@/lib/storage");
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server-auth";
import { assertSafeFilename, resolveSafeChildPath } from "@/lib/file-security";

// Comprehensive Browser Polyfills for Server-side PDF Parsing (needed for pdf-lib/pdf-parse)
const noopClass = class {};
if (typeof (global as any).DOMMatrix === "undefined") (global as any).DOMMatrix = noopClass;
if (typeof (global as any).DOMPoint === "undefined") (global as any).DOMPoint = noopClass;
if (typeof (global as any).DOMRect === "undefined") (global as any).DOMRect = noopClass;
if (typeof (global as any).HTMLElement === "undefined") (global as any).HTMLElement = noopClass;
if (typeof (global as any).HTMLCanvasElement === "undefined") (global as any).HTMLCanvasElement = noopClass;
if (typeof (global as any).Navigator === "undefined") (global as any).Navigator = noopClass;
if (typeof (global as any).Image === "undefined") (global as any).Image = noopClass;
if (typeof (global as any).ReadableStream === "undefined") (global as any).ReadableStream = noopClass;

function getArchiveDir(year: number) {
  return getArchivePath(year.toString());
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

    revalidatePath("/kelola-arsip");
    revalidatePath("/settings");
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
