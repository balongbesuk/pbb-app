import type { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument } from "pdf-lib";
import path from "path";
import fs from "fs";
import Busboy from "busboy";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

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

/** Extract NOP from text block */
function extractNop(text: string): string {
  const clean = text.replace(/\D/g, "");
  const m = clean.match(/3517\d{14}/g);
  if (m?.[0]) return m[0];
  const a = clean.match(/\d{18}/g);
  if (a?.[0]) return a[0];
  return "";
}

/** Process a batch of pages concurrently */
async function processBatch(
  mainPdfDoc: PDFDocument,
  pageIndices: number[],
  archiveDir: string,
  nopMap: Map<number, string>,
  logPath: string
): Promise<{ detected: number; skipped: number }> {
  let detected = 0;
  let skipped = 0;

  const tasks = pageIndices.map(async (i) => {
    try {
      const nop = nopMap.get(i);

      if (nop) {
        // Only create sub-PDF if we have a valid NOP
        const subDoc = await PDFDocument.create();
        const [page] = await subDoc.copyPages(mainPdfDoc, [i]);
        subDoc.addPage(page);
        const bytes = await subDoc.save();
        fs.writeFileSync(path.join(archiveDir, `${nop}.pdf`), bytes);
        fs.appendFileSync(logPath, `PAGE ${i + 1}: NOP -> ${nop}\n`);
        detected++;
      } else {
        skipped++;
      }
    } catch (err) {
      fs.appendFileSync(logPath, `PAGE ${i + 1}: ERROR -> ${err}\n`);
      skipped++;
    }
  });

  await Promise.all(tasks);
  return { detected, skipped };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // Streaming NDJSON
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  const send = (obj: object) => res.write(JSON.stringify(obj) + "\n");
  const logPath = path.join(process.cwd(), "public", "pbb_process_log.txt");

  try {
    const meta = await parseMeta(req);
    const { sessionId, filename, totalChunks, year: yearRaw } = meta;
    const year = parseInt(yearRaw) || new Date().getFullYear();
    const totalChunksNum = parseInt(totalChunks) || 0;

    if (!sessionId || !filename || !totalChunksNum) {
      send({ type: "done", success: false, message: "Data tidak lengkap." });
      return res.end();
    }

    // ---- Step 1: Assemble chunks ----
    send({ type: "status", message: "Menggabungkan file..." });
    const tempDir = path.join(process.cwd(), "tmp", "upload-chunks");
    const allBuffers: Buffer[] = [];
    for (let i = 0; i < totalChunksNum; i++) {
      const chunkPath = path.join(tempDir, `${sessionId}_${i}`);
      if (!fs.existsSync(chunkPath)) {
        send({ type: "done", success: false, message: `Chunk ${i} tidak ditemukan. Upload ulang.` });
        return res.end();
      }
      allBuffers.push(fs.readFileSync(chunkPath));
    }
    const fileBuffer = Buffer.concat(allBuffers);

    // Clean up chunks immediately
    for (let i = 0; i < totalChunksNum; i++) {
      try { fs.unlinkSync(path.join(tempDir, `${sessionId}_${i}`)); } catch { /* ignore */ }
    }

    fs.writeFileSync(
      logPath,
      `--- SMART SCAN OPTIMIZED --- ${new Date().toISOString()}\nFile: ${filename} (${fileBuffer.length} bytes), Year: ${year}\n`
    );

    // ---- Step 2: Load PDF and get page count ----
    send({ type: "status", message: "Membaca PDF..." });
    const mainPdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = mainPdfDoc.getPageCount();
    fs.appendFileSync(logPath, `Total Pages: ${totalPages}\n`);

    send({ type: "progress", current: 0, total: totalPages, phase: "extract" });

    // ---- Step 3: Extract all text at once (FAST!) ----
    send({ type: "status", message: `Mengekstrak teks dari ${totalPages} halaman sekaligus...` });
    const startExtract = Date.now();

    let fullText = "";
    try {
      const data = await pdfParse(fileBuffer);
      fullText = data.text || "";
    } catch (err) {
      fs.appendFileSync(logPath, `Full PDF text extraction failed: ${err}\n`);
    }

    const extractTime = ((Date.now() - startExtract) / 1000).toFixed(1);
    fs.appendFileSync(logPath, `Full text extraction: ${extractTime}s\n`);

    // ---- Step 4: Extract text per-page for NOP matching ----
    // We still need per-page text to match NOP to specific pages.
    // But we do it in batches of 20 for speed.
    send({ type: "status", message: "Mendeteksi NOP per halaman..." });

    const nopMap = new Map<number, string>();
    const EXTRACT_BATCH = 20;

    for (let batch = 0; batch < totalPages; batch += EXTRACT_BATCH) {
      const end = Math.min(batch + EXTRACT_BATCH, totalPages);
      const extractTasks = [];

      for (let i = batch; i < end; i++) {
        extractTasks.push(
          (async () => {
            try {
              const subDoc = await PDFDocument.create();
              const [page] = await subDoc.copyPages(mainPdfDoc, [i]);
              subDoc.addPage(page);
              const bytes = await subDoc.save();
              const data = await pdfParse(Buffer.from(bytes));
              const nop = extractNop(data.text || "");
              if (nop) nopMap.set(i, nop);
            } catch {
              // skip extraction error
            }
          })()
        );
      }

      await Promise.all(extractTasks);

      // Report progress every batch
      send({ type: "progress", current: end, total: totalPages, phase: "extract" });
    }

    fs.appendFileSync(logPath, `NOP detection done: ${nopMap.size} found out of ${totalPages}\n`);

    // ---- Step 5: Save PDFs only for pages with NOP (parallel batches of 10) ----
    const archiveDir = path.join(process.cwd(), "public", "arsip-pbb", year.toString());
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

    send({ type: "status", message: `Menyimpan ${nopMap.size} arsip...` });

    const pagesWithNop = Array.from(nopMap.keys()).sort((a, b) => a - b);
    const SAVE_BATCH = 10;
    let totalDetected = 0;

    for (let batch = 0; batch < pagesWithNop.length; batch += SAVE_BATCH) {
      const batchPages = pagesWithNop.slice(batch, batch + SAVE_BATCH);
      const result = await processBatch(mainPdfDoc, batchPages, archiveDir, nopMap, logPath);
      totalDetected += result.detected;

      send({
        type: "progress",
        current: Math.min(batch + SAVE_BATCH, pagesWithNop.length),
        total: pagesWithNop.length,
        phase: "save",
      });
    }

    const totalSkipped = totalPages - totalDetected;
    const totalTime = ((Date.now() - startExtract) / 1000).toFixed(1);
    fs.appendFileSync(logPath, `DONE in ${totalTime}s: ${totalDetected} saved, ${totalSkipped} skipped\n`);

    send({
      type: "done",
      success: true,
      message: `Pemindaian selesai dalam ${totalTime}s! Berhasil: ${totalDetected}, Terlewati: ${totalSkipped}.`,
    });
  } catch (error: any) {
    console.error("[smart-scan]", error);
    fs.appendFileSync(logPath, `FATAL: ${error}\n`);
    send({ type: "done", success: false, message: error.message || "Server Error" });
  } finally {
    res.end();
  }
}
