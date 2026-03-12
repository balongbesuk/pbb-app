import Fuse from "fuse.js";

export function normalizeAddress(address: string): string {
  if (!address) return "";
  return address
    .toUpperCase()
    .replace(/[:.,\/]/g, " ") // Replace punctuation with space
    .replace(/\s+/g, " ")
    .trim();
}

export function extractRTRW(address: string) {
  const norm = normalizeAddress(address);

  // RT detection: RT\s*[:.-]?\s*(\d{1,3})
  const rtRegex = /RT\s*[:.-]*\s*(\d{1,3})/i;
  const rwRegex = /RW\s*[:.-]*\s*(\d{1,3})/i;

  const rtMatch = norm.match(rtRegex);
  const rwMatch = norm.match(rwRegex);

  const normalizeNum = (val: string | null) => {
    if (!val) return null;
    const num = parseInt(val, 10);
    if (isNaN(num)) return null;
    // Format to 2 digits (e.g., 1 -> 01, 10 -> 10, 001 -> 01)
    return num.toString().padStart(2, "0").slice(-2);
  };

  let rt = normalizeNum(rtMatch ? rtMatch[1] : null);
  let rw = normalizeNum(rwMatch ? rwMatch[1] : null);

  // Alternative detection for "001/01" patterns
  if (!rt || !rw) {
    const splashRegex = /(\d{1,3})\s?\/\s?(\d{1,3})/;
    const splashMatch = norm.match(splashRegex);
    if (splashMatch) {
      if (!rt) rt = normalizeNum(splashMatch[1]);
      if (!rw) rw = normalizeNum(splashMatch[2]);
    }
  }

  // Last resort: find standalone 3-digit numbers if RT is missing
  if (!rt) {
    const standaloneDigitMatch = norm.match(/\b(\d{3})\b/);
    if (standaloneDigitMatch) {
      rt = normalizeNum(standaloneDigitMatch[1]);
    }
  }

  return { rt, rw };
}

export function detectDusun(address: string, dusunList: string[]): string | null {
  if (!address || dusunList.length === 0) return null;
  const norm = normalizeAddress(address);

  // 1. Direct search (normalized)
  const upperDusunList = dusunList.map((d) => d.toUpperCase());
  for (let i = 0; i < upperDusunList.length; i++) {
    if (norm.includes(upperDusunList[i])) {
      return dusunList[i];
    }
  }

  // 2. Fuzzy match
  const fuse = new Fuse(dusunList, {
    threshold: 0.2, // Min 80% similarity
    distance: 100,
  });

  const results = fuse.search(norm);
  if (results.length > 0) {
    return results[0].item;
  }

  return null;
}
