import fs from "fs";
import path from "path";

export type CompressionStreamMessage =
  | { type: "info"; message: string }
  | { type: "progress"; current: number; total: number; percent: number; file: string }
  | { type: "done"; success: boolean; message: string };

type GhostscriptInstance = {
  FS: {
    writeFile: (filePath: string, data: Buffer) => void;
    readFile: (filePath: string) => Uint8Array;
    unlink: (filePath: string) => void;
  };
  callMain: (args: string[]) => void;
};

export async function compressArchiveFiles(
  baseDir: string,
  signal: AbortSignal,
  onMessage: (message: CompressionStreamMessage) => void,
) {
  onMessage({ type: "info", message: "Menyiapkan mesin kompresi WASM..." });

  if (!fs.existsSync(baseDir)) {
    onMessage({ type: "done", success: false, message: "Folder tahun tersebut tidak ditemukan." });
    return;
  }

  const files = fs.readdirSync(baseDir).filter((file) => file.endsWith(".pdf"));
  if (files.length === 0) {
    onMessage({ type: "done", success: true, message: "Tidak ada PDF di tahun ini." });
    return;
  }

  const originalFetch = global.fetch;
  const globalScope = globalThis as Record<string, unknown>;
  globalScope.fetch = undefined;

  let gs: GhostscriptInstance;
  try {
    const GhostscriptModule = await import("@jspawn/ghostscript-wasm");
    const Ghostscript = GhostscriptModule.default;
    gs = await Ghostscript({
      locateFile: (fname: string) =>
        path.join(process.cwd(), "node_modules", "@jspawn", "ghostscript-wasm", fname),
    });
  } catch {
    globalScope.fetch = originalFetch;
    onMessage({
      type: "done",
      success: false,
      message: "Gagal memuat sistem kompresi Ghostscript.",
    });
    return;
  }

  let totalCompressed = 0;
  let totalSavedBytes = 0;

  try {
    for (let i = 0; i < files.length; i++) {
      if (signal.aborted) {
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
          // Lanjutkan ke file berikutnya jika satu file gagal dikompres.
        }
      }

      onMessage({
        type: "progress",
        current: i + 1,
        total: files.length,
        percent: Math.round(((i + 1) / files.length) * 100),
        file: fname,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const savedMB = (totalSavedBytes / 1024 / 1024).toFixed(2);
    onMessage({
      type: "done",
      success: true,
      message: `Kompresi Selesai! Mengompres ${totalCompressed} file dan menghemat penyimpanan sebesar ${savedMB} MB.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";
    onMessage({ type: "done", success: false, message });
  } finally {
    globalScope.fetch = originalFetch;
  }
}
