import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/server-auth";
import { getArchiveDir } from "@/lib/archive-utils";

type CompressionStreamMessage =
  | { type: "info"; message: string }
  | { type: "progress"; current: number; total: number; percent: number; file: string }
  | { type: "done"; success: boolean; message: string };

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const year = body?.year;
  if (!year) {
    return NextResponse.json({ error: "Missing year parameter" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: CompressionStreamMessage) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      send({ type: "info", message: "Menyiapkan mesin kompresi WASM..." });

      const baseDir = getArchiveDir(year);
      if (!fs.existsSync(baseDir)) {
        send({ type: "done", success: false, message: "Folder tahun tersebut tidak ditemukan." });
        controller.close();
        return;
      }

      const files = fs.readdirSync(baseDir).filter((file) => file.endsWith(".pdf"));
      if (files.length === 0) {
        send({ type: "done", success: true, message: "Tidak ada PDF di tahun ini." });
        controller.close();
        return;
      }

      const originalFetch = global.fetch;
      const globalScope = globalThis as Record<string, unknown>;
      globalScope.fetch = undefined;

      let gs: {
        FS: {
          writeFile: (filePath: string, data: Buffer) => void;
          readFile: (filePath: string) => Uint8Array;
          unlink: (filePath: string) => void;
        };
        callMain: (args: string[]) => void;
      };

      try {
        const GhostscriptModule = await import("@jspawn/ghostscript-wasm");
        const Ghostscript = GhostscriptModule.default;
        gs = await Ghostscript({
          locateFile: (fname: string) =>
            path.join(process.cwd(), "node_modules", "@jspawn", "ghostscript-wasm", fname),
        });
      } catch {
        globalScope.fetch = originalFetch;
        send({
          type: "done",
          success: false,
          message: "Gagal memuat sistem kompresi Ghostscript.",
        });
        controller.close();
        return;
      }

      let totalCompressed = 0;
      let totalSavedBytes = 0;

      try {
        for (let i = 0; i < files.length; i++) {
          if (req.signal.aborted) {
            break;
          }

          const fname = files[i];
          const filePath = path.join(baseDir, fname);
          const stats = fs.statSync(filePath);

          if (stats.size > 500 * 1024) {
            try {
              const rawBytes = fs.readFileSync(filePath);

              gs.FS.writeFile("input.pdf", rawBytes);
              gs.callMain([
                "-sDEVICE=pdfwrite",
                "-dCompatibilityLevel=1.4",
                "-dPDFSETTINGS=/ebook",
                "-dNOPAUSE",
                "-dQUIET",
                "-dBATCH",
                "-sOutputFile=output.pdf",
                "input.pdf",
              ]);

              const compressedBytes = gs.FS.readFile("output.pdf");
              const newSize = compressedBytes.length;

              if (newSize < stats.size && newSize > 0) {
                fs.writeFileSync(filePath, Buffer.from(compressedBytes));
                totalSavedBytes += stats.size - newSize;
                totalCompressed++;
              }

              try {
                gs.FS.unlink("input.pdf");
              } catch {}
              try {
                gs.FS.unlink("output.pdf");
              } catch {}
            } catch {
              // Skip file yang gagal dikompres agar proses massal tetap lanjut.
            }
          }

          send({
            type: "progress",
            current: i + 1,
            total: files.length,
            percent: Math.round(((i + 1) / files.length) * 100),
            file: fname,
          });

          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        const savedMB = (totalSavedBytes / 1024 / 1024).toFixed(2);
        send({
          type: "done",
          success: true,
          message: `Kompresi Selesai! Mengompres ${totalCompressed} file dan menghemat penyimpanan sebesar ${savedMB} MB.`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Server Error";
        send({ type: "done", success: false, message });
      } finally {
        globalScope.fetch = originalFetch;
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
