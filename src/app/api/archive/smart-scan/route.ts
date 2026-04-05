import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { getArchivePath } from "@/lib/storage";
import { requireAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type SmartScanStreamMessage =
  | { type: "info"; message: string }
  | { type: "progress"; current: number; total: number; percent: number; nopLast: string }
  | { type: "done"; success: boolean; message: string; detectedCount?: number; skippedCount?: number };

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const yearRaw = formData.get("year");
    const year = yearRaw ? parseInt(yearRaw.toString()) : new Date().getFullYear();
    const archiveDir = getArchivePath(year.toString());

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (data: SmartScanStreamMessage) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        };

        try {
          sendProgress({ type: "info", message: `Memulai pemrosesan ${file.name}...` });
          
          const arrayBuffer = await file.arrayBuffer();
          const mainPdfDoc = await PDFDocument.load(Buffer.from(arrayBuffer));
          const totalPages = mainPdfDoc.getPageCount();
          
          if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
          }

          let detectedCount = 0;
          let skippedCount = 0;

          for (let i = 0; i < totalPages; i++) {
            if (req.signal.aborted) {
              return controller.close();
            }
            try {
              const subPdfDoc = await PDFDocument.create();
              const [copiedPage] = await subPdfDoc.copyPages(mainPdfDoc, [i]);
              subPdfDoc.addPage(copiedPage);
              const subPdfBytes = await subPdfDoc.save();

              // Extract text
              let rawText = "";
              try {
                const data = await pdfParse(Buffer.from(subPdfBytes));
                rawText = data.text || "";
              } catch {}

              const cleanText = rawText.replace(/\D/g, "");
              let nop = "";
              const matches = cleanText.match(/3517\d{14}/g);
              if (matches && matches[0]) nop = matches[0];
              else {
                const any18 = cleanText.match(/\d{18}/g);
                if (any18 && any18[0]) nop = any18[0];
              }

              if (nop) {
                const filename = `${nop}.pdf`;
                fs.writeFileSync(path.join(archiveDir, filename), subPdfBytes);
                detectedCount++;
              } else {
                skippedCount++;
              }

              // Send periodic progress
              sendProgress({
                type: "progress",
                current: i + 1,
                total: totalPages,
                percent: Math.round(((i + 1) / totalPages) * 100),
                nopLast: nop || "Tidak terdeteksi"
              });

            } catch {
              skippedCount++;
            }
          }

          sendProgress({
            type: "done",
            success: true,
            message: `Selesai! Berhasil: ${detectedCount}, Terlewati: ${skippedCount}.`,
            detectedCount,
            skippedCount
          });
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Internal Server Error";
          sendProgress({ type: "done", success: false, message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
