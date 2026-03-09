import Fuse from 'fuse.js';

export function normalizeAddress(address: string): string {
  if (!address) return '';
  return address
    .toUpperCase()
    .replace(/[:.,\/]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractRTRW(address: string) {
  const norm = normalizeAddress(address);
  
  // RT detection: RT\s*[:.]?\s*(\d{1,3})
  const rtRegex = /RT\s*(\d{1,3})/i;
  const rwRegex = /RW\s*(\d{1,2})/i;
  
  const rtMatch = norm.match(rtRegex);
  const rwMatch = norm.match(rwRegex);
  
  let rt = rtMatch ? rtMatch[1].padStart(3, '0') : null;
  let rw = rwMatch ? rwMatch[1].padStart(2, '0') : null;

  // Alternative detection for "001/01" patterns
  if (!rt || !rw) {
    const splashRegex = /(\d{1,3})\s?\/\s?(\d{1,2})/;
    const splashMatch = norm.match(splashRegex);
    if (splashMatch) {
      if (!rt) rt = splashMatch[1].padStart(3, '0');
      if (!rw) rw = splashMatch[2].padStart(2, '0');
    }
  }

  return { rt, rw };
}

export function detectDusun(address: string, dusunList: string[]): string | null {
  if (!address || dusunList.length === 0) return null;
  const norm = normalizeAddress(address);
  
  // 1. Direct search (normalized)
  const upperDusunList = dusunList.map(d => d.toUpperCase());
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
