import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import archiver from "archiver";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const config = {
  api: { responseLimit: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const BASE_ARCHIVE_DIR = path.join(process.cwd(), "storage", "arsip-pbb");
    if (!fs.existsSync(BASE_ARCHIVE_DIR)) {
      return res.status(404).json({ error: "Folder arsip tidak ditemukan." });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const zipName = `backup-arsip-pbb-${timestamp}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
    res.setHeader("Cache-Control", "no-cache");

    // stream zip to client
    const archive = archiver('zip', {
      zlib: { level: 2 } 
    });

    archive.on('error', (err) => {
      console.error("[backup-archive] archiver error:", err);
      if (!res.headersSent) {
          res.status(500).json({ error: "Gagal membuat stream zip" });
      }
      res.end();
    });

    archive.pipe(res);
    archive.directory(BASE_ARCHIVE_DIR, "arsip-pbb");
    
    await archive.finalize();

  } catch (error: any) {
    console.error("[backup-archive]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Gagal membuat backup." });
    }
  }
}
