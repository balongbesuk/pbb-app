import fs from "fs";
import { getArchivePath } from "@/lib/storage";

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
