function getHeaderValue(
  headers: Headers | Record<string, string | string[] | undefined> | undefined,
  key: string
): string | null {
  if (!headers) return null;

  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(key);
  }

  const value = (headers as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function isProxyTrusted() {
  const raw = (process.env.TRUST_PROXY || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function normalizeIp(ip: string | null | undefined): string | null {
  if (!ip) {
    return null;
  }

  const trimmed = ip.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed === "::1") {
    return "127.0.0.1";
  }

  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }

  return trimmed;
}

export function getClientIp(
  req: { headers?: Headers | Record<string, string | string[] | undefined>; ip?: string | null }
): string {
  const directIp = normalizeIp(req.ip);
  if (directIp) {
    return directIp;
  }

  if (isProxyTrusted()) {
    const forwarded = getHeaderValue(req.headers, "x-forwarded-for");
    if (forwarded) {
      const firstForwardedIp = normalizeIp(forwarded.split(",")[0]);
      if (firstForwardedIp) {
        return firstForwardedIp;
      }
    }

    const realIp = normalizeIp(getHeaderValue(req.headers, "x-real-ip"));
    if (realIp) {
      return realIp;
    }
  }

  return "unknown";
}
