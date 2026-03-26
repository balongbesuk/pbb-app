import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { year } = req.body || {};
  if (!year) return res.status(400).json({ error: "Missing year parameter" });

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  const send = (obj: object) => res.write(JSON.stringify(obj) + "\n");

  const baseDir = path.join(process.cwd(), "storage", "arsip-pbb", year.toString());
  
  if (!fs.existsSync(baseDir)) {
    send({ type: "done", success: false, message: "Folder tahun tersebut tidak ditemukan." });
    return res.end();
  }

  const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.pdf'));
  
  if (files.length === 0) {
    send({ type: "done", success: true, message: "Tidak ada PDF di tahun ini." });
    return res.end();
  }

  // Load WASM securely once
  const originalFetch = global.fetch;
  (global as any).fetch = undefined;
  let gs: any;
  try {
    const GhostscriptModule = require("@jspawn/ghostscript-wasm");
    const Ghostscript = GhostscriptModule.default || GhostscriptModule;
    gs = await Ghostscript({
      locateFile: (fname: string) => path.join(process.cwd(), "node_modules", "@jspawn", "ghostscript-wasm", fname)
    });
  } catch (err) {
    global.fetch = originalFetch;
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
            send({ type: "done", success: false, message: `Dibatalkan. Mengompres ${totalCompressed} file sebelum berhenti.` });
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
            } catch (err) {
                // error ngompres skip saja
            }
        }
        
        // Kirim progress (persentase)
        const pct = Math.round(((i + 1) / files.length) * 100);
        send({ 
           type: "progress", 
           current: i + 1, 
           total: files.length,
           percent: pct
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

  } catch (error: any) {
    send({ type: "done", success: false, message: error.message || "Server Error" });
  } finally {
    global.fetch = originalFetch;
    res.end();
  }
}
