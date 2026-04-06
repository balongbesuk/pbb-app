import type { NextApiRequest } from "next";
import path from "path";
import fs from "fs";
import Busboy from "busboy";
import { assertSafeSessionId } from "@/lib/file-security";

export const CHUNK_UPLOAD_DIR = path.join(process.cwd(), "tmp", "upload-chunks");

export function ensureChunkUploadDir() {
  if (!fs.existsSync(CHUNK_UPLOAD_DIR)) {
    fs.mkdirSync(CHUNK_UPLOAD_DIR, { recursive: true });
  }
  return CHUNK_UPLOAD_DIR;
}

export function cleanupStaleChunks(tempDir: string = CHUNK_UPLOAD_DIR) {
  try {
    if (!fs.existsSync(tempDir)) return;
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;
    for (const file of fs.readdirSync(tempDir)) {
      const filePath = path.join(tempDir, file);
      if (now - fs.statSync(filePath).mtimeMs > twoHours) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Abaikan cleanup failure agar upload utama tetap jalan.
  }
}

export function parseMultipartFields(req: NextApiRequest): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers as Record<string, string> });
    const meta: Record<string, string> = {};
    busboy.on("field", (name: string, val: string) => {
      meta[name] = val;
    });
    busboy.on("finish", () => resolve(meta));
    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

export function parseChunkUpload(
  req: NextApiRequest,
): Promise<{ chunkBuffer: Buffer | null; meta: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: req.headers as Record<string, string>,
      limits: { fileSize: 4 * 1024 * 1024 },
    });

    const chunks: Buffer[] = [];
    const meta: Record<string, string> = {};

    busboy.on("file", (_name: string, fileStream: NodeJS.ReadableStream) => {
      fileStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      fileStream.on("error", reject);
    });

    busboy.on("field", (name: string, val: string) => {
      meta[name] = val;
    });

    busboy.on("finish", () => {
      resolve({ chunkBuffer: chunks.length ? Buffer.concat(chunks) : null, meta });
    });
    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

export function writeChunk(sessionId: string, chunkIndex: number, chunkBuffer: Buffer) {
  const tempDir = ensureChunkUploadDir();
  const safeSessionId = assertSafeSessionId(sessionId);
  const chunkPath = path.join(tempDir, `${safeSessionId}_${chunkIndex}`);
  fs.writeFileSync(chunkPath, chunkBuffer);
  return { tempDir, safeSessionId, chunkPath };
}

export function assembleChunks(sessionId: string, totalChunks: number, tempDir: string = CHUNK_UPLOAD_DIR) {
  const safeSessionId = assertSafeSessionId(sessionId);
  const allBuffers: Buffer[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const chunkPath = path.join(tempDir, `${safeSessionId}_${i}`);
    if (!fs.existsSync(chunkPath)) {
      throw new Error(`Chunk ${i} tidak ditemukan. Upload ulang.`);
    }
    allBuffers.push(fs.readFileSync(chunkPath));
  }

  return { buffer: Buffer.concat(allBuffers), safeSessionId };
}

export function deleteChunks(sessionId: string, totalChunks: number, tempDir: string = CHUNK_UPLOAD_DIR) {
  const safeSessionId = assertSafeSessionId(sessionId);
  for (let i = 0; i < totalChunks; i++) {
    try {
      fs.unlinkSync(path.join(tempDir, `${safeSessionId}_${i}`));
    } catch {
      // Abaikan missing file saat cleanup.
    }
  }
}
