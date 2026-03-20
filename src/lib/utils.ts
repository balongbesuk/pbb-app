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

/** Format date to ID: "20 Maret 2026 14:00" */
export function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Format date only (no time): "20 Maret 2026" */
export function formatDateNoTime(date: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/** Format falling date specifically (handles both date string and manual text) */
export function formatJatuhTempo(val: string | null) {
  if (!val) return "-";
  // If it's a date string (e.g., 2026-08-31), format it to "31 Agustus"
  if (val.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
    }).format(new Date(val));
  }
  return val;
}
