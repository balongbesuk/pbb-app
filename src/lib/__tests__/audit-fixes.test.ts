import { describe, it, expect, afterEach } from "vitest";
import AdmZip from "adm-zip";
import * as XLSX from "xlsx";
import { getClientIp } from "@/lib/request-ip";
import { restoreDatabaseFromZip } from "@/lib/restore";
import { buildJombangBapendaUrl } from "@/lib/bapenda-sync";
import { parseExcel } from "@/lib/excel-processor";

describe("getClientIp proxy safety", () => {
  const originalTrustProxy = process.env.TRUST_PROXY;

  afterEach(() => {
    if (originalTrustProxy === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = originalTrustProxy;
    }
  });

  it("ignores proxy headers when TRUST_PROXY is not enabled", () => {
    delete process.env.TRUST_PROXY;
    const ip = getClientIp({
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(ip).toBe("unknown");
  });

  it("uses the rightmost proxy-appended IP in x-forwarded-for instead of spoofed leftmost IP", () => {
    process.env.TRUST_PROXY = "true";
    const ip = getClientIp({
      headers: { "x-forwarded-for": "9.9.9.9, 203.0.113.42" },
    });
    expect(ip).toBe("203.0.113.42");
  });

  it("prioritizes cf-connecting-ip and x-real-ip when TRUST_PROXY is enabled", () => {
    process.env.TRUST_PROXY = "true";
    expect(
      getClientIp({
        headers: {
          "cf-connecting-ip": "198.51.100.7",
          "x-forwarded-for": "9.9.9.9, 203.0.113.42",
        },
      })
    ).toBe("198.51.100.7");
  });
});

describe("restoreDatabaseFromZip validation", () => {
  it("rejects zip files where dev.db does not have a valid SQLite magic header", async () => {
    const zip = new AdmZip();
    zip.addFile("dev.db", Buffer.from("not-an-sqlite-file-at-all"));
    const result = await restoreDatabaseFromZip(zip.toBuffer());
    expect(result.success).toBe(false);
    expect(result.message).toContain("SQLite");
  });

  it("rejects zip files containing disallowed entries", async () => {
    const zip = new AdmZip();
    zip.addFile("dev.db", Buffer.from("SQLite format 3\0padding"));
    zip.addFile("evil.sh", Buffer.from("echo pwn"));
    const result = await restoreDatabaseFromZip(zip.toBuffer());
    expect(result.success).toBe(false);
    expect(result.message).toContain("tidak diizinkan");
  });
});

describe("buildJombangBapendaUrl", () => {
  it("splits an 18-digit NOP into the 7 Jombang Bapenda query parameters", () => {
    const url = buildJombangBapendaUrl("351704001900602240");
    expect(url).toBe(
      "https://bapenda.jombangkab.go.id/cek-bayar/ceknopbayar-jmb.kab?module=pbb&kata=35&kata1=17&kata2=040&kata3=019&kata4=006&kata5=0224&kata6=0&viewpbb="
    );
  });
});

describe("parseExcel", () => {
  it("parses Indonesian date formats and sanitizes formula prefixes", async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "NOP",
        "NAMA WP",
        "ALAMAT",
        "LT",
        "LB",
        "KETETAPAN",
        "TAGIHAN DENDA",
        "PEMBAYARAN",
        "POKOK",
        "DENDA",
        "LEBIH BAYAR",
        "TANGGAL BAYAR",
        "SISA TAGIHAN",
        "TEMPAT BAYAR",
      ],
      [
        "35.17.040.019.006-0224.0",
        "=SUM(1,2) BUDI",
        "DSN BALONGBESUK RT 01 RW 02",
        120,
        60,
        50000,
        0,
        50000,
        50000,
        0,
        0,
        "04-MEI-26",
        0,
        "BANK JATIM",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "DHKP");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const rows = await parseExcel(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0].nop).toBe("35.17.040.019.006-0224.0");
    expect(rows[0].namaWp.startsWith("=")).toBe(false);
    expect(rows[0].ketetapan).toBe(50000);
    expect(rows[0].tanggalBayar).toBeInstanceOf(Date);
    expect(rows[0].tanggalBayar?.getFullYear()).toBe(2026);
    expect(rows[0].tanggalBayar?.getMonth()).toBe(4);
    expect(rows[0].tanggalBayar?.getDate()).toBe(4);
  });
});

