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
