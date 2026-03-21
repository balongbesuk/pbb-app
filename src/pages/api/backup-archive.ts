import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

export const config = {
  api: { responseLimit: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const BASE_ARCHIVE_DIR = path.join(process.cwd(), "public", "arsip-pbb");
    if (!fs.existsSync(BASE_ARCHIVE_DIR)) {
      return res.status(404).json({ error: "Folder arsip tidak ditemukan." });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const zipName = `backup-arsip-pbb-${timestamp}.zip`;

    // Buat ZIP dari seluruh folder arsip-pbb
    const zip = new AdmZip();
    zip.addLocalFolder(BASE_ARCHIVE_DIR, "arsip-pbb");
    const zipBuffer = zip.toBuffer();

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
    res.setHeader("Content-Length", zipBuffer.length);
    res.setHeader("Cache-Control", "no-cache");
    res.send(zipBuffer);

  } catch (error: any) {
    console.error("[backup-archive]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Gagal membuat backup." });
    }
  }
}
