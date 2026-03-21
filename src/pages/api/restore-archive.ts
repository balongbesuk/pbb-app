import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import Busboy from "busboy";
import AdmZip from "adm-zip";

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

  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  const send = (obj: object) => res.write(JSON.stringify(obj) + "\n");

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      send({ type: "done", success: false, message: "Unauthorized" });
      return res.end();
    }

    const meta = await parseMeta(req);
    const { sessionId, filename, totalChunks } = meta;
    const totalChunksNum = parseInt(totalChunks) || 0;

    if (!sessionId || !filename || !totalChunksNum) {
      send({ type: "done", success: false, message: "Data tidak lengkap." });
      return res.end();
    }

    // Gabungkan chunks
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
    const zipBuffer = Buffer.concat(allBuffers);

    // Bersihkan chunks
    for (let i = 0; i < totalChunksNum; i++) {
      try { fs.unlinkSync(path.join(tempDir, `${sessionId}_${i}`)); } catch { /* ignore */ }
    }

    // Ekstrak ZIP
    send({ type: "status", message: "Mengekstrak file..." });

    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    const totalEntries = entries.length;

    const publicDir = path.join(process.cwd(), "public");

    let restored = 0;
    let skipped = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Hanya proses file dalam folder arsip-pbb/
      if (!entry.entryName.startsWith("arsip-pbb/")) {
        skipped++;
        continue;
      }

      if (entry.isDirectory) continue;

      const targetPath = path.join(publicDir, entry.entryName);
      const targetDir = path.dirname(targetPath);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, entry.getData());
      restored++;

      // Kirim progress setiap 50 file
      if ((i + 1) % 50 === 0 || i === entries.length - 1) {
        send({ type: "progress", current: i + 1, total: totalEntries });
      }
    }

    send({
      type: "done",
      success: true,
      message: `Restore selesai! ${restored} file dipulihkan, ${skipped} dilompati.`,
    });

  } catch (error: any) {
    console.error("[restore-archive]", error);
    send({ type: "done", success: false, message: error.message || "Gagal restore." });
  } finally {
    res.end();
  }
}
