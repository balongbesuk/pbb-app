/**
 * Helper functions untuk SPOP print template.
 * Diekstrak dari spop-print.ts untuk memudahkan maintenance.
 */

/** HTML entity escape */
export const esc = (v: string) =>
  (v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Hanya digit */
export const digits = (v: string) => (v || "").replace(/\D/g, "");

/** Uppercase, sanitize whitespace */
export const text = (v: string) => {
  const s = (v || "").replace(/[\u0000-\u001F\u007F-\u009F]/g, "").replace(/\s+/g, " ").trim();
  return s.toUpperCase();
};

/** Format date menjadi DDMMYYYY */
export function formDate(v: string) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${d.getFullYear()}`;
}

/** Split date menjadi [DD, MM, YYYY] */
export function splitDate(v: string) {
  const s = formDate(v);
  return [s.slice(0, 2), s.slice(2, 4), s.slice(4, 8)];
}

/** Render grid cells */
export function cells(value: string, count: number, cls = "", align: "left" | "right" = "left") {
  const v = (value || "").slice(0, count);
  const chars = Array.from(align === "right" ? v.padStart(count, " ") : v.padEnd(count, " "));
  return `<div class="cells ${cls}">${chars
    .map((c) => `<span class="cell">${c === " " ? "&nbsp;" : esc(c)}</span>`)
    .join("")}</div>`;
}

/** Render option checkbox */
export const opt = (n: string, label: string, on: boolean) =>
  `<span class="opt"><span class="cb">${on ? "X" : ""}</span>${n ? `<span class="num">${esc(n)}.</span>` : ""}<span>${esc(label)}</span></span>`;

/** Render label */
export const label = (n: string, t: string, cls = "") =>
  `<div class="lbl ${cls}"><span class="no">${esc(n)}.</span><span>${esc(t)}</span></div>`;

/** Render section bar */
export const bar = (c: string, t: string) => `<div class="bar">${esc(c)}. ${esc(t)}</div>`;
