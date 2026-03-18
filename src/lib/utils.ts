import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert "BALONGBESUK" → "Balongbesuk", "DIWEK" → "Diwek" */
export function toTitleCase(str: string) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format number to IDR Currency: 1000000 → "Rp 1.000.000" */
export function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);
}

/** Normalize RT/RW to 2-digit string: "1" → "01", "12" → "12", "" → "" */
export function normalizeNum(val: string) {
  if (!val) return val;
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  return num.padStart(2, "0").slice(-2);
}
