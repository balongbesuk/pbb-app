#!/usr/bin/env node
/**
 * axe-audit.js — Audit aksesibilitas & kontras warna otomatis
 * menggunakan axe-core via Puppeteer.
 *
 * Jalankan setelah `npm run dev`:
 *   node scripts/axe-audit.js
 *
 * Atau dari package.json:
 *   npm run audit:a11y
 */

const puppeteer = require("puppeteer");
const { default: AxePuppeteer } = require("@axe-core/puppeteer");

const BASE_URL = "http://localhost:3000";

/** Halaman-halaman yang akan diaudit */
const PAGES = [
  { name: "Dashboard",    path: "/" },
  { name: "Data Pajak",  path: "/data-pajak" },
  { name: "Pengguna",    path: "/pengguna" },
  { name: "Laporan",     path: "/laporan" },
  { name: "Log Aktivitas", path: "/log-aktivitas" },
  { name: "Pengaturan",  path: "/settings" },
];

/** Rule axe yang difokuskan: kontras  + ARIA */
const AXE_OPTIONS = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
  },
};

const SEVERITY_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

function colorize(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}
const red    = (t) => colorize(t, 31);
const yellow = (t) => colorize(t, 33);
const green  = (t) => colorize(t, 32);
const cyan   = (t) => colorize(t, 36);
const bold   = (t) => colorize(t, 1);

async function auditPage(page, route) {
  const url = `${BASE_URL}${route.path}`;
  console.log(cyan(`\n▶ Mengaudit: ${bold(route.name)} (${url})`));

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    // Tunggu sebentar untuk komponen client-side mount
    await new Promise((r) => setTimeout(r, 1500));

    const results = await new AxePuppeteer(page).options(AXE_OPTIONS).analyze();

    const violations = results.violations.sort(
      (a, b) => (SEVERITY_ORDER[a.impact] ?? 9) - (SEVERITY_ORDER[b.impact] ?? 9)
    );

    if (violations.length === 0) {
      console.log(green("  ✅ Tidak ditemukan pelanggaran aksesibilitas."));
      return { page: route.name, violations: 0, items: [] };
    }

    console.log(
      red(`  ❌ Ditemukan ${violations.length} pelanggaran:\n`)
    );

    const summary = [];
    for (const v of violations) {
      const impactColor = v.impact === "critical" || v.impact === "serious" ? red : yellow;
      console.log(`  ${impactColor(`[${v.impact?.toUpperCase()}]`)} ${bold(v.id)}`);
      console.log(`         ${v.description}`);
      console.log(`         Help: ${v.helpUrl}`);

      for (const node of v.nodes.slice(0, 3)) {
        console.log(`         › ${node.html.slice(0, 120)}`);
        for (const check of [...(node.any || []), ...(node.all || []), ...(node.none || [])]) {
          if (check.message) {
            console.log(`           → ${check.message}`);
          }
        }
      }
      if (v.nodes.length > 3) {
        console.log(`         ... dan ${v.nodes.length - 3} elemen lainnya.\n`);
      }
      console.log();

      summary.push({ id: v.id, impact: v.impact, description: v.description });
    }

    return { page: route.name, violations: violations.length, items: summary };
  } catch (err) {
    console.error(red(`  ⚠️  Gagal mengaudit ${url}: ${err.message}`));
    return { page: route.name, violations: -1, items: [], error: err.message };
  }
}

async function main() {
  console.log(bold(cyan("\n╔══════════════════════════════════════════════╗")));
  console.log(bold(cyan("║  PBB Manager — Audit Aksesibilitas (axe-core)  ║")));
  console.log(bold(cyan("╚══════════════════════════════════════════════╝\n")));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Inject session cookie agar halaman login bisa dilewati
  // (sesuaikan jika menggunakan next-auth)
  // await page.setCookie({ name: 'next-auth.session-token', value: 'YOUR_TOKEN', domain: 'localhost' });

  const allResults = [];
  for (const route of PAGES) {
    const result = await auditPage(page, route);
    allResults.push(result);
  }

  await browser.close();

  // Ringkasan akhir
  console.log(bold(cyan("\n══════════════ RINGKASAN AUDIT ══════════════")));
  let totalViolations = 0;
  for (const r of allResults) {
    if (r.violations < 0) {
      console.log(`  ${yellow("⚠️")}  ${r.page.padEnd(20)} — Gagal diaudit: ${r.error}`);
    } else if (r.violations === 0) {
      console.log(`  ${green("✅")}  ${r.page.padEnd(20)} — Tidak ada pelanggaran`);
    } else {
      console.log(`  ${red("❌")}  ${r.page.padEnd(20)} — ${r.violations} pelanggaran`);
      totalViolations += r.violations;
    }
  }
  console.log(bold(`\n  Total pelanggaran: ${totalViolations === 0 ? green("0 ✅") : red(totalViolations)}`));
  console.log(cyan("═════════════════════════════════════════════\n"));

  process.exit(totalViolations > 0 ? 1 : 0);
}

main();
