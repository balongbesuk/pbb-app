import path from "path";

function normalizeFileDatabaseUrl(databaseUrl: string): string {
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

export function resolveSqliteDatabasePath(databaseUrl = process.env.DATABASE_URL): string {
  const fallbackPath = path.join(/* turbopackIgnore: true */ process.cwd(), "dev.db");

  if (!databaseUrl) {
    return fallbackPath;
  }

  const normalized = normalizeFileDatabaseUrl(databaseUrl.trim());
  if (!normalized) {
    return fallbackPath;
  }

  return path.isAbsolute(normalized)
    ? normalized
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), normalized);
}
