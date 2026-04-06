import path from "path";

/**
 * Mendapatkan root path untuk penyimpanan arsip digital.
 * Default menggunakan folder 'storage' di dalam project root,
 * namun dapat dioverride melalui environment variable STORAGE_ROOT
 * untuk mempercepat build time Next.js (menghindari indexing di prod).
 */
export function getStorageRoot(): string {
  const envStorage = process.env.STORAGE_ROOT;

  if (envStorage) {
    return path.isAbsolute(envStorage)
      ? envStorage
      : path.join(/* turbopackIgnore: true */ process.cwd(), envStorage);
  }

  // Default fallback ke folder storage di dalam project root
  return path.join(/* turbopackIgnore: true */ process.cwd(), "storage");
}

export function getArchivePath(year?: string, filename?: string): string {
  const root = getStorageRoot();
  let fullPath = path.join(root, "arsip-pbb");
  
  if (year) {
    fullPath = path.join(fullPath, year);
  }
  
  if (filename) {
    fullPath = path.join(fullPath, filename);
  }
  
  return fullPath;
}
