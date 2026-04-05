import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PDFDocument } from "pdf-lib";
import path from "path";
import fs from "fs";
import Busboy from "busboy";
import { PrismaClient } from "@prisma/client";
import { assertSafeSessionId } from "@/lib/file-security";
import pdfParse, {
  type PdfPageData,
  type PdfTextContentItem,
} from "pdf-parse/lib/pdf-parse.js";
import { getArchivePath } from "@/lib/storage";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

// ── Cleanup chunk lama (>2 jam) ───────────────────────────────────────────────
function cleanupStaleChunks(tempDir: string) {
  try {
    if (!fs.existsSync(tempDir)) return;
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    for (const file of fs.readdirSync(tempDir)) {
      const filePath = path.join(tempDir, file);
      if (now - fs.statSync(filePath).mtimeMs > TWO_HOURS) fs.unlinkSync(filePath);
    }
  } catch { /* silent */ }
}

function parseMeta(req: NextApiRequest): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers as Record<string, string> });
    const meta: Record<string, string> = {};
    busboy.on("field", (name: string, val: string) => { meta[name] = val; });
    busboy.on("finish", () => resolve(meta));
    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

function extractNop(text: string): string {
  const clean = text.replace(/\D/g, "");
  const m = clean.match(/3517\d{14}/g);
  if (m?.[0]) return m[0];
  const a = clean.match(/\d{18}/g);
  if (a?.[0]) return a[0];
  return "";
}

/**
 * Ekstrak teks per halaman dari seluruh PDF sekaligus via pdf-parse pagerender.
 * JAUH lebih efisien.
 */
async function extractPerPageTexts(fileBuffer: Buffer, totalPages: number): Promise<string[]> {
  const pageTexts: string[] = new Array(totalPages).fill("");
  let currentPage = 0;

  await pdfParse(fileBuffer, {
    pagerender: async (pageData: PdfPageData) => {
      try {
        const tc = await pageData.getTextContent();
        const text = tc.items.map((item: PdfTextContentItem) => item.str || "").join(" ");
        pageTexts[currentPage] = text;
      } catch { /* skip */ }
      currentPage++;
      return "";
    },
  });

  return pageTexts;
}



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const userRole = session?.user && "role" in session.user ? session.user.role : undefined;
  if (!session || userRole !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  const send = (obj: object) => res.write(JSON.stringify(obj) + "\n");
  const logPath = path.join(process.cwd(), "public", "pbb_process_log.txt");
  const tempDir = path.join(process.cwd(), "tmp", "upload-chunks");

  fs.writeFileSync(logPath, `--- SMART SCAN (TURBO MODE) --- ${new Date().toISOString()}\n`);

  try {
    const meta = await parseMeta(req);
    const { sessionId, filename, totalChunks, year: yearRaw } = meta;
    const year = parseInt(yearRaw) || new Date().getFullYear();
    const totalChunksNum = parseInt(totalChunks) || 0;

    let safeSessionId: string;
    try {
      safeSessionId = assertSafeSessionId(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Session upload tidak valid.";
      send({ type: "done", success: false, message });
      return res.end();
    }

    cleanupStaleChunks(tempDir);
    send({ type: "status", message: "Menggabungkan file..." });
    fs.appendFileSync(logPath, `Session ID: ${safeSessionId}, chunks: ${totalChunksNum}\n`);

    const allBuffers: Buffer[] = [];
    for (let i = 0; i < totalChunksNum; i++) {
      const chunkPath = path.join(tempDir, `${safeSessionId}_${i}`);
      if (!fs.existsSync(chunkPath)) {
        send({ type: "done", success: false, message: `Chunk ${i} tidak ditemukan. Upload ulang.` });
        return res.end();
      }
      allBuffers.push(fs.readFileSync(chunkPath));
    }
    const fileBuffer = Buffer.concat(allBuffers);

    for (let i = 0; i < totalChunksNum; i++) {
      try { fs.unlinkSync(path.join(tempDir, `${safeSessionId}_${i}`)); } catch { /* ignore */ }
    }

    fs.appendFileSync(logPath, `File: ${filename} (${fileBuffer.length} bytes), Year: ${year}\n`);

    send({ type: "status", message: "Membaca PDF..." });
    const mainPdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = mainPdfDoc.getPageCount();
    
    send({ type: "status", message: "Memuat daftar NOP dari database..." });
    const dbNopRows = await prisma.taxData.findMany({ where: { tahun: year }, select: { nop: true } });
    const validNopSet = new Set(dbNopRows.map((row) => row.nop.replace(/\D/g, "")));

    const archiveDir = getArchivePath(year.toString());
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    const existingFiles = new Set(fs.readdirSync(archiveDir));

    send({ type: "status", message: `Mengekstrak teks ${totalPages} halaman...` });
    send({ type: "progress", current: 0, total: totalPages, phase: "extract" });
    const pageTexts = await extractPerPageTexts(fileBuffer, totalPages);
    send({ type: "progress", current: totalPages, total: totalPages, phase: "extract" });

    const nopMap = new Map<number, string>();
    for (let i = 0; i < pageTexts.length; i++) {
      const nop = extractNop(pageTexts[i]);
      if (nop) nopMap.set(i, nop);
    }

    send({ type: "status", message: `Memeriksa hasil & Menyimpan (${nopMap.size} file mentah)...` });

    let detected = 0, duplicates = 0, invalidDb = 0;
    const pagesWithNop = Array.from(nopMap.entries()).sort(([a], [b]) => a - b);
    
    // Batch raksasa pun aman tanpa WASM memori, tapi dibatasi 20 agar stabil (pdf-lib murni)
    const SAVE_BATCH = 20;

    for (let batch = 0; batch < pagesWithNop.length; batch += SAVE_BATCH) {
      const batchSlice = pagesWithNop.slice(batch, batch + SAVE_BATCH);
      await Promise.all(
        batchSlice.map(async ([i, nop]) => {
          try {
            const fname = `${nop}.pdf`;
            if (existingFiles.has(fname)) { duplicates++; return; }
            if (validNopSet.size > 0 && !validNopSet.has(nop)) { invalidDb++; return; }

            // 1. Ekstrak 1 halaman dari PDF utama via pdf-lib
            const subDoc = await PDFDocument.create();
            const [page] = await subDoc.copyPages(mainPdfDoc, [i]);
            subDoc.addPage(page);
            
            // 2. Simpan hasil mentahan ke harddisk (Super Cepat)
            const rawBytes = await subDoc.save({ useObjectStreams: true });
            fs.writeFileSync(path.join(archiveDir, fname), rawBytes);
            existingFiles.add(fname);
            fs.appendFileSync(logPath, `PAGE ${i + 1}: SAVED (${(rawBytes.length / 1024).toFixed(0)} KB) -> ${nop}\n`);
            detected++;
          } catch (err) {
            fs.appendFileSync(logPath, `PAGE ${i + 1}: ERROR -> ${err}\n`);
          }
        })
      );
      
      send({
        type: "progress",
        current: Math.min(batch + SAVE_BATCH, pagesWithNop.length),
        total: pagesWithNop.length,
        phase: "save",
      });
    }

    const pagesNoNop = totalPages - nopMap.size;
    const lines = [
      `✅ Tersimpan: ${detected}`,
      duplicates > 0 ? `⚠️ Duplikat: ${duplicates}` : null,
      invalidDb > 0 ? `🔍 Tidak ada DB: ${invalidDb}` : null,
      pagesNoNop > 0 ? `📄 Tanpa NOP: ${pagesNoNop}` : null,
    ].filter(Boolean).join(" | ");

    fs.appendFileSync(logPath, `DONE: ${lines}\n`);
    send({ type: "done", success: true, message: `Pindai Selesai (Cepat Sekali)! ${lines}` });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";
    console.error("[smart-scan]", error);
    fs.appendFileSync(logPath, `FATAL: ${error}\n`);
    send({ type: "done", success: false, message });
  } finally {
    await prisma.$disconnect();
    res.end();
  }
}
