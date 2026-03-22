import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import Busboy from "busboy";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { assertSafeSessionId } from "@/lib/file-security";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

function parseChunk(req: NextApiRequest): Promise<{
  chunkBuffer: Buffer | null;
  meta: Record<string, string>;
}> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers as Record<string, string>,
      limits: { fileSize: 4 * 1024 * 1024 },
    });

    const chunks: Buffer[] = [];
    const meta: Record<string, string> = {};

    busboy.on("file", (_: string, fileStream: NodeJS.ReadableStream) => {
      fileStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      fileStream.on("error", reject);
    });

    busboy.on("field", (name: string, val: string) => { meta[name] = val; });

    busboy.on("finish", () =>
      resolve({ chunkBuffer: chunks.length ? Buffer.concat(chunks) : null, meta })
    );
    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { chunkBuffer, meta } = await parseChunk(req);
    const { sessionId, chunkIndex, filename } = meta;

    if (!chunkBuffer || !sessionId || chunkIndex === undefined || !filename) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const tempDir = path.join(process.cwd(), "tmp", "upload-chunks");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const safeSessionId = assertSafeSessionId(sessionId);
    const safeChunkIndex = Number.parseInt(chunkIndex, 10);
    if (!Number.isInteger(safeChunkIndex) || safeChunkIndex < 0) {
      return res.status(400).json({ success: false, error: "Invalid chunk index" });
    }

    const chunkPath = path.join(tempDir, `${safeSessionId}_${safeChunkIndex}`);
    fs.writeFileSync(chunkPath, chunkBuffer);

    return res.json({ success: true, chunkIndex: safeChunkIndex });
  } catch (err: any) {
    console.error("[upload-chunk]", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
