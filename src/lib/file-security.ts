import path from "path";

export function assertSafeFilename(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Nama file tidak valid.");
  }

  const baseName = path.basename(trimmed);
  if (baseName !== trimmed || baseName === "." || baseName === "..") {
    throw new Error("Nama file mengandung path yang tidak diizinkan.");
  }

  if (/[<>:"/\\|?*\x00-\x1F]/.test(baseName)) {
    throw new Error("Nama file mengandung karakter yang tidak diizinkan.");
  }

  return baseName.replace(/\s+/g, "_");
}

export function resolveSafeChildPath(baseDir: string, relativePath: string): string {
  const trimmed = relativePath.trim();
  if (!trimmed) {
    throw new Error("Path file tidak valid.");
  }

  const normalizedRelative = path.normalize(trimmed).replace(/^(\.\.(\/|\\|$))+/, "");
  if (
    path.isAbsolute(trimmed) ||
    normalizedRelative.startsWith("..") ||
    normalizedRelative.includes(`..${path.sep}`)
  ) {
    throw new Error("Path file keluar dari direktori yang diizinkan.");
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, normalizedRelative);

  if (
    resolvedTarget !== resolvedBase &&
    !resolvedTarget.startsWith(`${resolvedBase}${path.sep}`)
  ) {
    throw new Error("Path file keluar dari direktori yang diizinkan.");
  }

  return resolvedTarget;
}

export function assertSafeSessionId(input: string): string {
  const trimmed = input.trim();
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(trimmed)) {
    throw new Error("Session upload tidak valid.");
  }

  return trimmed;
}

const IMAGE_SIGNATURES: Record<string, (buffer: Buffer) => boolean> = {
  "image/jpeg": (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  "image/jpg": (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  "image/png": (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a,
  "image/webp": (buffer) =>
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP",
};

export function assertValidImageUpload(buffer: Buffer, mimeType: string): void {
  const validator = IMAGE_SIGNATURES[mimeType];
  if (!validator || !validator(buffer)) {
    throw new Error("Isi file gambar tidak valid atau tidak sesuai format.");
  }
}
