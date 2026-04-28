import fs from "fs";
import { getArchivePath } from "@/lib/storage";

type ArchiveIndexCacheEntry = {
  mtimeMs: number;
  index: Map<string, string>;
};

const archiveIndexCache = new Map<string, ArchiveIndexCacheEntry>();

export function getArchiveDir(year: number | string): string {
  return getArchivePath(year.toString());
}

export function ensureArchiveDir(year: number | string): string {
  const archiveDir = getArchiveDir(year);
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  return archiveDir;
}

export function extractNopFromText(text: string): string {
  const cleanText = text.replace(/\D/g, "");
  const districtMatch = cleanText.match(/3517\d{14}/);
  if (districtMatch?.[0]) return districtMatch[0];

  const genericMatch = cleanText.match(/\d{18}/);
  if (genericMatch?.[0]) return genericMatch[0];

  return "";
}

export function buildArchiveIndex(archiveDir: string): Map<string, string> {
  if (!fs.existsSync(archiveDir)) {
    return new Map();
  }

  return new Map(
    fs
      .readdirSync(archiveDir)
      .map((filename) => [filename.replace(/\D/g, ""), filename] as const)
      .filter(([digits]) => Boolean(digits)),
  );
}

export function getCachedArchiveIndex(archiveDir: string): Map<string, string> {
  if (!fs.existsSync(archiveDir)) {
    archiveIndexCache.delete(archiveDir);
    return new Map();
  }

  const stat = fs.statSync(archiveDir);
  const cached = archiveIndexCache.get(archiveDir);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.index;
  }

  const index = buildArchiveIndex(archiveDir);
  archiveIndexCache.set(archiveDir, { mtimeMs: stat.mtimeMs, index });
  return index;
}

export function findArchiveFilenameByNop(
  archiveIndex: Map<string, string>,
  cleanNop: string
): string | null {
  if (!cleanNop) {
    return null;
  }

  const exactMatch = archiveIndex.get(cleanNop);
  if (exactMatch) {
    return exactMatch;
  }

  for (const [digits, filename] of archiveIndex.entries()) {
    if (digits.startsWith(cleanNop)) {
      return filename;
    }
  }

  return null;
}
