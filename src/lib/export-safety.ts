const FORMULA_PREFIX_PATTERN = /^[=+\-@]/;

export function sanitizeExcelText(value: unknown): string {
  const text = String(value ?? "").replace(/\u0000/g, "");
  return FORMULA_PREFIX_PATTERN.test(text) ? `'${text}` : text;
}

export function sanitizeExcelCellValue<T>(value: T): T | string {
  return typeof value === "string" ? sanitizeExcelText(value) : value;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
