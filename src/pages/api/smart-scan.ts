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

    // Assemble chunks from temp directory
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

    // Clean up chunks
    for (let i = 0; i < totalChunksNum; i++) {
      try { fs.unlinkSync(path.join(tempDir, `${sessionId}_${i}`)); } catch { /* ignore */ }
    }

    fs.writeFileSync(
      logPath,
      `--- SMART SCAN (CHUNKED) --- ${new Date().toISOString()}\nFile: ${filename} (${fileBuffer.length} bytes), Year: ${year}\n`
    );

    const mainPdfDoc = await PDFDocument.load(fileBuffer);
    const totalPages = mainPdfDoc.getPageCount();
    fs.appendFileSync(logPath, `Total Pages: ${totalPages}\n`);

    send({ type: "progress", current: 0, total: totalPages });

    const archiveDir = path.join(process.cwd(), "public", "arsip-pbb", year.toString());
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

    let detectedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < totalPages; i++) {
      try {
        const subPdfDoc = await PDFDocument.create();
        const [copiedPage] = await subPdfDoc.copyPages(mainPdfDoc, [i]);
        subPdfDoc.addPage(copiedPage);
        const subPdfBytes = await subPdfDoc.save();

        let rawText = "";
        try {
          const data = await pdfParse(Buffer.from(subPdfBytes));
          rawText = data.text || "";
        } catch { /* silent */ }

        const cleanText = rawText.replace(/\D/g, "");
        let nop = "";
        const m = cleanText.match(/3517\d{14}/g);
        if (m?.[0]) { nop = m[0]; }
        else { const a = cleanText.match(/\d{18}/g); if (a?.[0]) nop = a[0]; }

        if (nop) {
          fs.writeFileSync(path.join(archiveDir, `${nop}.pdf`), subPdfBytes);
          fs.appendFileSync(logPath, `PAGE ${i + 1}: NOP -> ${nop}\n`);
          detectedCount++;
        } else {
          fs.appendFileSync(logPath, `PAGE ${i + 1}: NO NOP\n`);
          skippedCount++;
        }

        if ((i + 1) % 5 === 0 || i === totalPages - 1) {
          send({ type: "progress", current: i + 1, total: totalPages });
        }
      } catch (err) {
        fs.appendFileSync(logPath, `PAGE ${i + 1}: ERROR -> ${err}\n`);
        skippedCount++;
      }
    }

    send({
      type: "done",
      success: true,
      message: `Pemindaian selesai! Berhasil: ${detectedCount}, Terlewati: ${skippedCount}.`,
    });
  } catch (error: any) {
    console.error("[smart-scan]", error);
    fs.appendFileSync(logPath, `FATAL: ${error}\n`);
    send({ type: "done", success: false, message: error.message || "Server Error" });
  } finally {
    res.end();
  }
}
