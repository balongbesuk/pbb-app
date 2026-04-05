import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getArchivePath } from "@/lib/storage";

type SessionUserWithRole = { role?: string | null };
type CompressionStreamMessage =
  | { type: "info"; message: string }
  | { type: "progress"; current: number; total: number; percent: number; file: string }
  | { type: "done"; success: boolean; message: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  const sessionUser = session?.user as SessionUserWithRole | undefined;
  if (!session || sessionUser?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { year } = req.body || {};
  if (!year) return res.status(400).json({ error: "Missing year parameter" });

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  const send = (obj: CompressionStreamMessage) => res.write(JSON.stringify(obj) + "\n");

  send({ type: "info", message: "Menyiapkan mesin kompresi WASM..." });

  const baseDir = getArchivePath(year.toString());
  
  if (!fs.existsSync(baseDir)) {
    send({ type: "done", success: false, message: "Folder tahun tersebut tidak ditemukan." });
    return res.end();
  }

  const files = fs.readdirSync(baseDir).filter((f: string) => f.endsWith('.pdf'));
  
  if (files.length === 0) {
    send({ type: "done", success: true, message: "Tidak ada PDF di tahun ini." });
    return res.end();
  }

  // Load WASM securely once
  const originalFetch = global.fetch;
  const globalScope = globalThis as Record<string, unknown>;
  globalScope.fetch = undefined;
  let gs: {
    FS: {
      writeFile: (path: string, data: Buffer) => void;
      readFile: (path: string) => Uint8Array;
      unlink: (path: string) => void;
    };
    callMain: (args: string[]) => void;
  };
  try {
    const GhostscriptModule = await import("@jspawn/ghostscript-wasm");
    const Ghostscript = GhostscriptModule.default;
    gs = await Ghostscript({
      locateFile: (fname: string) => path.join(process.cwd(), "node_modules", "@jspawn", "ghostscript-wasm", fname)
    });
  } catch {
    globalScope.fetch = originalFetch;
    send({ type: "done", success: false, message: "Gagal memuat sistem kompresi Ghostscript." });
    return res.end();
  }

  let isCanceled = false;
  req.on('close', () => {
    isCanceled = true;
  });

  let totalCompressed = 0;
  let totalSavedBytes = 0;
  
  try {
    for (let i = 0; i < files.length; i++) {
        if (isCanceled) {
            break;
        }

        const fname = files[i];
        const filePath = path.join(baseDir, fname);
        const stats = fs.statSync(filePath);
        
        // Kompres jika > 500 KB (Threshold normal hasil pdf-lib page mentah)
        if (stats.size > 500 * 1024) {
            try {
                const rawBytes = fs.readFileSync(filePath);
                
                // Proses WASM
                gs.FS.writeFile("input.pdf", rawBytes);
                gs.callMain([
                  "-sDEVICE=pdfwrite",
                  "-dCompatibilityLevel=1.4",
                  "-dPDFSETTINGS=/ebook",
                  "-dNOPAUSE",
                  "-dQUIET",
                  "-dBATCH",
                  "-sOutputFile=output.pdf",
                  "input.pdf"
                ]);

                const compressedBytes = gs.FS.readFile("output.pdf");
                const newSize = compressedBytes.length;

                if (newSize < stats.size && newSize > 0) {
                    fs.writeFileSync(filePath, Buffer.from(compressedBytes));
                    const saved = stats.size - newSize;
                    totalSavedBytes += saved;
                    totalCompressed++;
                }
                
                // Bersihkan memori virtual
                try { gs.FS.unlink("input.pdf"); } catch {}
                try { gs.FS.unlink("output.pdf"); } catch {}
            } catch {
                // error ngompres skip saja
            }
        }
        
        // Kirim progress (persentase)
        const pct = Math.round(((i + 1) / files.length) * 100);
        send({ 
           type: "progress", 
           current: i + 1, 
           total: files.length,
           percent: pct,
           file: fname
        });
        
        // Wajib yield event loop agar tidak memutus koneksi
        await new Promise(r => setTimeout(r, 10));
    }

    const savedMB = (totalSavedBytes / 1024 / 1024).toFixed(2);
    send({ 
      type: "done", 
      success: true, 
      message: `Kompresi Selesai! Mengompres ${totalCompressed} file dan menghemat penyimpanan sebesar ${savedMB} MB.` 
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Server Error";
    send({ type: "done", success: false, message });
  } finally {
    globalScope.fetch = originalFetch;
    res.end();
  }
}
